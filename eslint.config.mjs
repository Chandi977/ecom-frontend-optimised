import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
  {
    linterOptions: {
      // The existing codebase has inline disables for rules retired in Next 16.
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/next-script-for-ga": "off",

      // New React Compiler rules in eslint-config-next 16. These flag long-standing
      // patterns across the app; keep them off until the React 19 migration.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/static-components": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
];

export default config;
