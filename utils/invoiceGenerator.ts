/**
 * Invoice PDF generator (client-side).
 *
 * Builds a branded, letterhead-style A4 invoice for a single order using jsPDF
 * + jspdf-autotable (both already in package.json) and triggers a download.
 *
 * SSR-safe: jsPDF touches browser APIs, so the libraries are imported lazily
 * inside the async function — never at module load — and the whole thing only
 * ever runs from a click handler in the browser.
 *
 * Note: jsPDF's built-in Helvetica font has no ₹ (U+20B9) glyph, so all money
 * values are printed as "Rs." to stay legible in the PDF.
 */

// ── Seller (letterhead) details ────────────────────────────────────────────
// Sourced from the storefront footer / contact page. `gstin` is intentionally
// left blank — fill it in to have the document print as a legal "TAX INVOICE"
// with the seller GSTIN line; while empty it prints as "INVOICE".
const SELLER = {
  name: "Prem Industries India Limited",
  addressLines: [
    "C-209, Bulandshahar Road, Industrial Area,",
    "Ghaziabad, Uttar Pradesh, India - 201009",
  ],
  phone: "+91-844-724-7227",
  email: "ecommerce@premindustries.in",
  website: "www.prempackaging.com",
  gstin: "", // e.g. "09AAACP0000A1Z5" — leave blank if unknown
  logoPath: "/pp_logo.png", // local public asset (kept same-origin on purpose)
};

// ── Brand palette (from tailwind.config.js design tokens) ───────────────────
const NAVY: [number, number, number] = [15, 39, 71]; // #0F2747
const RED: [number, number, number] = [225, 43, 36]; // logo red
const INK: [number, number, number] = [17, 24, 39]; // #111827
const SUBTLE: [number, number, number] = [102, 112, 133]; // #667085
const HAIRLINE: [number, number, number] = [230, 232, 236]; // #E6E8EC
const CANVAS: [number, number, number] = [247, 248, 250]; // #F7F8FA

const MARGIN = 15;
const PAGE_W = 210;
const PAGE_H = 297;
const RIGHT = PAGE_W - MARGIN;

/** Format a number as Indian-grouped rupees, PDF-safe (no ₹ glyph). */
const money = (value: any): string => {
  const num = Math.round(Number(value) || 0);
  return `Rs. ${num.toLocaleString("en-IN")}`;
};

const safe = (value: any, fallback = "NA"): string => {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return str.length ? str : fallback;
};

