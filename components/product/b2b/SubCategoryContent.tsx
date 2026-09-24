import React, { useMemo, useState } from "react";

import type { SubCategorySeoContent } from "../../../utils/productCatalog";

interface SubCategoryContentProps {
  content: SubCategorySeoContent;
}

type Block =
  | { type: "heading"; key: string; text: string }
  | { type: "list"; key: string; ordered: boolean; items: string[] }
  | { type: "paragraph"; key: string; text: string };

/** Collapsed height, and the copy length past which collapsing is worth it. */
const CLAMP_HEIGHT = 320;
const CLAMP_THRESHOLD = 900;

/**
 * Renders `**bold**` runs inside a line, leaving everything else as plain text.
 *
 * Used for lead-in labels ("**5 Ply 6.1 MM Thick:** suitable for heavy items").
 * Splitting on a capturing group keeps the delimiters out of the output, and the
 * pieces stay React children, so nothing here can inject markup.
 */
const renderInline = (text: string, keyPrefix: string): React.ReactNode[] =>
  text.split(/\*\*(.+?)\*\*/g).map((piece, index) =>
    // Odd indices are the captured groups — i.e. what sat between the `**`.
    index % 2 === 1 ? (
      <strong key={`${keyPrefix}-b${index}`} className="tw-font-bold tw-text-slate-900">
        {piece}
      </strong>
    ) : (
      piece
    ),
  );

/**
 * Parses the admin's plain-text copy into renderable blocks.
 *
 * Deliberately not HTML. Blank lines split paragraphs; `- ` / `* ` opens a
 * bullet list; `1. ` opens a numbered list; `## ` marks a sub-heading; `**x**`
 * bolds inline. Everything is rendered as React children, so authored copy can
 * never inject markup.
 */
const parseBlocks = (text: string): Block[] => {
  const blocks: Block[] = [];

  text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .forEach((chunk, chunkIndex) => {
      const lines = chunk
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      let items: string[] = [];
      let ordered = false;
      const flushList = () => {
        if (!items.length) return;
        blocks.push({
          type: "list",
          key: `list-${chunkIndex}-${blocks.length}`,
          ordered,
          items,
        });
        items = [];
      };

      let paragraph: string[] = [];
      const flushParagraph = () => {
        if (!paragraph.length) return;
        blocks.push({
          type: "paragraph",
          key: `p-${chunkIndex}-${blocks.length}`,
          text: paragraph.join(" "),
        });
        paragraph = [];
      };

      const pushItem = (item: string, isOrdered: boolean) => {
        flushParagraph();
        // Switching list style starts a new list rather than mixing markers.
        if (items.length && ordered !== isOrdered) flushList();
        ordered = isOrdered;
        items.push(item);
      };

      lines.forEach((line) => {
        // `3 Ply ...` must stay a paragraph, so a digit alone isn't enough —
        // a numbered item needs the `.`/`)` separator.
        const numbered = line.match(/^\d+[.)]\s+(.*)$/);
        const bullet = line.match(/^[-*]\s+(.*)$/);
        const heading = line.match(/^#{2,3}\s+(.*)$/);

        if (heading) {
          flushParagraph();
          flushList();
          blocks.push({
            type: "heading",
            key: `h-${chunkIndex}-${blocks.length}`,
            text: heading[1],
          });
          return;
        }
        if (numbered) {
          pushItem(numbered[1], true);
          return;
        }
        if (bullet) {
          pushItem(bullet[1], false);
          return;
        }
        flushList();
        paragraph.push(line);
      });

      flushParagraph();
      flushList();
    });

  return blocks;
};

/**
 * Sub-category SEO block — long-form copy plus an FAQ, authored once per
 * sub-category and rendered on every product page inside it.
 *
 * FAQ items use native <details> so the answers ship in the server-rendered
 * HTML (crawlable, and usable without JS) while staying collapsed by default.
 */
