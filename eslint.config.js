// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"], // target your files
    rules: {
      "react/no-unescaped-entities": "off", // disable the rule
    },
  },
]);
