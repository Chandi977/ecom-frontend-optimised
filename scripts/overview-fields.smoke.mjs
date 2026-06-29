// Smoke test for the admin-controlled Product Detail fields feature.
//
// Runs the REAL storefront util (utils/overviewFields.ts) together with the
// REAL admin util (../ecom-admin-dashboard/src/utils/overviewFields.js) and
// asserts the cross-app contract:
//   - every auto field the storefront renders has a matching admin toggle
//     (keys line up: key === slugify(label)),
//   - an admin-saved config round-trips through the storefront (hide / reorder /
//     custom row), with standard values still computed live,
//   - per-product GST wins, falling back to sub_category -> category -> 18%,
//   - legacy keyless configs still render as an exclusive manual list.
//
// Run from ecom-frontend-optimised. Needs Node >= 22.18 / 24 for native TS type
// stripping (used to import the .ts util directly). If your Node predates
// default stripping, add the flag:
//   node --experimental-strip-types scripts/overview-fields.smoke.mjs

import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const sfPath = path.join(here, "..", "utils", "overviewFields.ts");
const adminPath = path.join(here, "..", "..", "ecom-admin-dashboard", "src", "utils", "overviewFields.js");

const sf = await import(pathToFileURL(sfPath).href);
const admin = await import(pathToFileURL(adminPath).href);

let failures = 0;
const assert = (name, cond, extra) => {
  if (cond) {
    console.log("  ✓", name);
  } else {
    failures++;
    console.error("  ✗", name, extra !== undefined ? "->" : "", extra !== undefined ? JSON.stringify(extra) : "");
  }
};

const tapeCategory = { _id: "6557df64301ec4f2f4266141", name: "Tape", slug: "tape", gst: 12 };
const tapeProduct = {
  name: "BOPP Tape",
  slug: "bopp-tape",
  model: "X",
  category: tapeCategory,
  gst: 5,
  breadth_mm: 48,
  length: 65,
  thickness_micron: 40,
  color: "brown",
  material: "BOPP",
  adhesive: "Hot Melt",
  hsn_code: "3919",
};

console.log("\nContract: admin offers a toggle for every storefront auto field");
{
  const autoKeys = sf
    .getOverviewFields(tapeProduct, 1, 0.2)
    .map((f) => admin.slugifyOverviewFieldKey(f.label));
  const candidateKeys = new Set(admin.buildOverviewCandidates(tapeProduct, []).map((c) => c.key));
  const missing = autoKeys.filter((k) => !candidateKeys.has(k));
  assert("every rendered auto field has an admin candidate key", missing.length === 0, missing);
}

console.log("\nRound-trip: admin config (hide GST, reorder, custom row) -> storefront");
{
  const candidates = admin.buildOverviewCandidates(tapeProduct, []);
  let fields = admin.mergeCandidatesWithSaved(candidates, []);
  // hide GST, add a custom row, move HSN Code to the front
  fields = fields.map((f) => (f.key === "gst" ? { ...f, visible: false } : f));
  fields.push({ key: "origin", label: "Origin", value: "India", visible: true, standard: false });
  const hsn = fields.find((f) => f.key === "hsn_code");
  fields = [hsn, ...fields.filter((f) => f.key !== "hsn_code")];

  const config = admin.serializeOverviewFields(fields);
  const rendered = sf.getOverviewFields({ ...tapeProduct, overview_fields: config }, 1, 0.2);
  const labels = rendered.map((f) => f.label);

  assert("standard rows are serialized without a stored value", config.every((r) => (r.key === "origin" ? "value" in r : !("value" in r) || r.key === "origin")));
  assert("hidden GST is dropped from the page", !labels.includes("GST"));
  assert("custom Origin row appears with its value", rendered.some((f) => f.label === "Origin" && f.value === "India"));
  assert("HSN Code is first (reorder respected)", labels[0] === "HSN Code");
  assert("standard Width (mm) shows the LIVE value, not a snapshot", (rendered.find((f) => f.label === "Width (mm)") || {}).value === "48");
  assert("unreferenced auto fields are appended (Colour visible)", labels.includes("Colour"));
}

console.log("\nGST priority: product wins, then sub_category, category, 18%");
{
  assert("product gst wins over category", sf.resolveGstRate(tapeProduct) === 5);
  assert("falls back to category when product unset", sf.resolveGstRate({ ...tapeProduct, gst: undefined }) === 12);
  assert(
    "falls back to sub_category before category",
    sf.resolveGstRate({ ...tapeProduct, gst: undefined, sub_category: { gst: 28 } }) === 28,
  );
  assert("defaults to 18 when nothing is set", sf.resolveGstRate({ name: "x", category: "id-string" }) === 18);
}

console.log("\nBack-compat: legacy keyless config renders exclusively");
{
  const legacy = sf.getOverviewFields({ ...tapeProduct, overview_fields: [{ label: "Foo", value: "Bar" }] }, 1, 0.2);
  assert("legacy manual list is shown as-is, no auto fields mixed in", legacy.length === 1 && legacy[0].label === "Foo");
}

console.log("");
if (failures > 0) {
  console.error(`SMOKE FAILED: ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("SMOKE PASSED: all overview-field + GST assertions held");
