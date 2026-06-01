# @eik/vite-plugin

[Vite](https://vite.dev/) plugin for [build-time import mapping with Eik](https://eik.dev/docs/guides/vite).

Resolves bare import specifiers in your client bundle to URLs hosted on an Eik server, so shared dependencies (React, lit, etc.) load from one place across apps instead of being bundled into each one.

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
        // Publishing a new version on Eik gives a
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

| Option | Type                       | Default          | Description                                                                       |
| ------ | -------------------------- | ---------------- | --------------------------------------------------------------------------------- |
| `path` | `string`                   | `process.cwd()`  | Path to `eik.json`.                                                               |
| `urls` | `string[]`                 | `[]`             | URLs to import maps hosted on an Eik server. Takes precedence over `eik.json`.    |
| `maps` | `ImportMap \| ImportMap[]` | `[]`             | Inline import maps. Takes precedence over `urls` and `eik.json`.                  |

An `ImportMap` is `{ imports: Record<string, string> }`.

## Vite 8 / Rolldown

Static `import` statements of mapped specifiers are rewritten to external URL imports. `require()` calls of mapped specifiers are routed through a virtual ESM facade so the bundler's CJS interop wraps them at the call site.

Without the facade, Rolldown would leave a literal `require("<url>")` in the output bundle, which throws in the browser. See the [Vite 8 migration note](https://vite.dev/guide/migration#require-calls-for-externalized-modules) for background.
