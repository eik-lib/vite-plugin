import { helpers } from "@eik/common";

/**
 * @typedef {object} ImportMap
 * @property {Record<string, string>} imports
 */

/**
 * @typedef {object} PluginOptions
 * @property {string} [path=process.cwd()] Path to `eik.json`.
 * @property {string[]} [urls=[]] URLs to import maps hosted on an Eik server. Takes precedence over `eik.json`.
 * @property {ImportMap | ImportMap[]} [maps=[]] Inline import maps. Takes precedence over `urls` and `eik.json`.
 */

/**
 * Virtual module id prefix for the ESM facades emitted for `require()` calls
 * of mapped specifiers. The leading NUL marks the id as virtual so the
 * bundler routes it back through this plugin's `load` hook.
 */
const FACADE_PREFIX = "\0eik-require-facade:";

/**
 * Vite plugin that rewrites bare import specifiers to URLs from one or more
 * Eik import maps. Applied only to the client build.
 *
 * @param {PluginOptions} [options]
 * @returns {import('vite').Plugin[]}
 */
export default function eik({
	path = process.cwd(),
	maps = [],
	urls = [],
} = {}) {
	const pMaps = Array.isArray(maps) ? maps : [maps];
	const pUrls = Array.isArray(urls) ? urls : [urls];
	const urlMap = new Map();

	return [
		{
			name: "eik-vite-plugin",
			enforce: "pre",
			apply: (_cfg, { command, isSsrBuild }) =>
				command === "build" && !isSsrBuild,
			async buildStart() {
				urlMap.clear();
				const config = helpers.getDefaults(path);
				const fetched = await helpers.fetchImportMaps([
					...config.map,
					...pUrls,
				]);
				for (const m of [...fetched, ...pMaps]) {
					for (const [k, v] of Object.entries(m.imports)) urlMap.set(k, v);
				}
			},
			resolveId: {
				order: "pre",
				handler(specifier, importer, opts) {
					if (importer?.startsWith(FACADE_PREFIX)) {
						return null;
					}
					const url = urlMap.get(specifier);
					if (!url) {
						return null;
					}
					if (opts?.kind === "require-call") {
						return { id: FACADE_PREFIX + specifier };
					}
					return { id: url, external: true };
				},
			},
			load(id) {
				if (!id.startsWith(FACADE_PREFIX)) {
					return null;
				}
				const specifier = id.slice(FACADE_PREFIX.length);
				const url = urlMap.get(specifier);
				if (!url) {
					return null;
				}
				return `import * as __ns from ${JSON.stringify(url)};\nexport * from ${JSON.stringify(url)};\nexport default __ns.default ?? __ns;\n`;
			},
		},
	];
}
