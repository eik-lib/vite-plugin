import rollupPlugin from "@eik/rollup-plugin";

/**
 * @typedef {import('@eik/rollup-plugin').PluginOptions} EikPluginOptions
 */
/**
 * @typedef {import('@eik/rollup-plugin').ImportMap} EikImportMap
 */

/**
 * @param {EikPluginOptions} [options]
 * @returns {import('vite').Plugin[]}
 */
export default function eik(options) {
	return [
		{
			...rollupPlugin(options),
			enforce: "pre",
			apply: (_config, { command, isSsrBuild }) =>
				// only apply plugin for client code, while building
				command === "build" && !isSsrBuild,
		},
	];
}
