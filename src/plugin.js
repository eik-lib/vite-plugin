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
 * Vite plugin that resolves bare import specifiers to URLs from one or more
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
			resolveId(specifier) {
				const url = urlMap.get(specifier);
				if (!url) {
					return null;
				}

				return { id: url, external: true };
			},
		},
	];
}
