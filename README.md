# @eik/vite-plugin

[Vite](https://vite.dev/) plugin for [build-time import mapping with Eik](https://eik.dev/docs/guides/vite).

This is a small wrapper around the [Rollup plugin](https://github.com/eik-lib/rollup-plugin) to make it slightly more ergonomic to use in Vite.

## Installation

```bash
npm install --save-dev vite @eik/vite-plugin
```

## Usage

```js
import eik from "@eik/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [eik()],
  build: {
    rollupOptions: {
      output: {
        // Turn off the asset hashes. Stable file names
        // make it easier to use the Eik node client:
        // https://github.com/eik-lib/node-client
        // Publishinig a new version on Eik gives a
        // unique URL, no hash needed.
        assetFileNames: "[name].[ext]",
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
      },
    },
  },
});
```

## Options

The options you can give to `eik()` are the same as for the Rollup plugin.
Refer to [the Rollup plugin documentation](https://github.com/eik-lib/rollup-plugin?tab=readme-ov-file#options) to see what you can do.