export const SubCategoryContent: React.FC<SubCategoryContentProps> = ({ content }) => {
  const [expanded, setExpanded] = useState(false);

  const isHtml = useMemo(
    () => /<[a-z][\s\S]*>/i.test(content.description || ""),
    [content.description],
  );

  const blocks = useMemo(
    () => (isHtml ? [] : parseBlocks(content.description || "")),
    [content.description, isHtml],
  );

  const heading =
    content.heading ||
    (content.subCategoryName ? `About ${content.subCategoryName}` : "Buying Guide");

  const hasCopy = isHtml
    ? Boolean(content.description && content.description.trim().length > 0)
    : blocks.length > 0;
  const hasFaqs = content.faqs.length > 0;
  // Short copy fits on screen — a "Read more" on three lines is just noise.
  const collapsible = content.description.length > CLAMP_THRESHOLD;
  const clamped = collapsible && !expanded;
  if (!hasCopy && !hasFaqs) return null;

  return (
    <section className="tw-mt-16" id="category-guide">
      <style jsx global>{`
        .b2b-subcat-faq summary::-webkit-details-marker {
          display: none;
        }
        .b2b-subcat-faq summary {
          list-style: none;
        }
        .b2b-subcat-faq details[open] .b2b-subcat-faq-chevron {
          transform: rotate(180deg);
        }
        .b2b-subcat-richtext h1,
        .b2b-subcat-richtext h2,
        .b2b-subcat-richtext h3,
        .b2b-subcat-richtext h4,
        .b2b-subcat-richtext h5,
        .b2b-subcat-richtext h6 {
          color: #0f172a;
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .b2b-subcat-richtext h1 { font-size: 1.25rem; }
        .b2b-subcat-richtext h2 { font-size: 1.125rem; }
        .b2b-subcat-richtext h3 { font-size: 1rem; }
        .b2b-subcat-richtext p { margin-top: 0.5rem; margin-bottom: 0.75rem; }
        .b2b-subcat-richtext ul { list-style-type: disc; padding-left: 1.25rem; margin-top: 0.5rem; margin-bottom: 0.75rem; }
        .b2b-subcat-richtext ol { list-style-type: decimal; padding-left: 1.25rem; margin-top: 0.5rem; margin-bottom: 0.75rem; }
        .b2b-subcat-richtext li { margin-bottom: 0.25rem; }
        .b2b-subcat-richtext a { color: #2563eb; text-decoration: underline; }
        .b2b-subcat-richtext blockquote { border-left: 4px solid #cbd5e1; padding-left: 1rem; color: #475569; font-style: italic; margin: 1rem 0; }
        .b2b-subcat-richtext [style*="text-align: center"],
        .b2b-subcat-richtext [style*="text-align:center"] { text-align: center; }
        .b2b-subcat-richtext [style*="text-align: right"],
        .b2b-subcat-richtext [style*="text-align:right"] { text-align: right; }
        .b2b-subcat-richtext [style*="text-align: justify"],
        .b2b-subcat-richtext [style*="text-align:justify"] { text-align: justify; }
        .b2b-subcat-richtext [style*="text-align: left"],
        .b2b-subcat-richtext [style*="text-align:left"] { text-align: left; }
        .b2b-subcat-richtext u, .b2b-subcat-richtext ins { text-decoration: underline; }
        .b2b-subcat-richtext del, .b2b-subcat-richtext s { text-decoration: line-through; }
      `}</style>

      {hasCopy && (
        <div className="tw-mb-10">
          <p className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-slate-500 tw-mb-2 tw-mt-0">
            Buying Guide
          </p>
          <h2 className="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-slate-900 tw-m-0 tw-mb-5">
            {heading}
          </h2>

          <div className="tw-relative">
            <div
              className="tw-overflow-hidden tw-transition-all tw-duration-300"
              style={clamped ? { maxHeight: CLAMP_HEIGHT } : undefined}
            >
              {isHtml ? (
                <div
                  className="tw-text-sm tw-leading-relaxed tw-text-slate-600 tw-w-full b2b-subcat-richtext"
                  dangerouslySetInnerHTML={{ __html: content.description }}
                />
              ) : (
                <div className="tw-text-sm tw-leading-relaxed tw-text-slate-600 tw-w-full">
                  {blocks.map((block) => {
                    if (block.type === "heading") {
                      return (
                        <h3
                          key={block.key}
                          className="tw-text-base tw-font-bold tw-text-slate-900 tw-mt-6 tw-mb-2"
                        >
                          {block.text}
                        </h3>
                      );
                    }
                    if (block.type === "list") {
                      const ListTag = block.ordered ? "ol" : "ul";
                      return (
                        <ListTag
                          key={block.key}
                          className={`tw-pl-5 tw-space-y-1.5 tw-my-3 ${
                            block.ordered ? "tw-list-decimal" : "tw-list-disc"
                          }`}
                        >
                          {block.items.map((item, index) => (
                            <li key={`${block.key}-${index}`}>
                              {renderInline(item, `${block.key}-${index}`)}
                            </li>
                          ))}
                        </ListTag>
                      );
                    }
                    return (
                      <p key={block.key} className="tw-my-3">
                        {renderInline(block.text, block.key)}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>

            {clamped && (
              <div
                aria-hidden="true"
                className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-20 tw-pointer-events-none"
                style={{
                  background: "linear-gradient(to bottom, rgba(255,255,255,0), #ffffff)",
                }}
              />
            )}
          </div>

          {collapsible && (
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              className="tw-mt-3 tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-slate-900 tw-flex tw-items-center tw-gap-1 hover:tw-underline"
            >
              {expanded ? "Read less" : "Read more"}
              <span
                className="material-symbols-outlined tw-text-sm tw-transition-transform"
                style={expanded ? { transform: "rotate(180deg)" } : undefined}
              >
                expand_more
              </span>
            </button>
          )}
        </div>
      )}

      {hasFaqs && (
        <div className="b2b-subcat-faq">
          <h2 className="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-slate-900 tw-m-0 tw-mb-5">
            Frequently Asked Questions
          </h2>
          <div className="tw-border tw-border-solid tw-border-slate-200 tw-rounded-xl tw-overflow-hidden tw-bg-white tw-shadow-sm">
            {content.faqs.map((faq, index) => (
              <details
                key={`${faq.question}-${index}`}
                className={
                  index === 0
                    ? ""
                    : "tw-border-0 tw-border-t tw-border-solid tw-border-slate-200"
                }
              >
                <summary className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-cursor-pointer tw-px-5 tw-py-4 tw-text-sm tw-font-bold tw-text-slate-900 hover:tw-bg-slate-50">
                  {faq.question}
                  <span className="material-symbols-outlined b2b-subcat-faq-chevron tw-text-lg tw-text-slate-500 tw-transition-transform tw-shrink-0">
                    expand_more
                  </span>
                </summary>
                <div className="tw-px-5 tw-pb-4 tw-text-sm tw-leading-relaxed tw-text-slate-600 tw-w-full">
                  {faq.answer.split(/\n+/).map((line, lineIndex) => (
                    <p key={lineIndex} className="tw-mt-0 tw-mb-2 last:tw-mb-0">
                      {renderInline(line, `faq-${index}-${lineIndex}`)}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default SubCategoryContent;
