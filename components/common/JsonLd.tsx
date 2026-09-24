import React from "react";
import Head from "next/head";

interface JsonLdProps {
  /** A `@graph` document from utils/schema.ts. */
  data: Record<string, any> | null | undefined;
  /**
   * Distinguishes the script when a page renders more than one block — Next
   * dedupes `<Head>` children by key.
   */
  id?: string;
}

/**
 * Renders a schema.org JSON-LD block into <head>.
 *
 * Serialising with JSON.stringify inside dangerouslySetInnerHTML is the
 * documented Next.js pattern; `<` is escaped so a stray value can never close
 * the script tag early.
 */
export const JsonLd: React.FC<JsonLdProps> = ({ data, id = "schema" }) => {
  if (!data) return null;

  return (
    <Head>
      <script
        key={`jsonld-${id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data).replace(/</g, "\\u003c"),
        }}
      />
    </Head>
  );
};

export default JsonLd;
