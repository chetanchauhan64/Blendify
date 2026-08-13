import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Admin pages use useCallback-based async fetchers that call setState.
  // This is a valid pattern for non-Suspense data fetching; disable the rule.
  {
    files: ["app/(admin)/admin/**/*.tsx", "components/admin/**/*.tsx", "lib/hooks/useAdmin*.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Relax strict rules for pre-existing storefront code
  {
    files: [
      "components/sections/**/*.tsx",
      "components/shop/**/*.tsx",
      "components/hero/**/*.tsx",
      "components/layout/**/*.tsx",
      "components/account/**/*.tsx",
      "app/about/page.tsx",
      "app/contact/page.tsx",
      "app/shop/**/*.tsx",
      "lib/hooks/useMounted.ts",
      "lib/hooks/useSliderAnimation.ts",
      "lib/hooks/useCursorEffect.ts",
      "app/api/addresses/route.ts",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
