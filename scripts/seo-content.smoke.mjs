// Smoke test for the sub-category SEO section: resolution from the API payload,
// the plain-text -> block parser, and the FAQPage JSON-LD node.
//
//   node scripts/seo-content.smoke.mjs
//
// Bundles the TS sources with esbuild so it runs without a Next.js server.

import { createRequire } from "node:module";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

const require = createRequire(import.meta.url);

// Transpile the TS utils to CommonJS on the fly (no bundler needed — the two
// modules only import each other and type-only declarations).
const dir = mkdtempSync(join(tmpdir(), "seo-smoke-"));
const compile = (name) => {
  const source = require("node:fs").readFileSync(join(process.cwd(), "utils", `${name}.ts`), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const file = join(dir, `${name}.js`);
  writeFileSync(file, outputText);
  return file;
};

compile("fieldVisibility");
compile("productCatalog");
const schemaFile = compile("schema");

const { getSubCategorySeoContent } = require(join(dir, "productCatalog.js"));
const { faqNode, productPageSchema } = require(schemaFile);

// The block parser lives in the component; pull it out by compiling the file
// with JSX stripped down to a marker, so the pure logic can be exercised here.
const parseBlocks = (() => {
  const source = require("node:fs").readFileSync(
    join(process.cwd(), "components/product/b2b/SubCategoryContent.tsx"),
    "utf8",
  );
  const start = source.indexOf("const parseBlocks");
  const end = source.indexOf("\n};", source.indexOf("return blocks;"));
  const body = source.slice(start, end + 3);
  const { outputText } = ts.transpileModule(`${body}\nmodule.exports = parseBlocks;`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const file = join(dir, "parseBlocks.js");
  writeFileSync(file, outputText.replace(/:\s*Block\[\]/g, "").replace(/:\s*string/g, ""));
  return require(file);
})();

let failures = 0;
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const ok = a === e;
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) console.log(`      expected ${e}\n      actual   ${a}`);
};

// --- Resolution ------------------------------------------------------------

check("no sub-category content -> null", getSubCategorySeoContent({ name: "Box" }), null);

check(
  "heading-only block is not enough to render",
  getSubCategorySeoContent({ sub_category_seo_content: { heading: "About Boxes" } }),
  null,
);

check(
  "server-resolved block wins and carries the sub-category name",
  getSubCategorySeoContent({
    sub_category: { name: "Ignored", seo_content: { description: "old" } },
    sub_category_seo_content: {
      heading: "",
      description: "Corrugated boxes for e-commerce.",
      faqs: [{ question: "What ply?", answer: "3-ply." }],
      sub_category_name: "Corrugated Boxes",
    },
  }),
  {
    heading: "",
    description: "Corrugated boxes for e-commerce.",
    faqs: [{ question: "What ply?", answer: "3-ply." }],
    subCategoryName: "Corrugated Boxes",
  },
);

check(
  "falls back to the populated sub_category, dropping half-filled FAQ rows",
  getSubCategorySeoContent({
    sub_category: {
      name: "Poly Bags",
      seo_content: {
        description: "Poly bag copy.",
        faqs: [
          { question: "Kept?", answer: "Yes" },
          { question: "Dropped", answer: "" },
        ],
      },
    },
  }),
  {
    heading: "",
    description: "Poly bag copy.",
    faqs: [{ question: "Kept?", answer: "Yes" }],
    subCategoryName: "Poly Bags",
  },
);

// --- Block parser ----------------------------------------------------------

// Shaped after the real U-Pack style copy this feature was built for.
const sample = [
  "Our 50BF (imported paper) 3 ply packing boxes are the industry standard.",
  "These durable cartons can be used universally for various shipping applications.",
  "",
  "## Ply Options & Thickness",
  "",
  "- **3 Ply 3.2 MM Thick B-Flute:** suitable for medium to heavier items.",
  "- **5 Ply 6.1 MM Thick B/C-Flute:** double wall, suitable for very heavy items.",
  "",
  "## Steps to customise and print",
  "",
  "1. Select the Customize feature from the product menu.",
  "2. Upload your artwork and adjust it on each side.",
].join("\n");

const parsed = parseBlocks(sample);

check(
  "parses the sample into paragraph / heading / bullets / heading / numbered",
  parsed.map((b) => (b.type === "list" ? (b.ordered ? "ol" : "ul") : b.type)),
  ["paragraph", "heading", "ul", "heading", "ol"],
);

check(
  "wrapped lines join into one paragraph",
  parsed[0].text,
  "Our 50BF (imported paper) 3 ply packing boxes are the industry standard. These durable cartons can be used universally for various shipping applications.",
);

check("numbered list strips its markers", parsed[4].items, [
  "Select the Customize feature from the product menu.",
  "Upload your artwork and adjust it on each side.",
]);

check(
  "a line opening with a bare digit stays a paragraph, not a numbered item",
  parseBlocks("3 Ply 3.2 MM Thick B-Flute Corrugated Cardboard is strong.").map((b) => b.type),
  ["paragraph"],
);

check(
  "switching list style starts a new list instead of mixing markers",
  parseBlocks("- one\n1. two").map((b) => (b.ordered ? "ol" : "ul")),
  ["ul", "ol"],
);

// --- JSON-LD ---------------------------------------------------------------

check("faqNode with no FAQs -> null", faqNode("/box", []), null);

check(
  "faqNode builds a FAQPage of Question/Answer pairs",
  faqNode("/corrugated-box-5ply", [{ question: "What ply?", answer: "3-ply." }]),
  {
    "@type": "FAQPage",
    "@id": "https://store.prempackaging.com/corrugated-box-5ply#faq",
    mainEntity: [
      {
        "@type": "Question",
        name: "What ply?",
        acceptedAnswer: { "@type": "Answer", text: "3-ply." },
      },
    ],
  },
);

const graph = productPageSchema({
  name: "5 Ply Box",
  slug: "5-ply-box",
  category: { name: "Corrugated Boxes", slug: "corrugated-boxes" },
  sub_category_seo_content: {
    description: "Copy",
    faqs: [{ question: "Q?", answer: "A." }],
    sub_category_name: "Corrugated Boxes",
  },
});
const types = graph["@graph"].map((node) => node["@type"]);
check("product page graph includes the FAQPage node", types.includes("FAQPage"), true);

const noFaqGraph = productPageSchema({ name: "5 Ply Box", slug: "5-ply-box" });
check(
  "product page graph omits FAQPage when nothing is authored",
  noFaqGraph["@graph"].map((node) => node["@type"]).includes("FAQPage"),
  false,
);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
