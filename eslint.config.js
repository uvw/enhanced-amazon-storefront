import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/"] },
  js.configs.recommended,
  {
    files: ["**/*.user.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.greasemonkey,
      },
    },
  },
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