const formatDate = (value: any): string => {
  if (!value) return "NA";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "NA";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/** Load a same-origin image as a data URL for jsPDF.addImage. Never throws. */
async function loadLogoDataUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(path, { cache: "force-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── Indian-system number → words (for "Amount in words") ─────────────────────
const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const twoDigits = (n: number): string => {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? " " + ONES[o] : "");
};

const threeDigits = (n: number): string => {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(ONES[h] + " Hundred");
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
};

function amountInWords(value: any): string {
  let num = Math.round(Number(value) || 0);
  if (num <= 0) return "Zero Rupees Only";
  const unit = num === 1 ? "Rupee" : "Rupees";
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundreds = num;
  const chunks: string[] = [];
  if (crore) chunks.push(twoDigits(crore) + " Crore");
  if (lakh) chunks.push(twoDigits(lakh) + " Lakh");
  if (thousand) chunks.push(twoDigits(thousand) + " Thousand");
  if (hundreds) chunks.push(threeDigits(hundreds));
  return chunks.join(" ").replace(/\s+/g, " ").trim() + ` ${unit} Only`;
}

const resolveOrderId = (order: any): string => {
  const id = order?.orderId;
  if (typeof id === "string" && /^PI-\d+$/.test(id)) return id;
  return safe(order?._id, "—");
};

const productName = (item: any): string =>
  safe(item?.product?.model || item?.product?.name, "Product");

/**
 * Generate and download a branded invoice PDF for the given order.
 * Returns the filename used for the download.
 */
export async function downloadInvoicePdf(order: any): Promise<string> {
  if (!order) throw new Error("No order supplied to invoice generator.");

  const [{ jsPDF }, autoTableModule, logo] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    loadLogoDataUrl(SELLER.logoPath),
  ]);
  const autoTable = (autoTableModule as any).default || autoTableModule;

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const orderId = resolveOrderId(order);

  // ── Letterhead ────────────────────────────────────────────────────────────
  let y = 16;

  if (logo) {
    // Logo intrinsic ratio ≈ 1.353 (w/h). Draw at 40mm wide.
    const logoW = 40;
    const logoH = logoW / 1.353;
    try {
      doc.addImage(logo, "PNG", MARGIN, y, logoW, logoH, undefined, "FAST");
    } catch {
      /* ignore a broken logo — the rest of the invoice still renders */
    }
  } else {
    // Text fallback so the header never looks empty.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...NAVY);
    doc.text("PREM INDUSTRIES", MARGIN, y + 8);
  }

  // Company block, right-aligned.
  let cy = y + 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text(SELLER.name, RIGHT, cy, { align: "right" });
  cy += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...SUBTLE);
  SELLER.addressLines.forEach((line) => {
    doc.text(line, RIGHT, cy, { align: "right" });
    cy += 4.2;
  });
  doc.text(`${SELLER.phone}  ·  ${SELLER.email}`, RIGHT, cy, { align: "right" });
  cy += 4.2;
  doc.text(SELLER.website, RIGHT, cy, { align: "right" });
  cy += 4.2;
  if (SELLER.gstin) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(`GSTIN: ${SELLER.gstin}`, RIGHT, cy, { align: "right" });
    cy += 4.2;
  }

  // Brand divider bar (navy with a red accent segment).
  const barY = Math.max(y + 40, cy + 2);
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN, barY, RIGHT - MARGIN, 1.4, "F");
  doc.setFillColor(...RED);
  doc.rect(MARGIN, barY, 42, 1.4, "F");

  // ── Title + invoice meta ────────────────────────────────────────────────────
  y = barY + 11;
  const isTaxInvoice = Boolean(SELLER.gstin);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text(isTaxInvoice ? "TAX INVOICE" : "INVOICE", MARGIN, y);

  // Right-aligned key/value stack. Labels are right-aligned to their own column
  // (`metaLabelX`) that sits well left of the values, so long values like a
  // full date or "Payment Verified" can never overlap their label.
  const metaRows: Array<[string, string]> = [
    ["Invoice No.", orderId],
    ["Invoice Date", formatDate(order?.createdAt)],
    ["Order Status", safe(order?.status)],
    ["Payment Status", safe(order?.paymentStatus)],
  ];
  const metaLabelX = RIGHT - 52;
  const metaRowGap = 5.6;
  let my = y - 6;
  metaRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...SUBTLE);
    doc.text(label, metaLabelX, my, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text(value, RIGHT, my, { align: "right" });
    my += metaRowGap;
  });

  // ── Bill-to panel ───────────────────────────────────────────────────────────
  // Start below whichever is taller — the title row or the meta stack — so the
  // panel never covers the last meta row (Payment Status).
  y = Math.max(y + 6, my + 2);
  const panelH = 34;
  doc.setFillColor(...CANVAS);
  doc.setDrawColor(...HAIRLINE);
  doc.roundedRect(MARGIN, y, RIGHT - MARGIN, panelH, 1.5, 1.5, "FD");

  const px = MARGIN + 5;
  let by = y + 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...RED);
  doc.text("BILLED TO", px, by);
  by += 5.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(safe(order?.name), px, by);
  by += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SUBTLE);
  const addressBlock = [
    safe(order?.address, ""),
    [safe(order?.town, ""), safe(order?.state, ""), safe(order?.pincode, "")]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);
  const addressWrapped = doc.splitTextToSize(addressBlock.join(", "), 100);
  doc.text(addressWrapped, px, by);
  by += addressWrapped.length * 4.4 + 1;

  const contactBits = [safe(order?.phone, ""), safe(order?.email, "")].filter(Boolean);
  if (contactBits.length) {
    doc.text(contactBits.join("  ·  "), px, by);
  }

  // Right side of the panel: customer GSTIN + coupon.
  let ry = y + 7;
  const rLabelX = RIGHT - 55;
  const rValX = RIGHT - 5;
  const rightPairs: Array<[string, string]> = [
    ["Customer GSTIN", safe(order?.gstin)],
    ["Coupon Code", safe(order?.couponCode)],
  ];
  rightPairs.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SUBTLE);
    doc.text(label, rLabelX, ry);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(value, rValX, ry + 4.5, { align: "right" });
    ry += 11;
  });

  y += panelH + 8;

  // ── Items table ─────────────────────────────────────────────────────────────
  const items: any[] = Array.isArray(order?.items) ? order.items : [];
  const body = items.map((item, idx) => {
    const qty = Number(item?.quantity) || 0;
    const rate = Number(item?.price) || 0;
    const lineAmount = rate * qty;
    return [
      String(idx + 1),
      productName(item),
      safe(item?.hsn_code, "-"),
      safe(item?.packSize, "-"),
      String(qty),
      money(rate),
      money(lineAmount),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["#", "Product", "HSN/SAC", "Pack Size", "Qty", "Rate", "Amount"]],
    body: body.length ? body : [["", "No items on this order", "", "", "", "", ""]],
    theme: "grid",
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2.6,
      textColor: INK,
      lineColor: HAIRLINE,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
    },
    alternateRowStyles: { fillColor: [250, 251, 252] },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 60 },
      2: { cellWidth: 24 },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 14, halign: "center" },
      5: { cellWidth: 25, halign: "right" },
      6: { cellWidth: 25, halign: "right" },
    },
  });

  // ── Totals ──────────────────────────────────────────────────────────────────
  const afterTable = (doc as any).lastAutoTable?.finalY ?? y + 20;
  let ty = afterTable + 8;

  const cartValue =
    Number(order?.totalCartValue) ||
    items.reduce((t, i) => t + (Number(i?.price) || 0) * (Number(i?.quantity) || 0), 0);
  const freight = Number(order?.shippingCost) || 0;
  const grandTotal = Number(order?.totalOrderValue) || cartValue + freight;
  const gst = Math.max(0, grandTotal - freight - cartValue);

  // Totals stack on the right half of the page.
  const totalsX = RIGHT - 80;
  const totalsW = 80;

  const totalRow = (label: string, value: string, opts?: { bold?: boolean }) => {
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(opts?.bold ? 10 : 9.5);
    doc.setTextColor(...(opts?.bold ? INK : SUBTLE));
    doc.text(label, totalsX, ty);
    doc.setTextColor(...INK);
    doc.text(value, RIGHT, ty, { align: "right" });
    ty += 6;
  };

  totalRow("Sub Total (Taxable)", money(cartValue));
  totalRow("Freight / Shipping", money(freight));
  totalRow("GST (Tax)", money(gst));

  // Grand total highlighted band.
  ty += 1;
  doc.setFillColor(...NAVY);
  doc.roundedRect(totalsX - 4, ty - 4.5, totalsW + 4, 9, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Total Payable", totalsX, ty + 1.2);
  doc.text(money(grandTotal), RIGHT, ty + 1.2, { align: "right" });
  ty += 12;

  // ── Amount in words ─────────────────────────────────────────────────────────
  doc.setDrawColor(...HAIRLINE);
  doc.line(MARGIN, ty, RIGHT, ty);
  ty += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...SUBTLE);
  doc.text("Amount in words:", MARGIN, ty);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  const words = doc.splitTextToSize(amountInWords(grandTotal), RIGHT - MARGIN - 30);
  doc.text(words, MARGIN + 30, ty);
  ty += words.length * 4.6 + 6;

  // ── Payment details ─────────────────────────────────────────────────────────
  if (ty > PAGE_H - 55) {
    doc.addPage();
    ty = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("PAYMENT DETAILS", MARGIN, ty);
  ty += 5.5;

  const payPairs: Array<[string, string]> = [
    ["Payment Provider", safe(order?.paymentProvider)],
    ["UTR Number", safe(order?.utrNumber)],
    ["Razorpay Order ID", safe(order?.razorpayOrderId)],
    ["Razorpay Payment ID", safe(order?.razorpayPaymentId)],
  ];
  const colW = (RIGHT - MARGIN) / 2;
  doc.setFontSize(9);
  payPairs.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = MARGIN + col * colW;
    const rowY = ty + row * 7;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SUBTLE);
    doc.text(label, x, rowY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(value, x + 42, rowY);
  });
  ty += Math.ceil(payPairs.length / 2) * 7 + 4;

  // ── Footer (every page) ─────────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(...HAIRLINE);
    doc.line(MARGIN, PAGE_H - 18, RIGHT, PAGE_H - 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SUBTLE);
    doc.text(
      "This is a computer-generated invoice and does not require a physical signature.",
      MARGIN,
      PAGE_H - 13,
    );
    doc.text(`${SELLER.name}  ·  ${SELLER.website}`, MARGIN, PAGE_H - 9);
    doc.text(`Page ${p} of ${pageCount}`, RIGHT, PAGE_H - 9, { align: "right" });
  }

  const filename = `Invoice-${orderId}.pdf`;
  doc.save(filename);
  return filename;
}
