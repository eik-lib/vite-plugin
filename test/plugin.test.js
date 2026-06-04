import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import fastify from "fastify";
import { build } from "vite";

import eik from "../src/plugin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FILE = path.resolve(
	__dirname,
	"..",
	"fixtures",
	"modules",
	"file",
	"main.js",
);

/*
 * When running tests on Windows, the output code get some extra \r on each line.
 * Remove these so snapshots work on all OSes.
 */
const clean = (str) => str.split("\r").join("");

test("plugin() - import map fetched from a URL", async (t) => {
	const app = fastify();
	app.server.keepAliveTimeout = 20;
	app.get("/one", (request, reply) => {
		reply.send({
			imports: {
				"lit-element": "https://cdn.eik.dev/lit-element/v2",
			},
		});
	});
	app.get("/two", (request, reply) => {
		reply.send({
			imports: {
				"lit-html": "https://cdn.eik.dev/lit-html/v1",
			},
		});
	});
	const address = await app.listen({
		host: "0.0.0.0",
		port: 50253,
	});

	t.after(async () => {
		await app.close();
	});

	// @ts-ignore
	const result = await build({
		logLevel: "silent",
		plugins: [
			eik({
				maps: [
					{
						imports: {
							"lit-html/lit-html": "https://cdn.eik.dev/lit-html/v2",
						},
					},
				],
				urls: [`${address}/one`, `${address}/two`],
			}),
		],
		build: {
			write: false,
			lib: {
				entry: FILE,
				name: "test",
			},
			rollupOptions: {
				onwarn: () => {
					// Supress logging
				},
			},
		},
	});

	t.assert.snapshot(clean(result[0].output[0].code));
});

test("plugin() - import map fetched from a URL via eik.json", async (t) => {
	const app = fastify();
	app.server.keepAliveTimeout = 20;
	app.get("/one", (request, reply) => {
		reply.send({
			imports: {
				"lit-element": "https://cdn.eik.dev/lit-element/v2",
				"lit-html": "https://cdn.eik.dev/lit-html/v1",
				"lit-html/lit-html": "https://cdn.eik.dev/lit-html/v2",
			},
		});
	});
	const address = await app.listen({
		host: "0.0.0.0",
		port: 50253,
	});

	await fs.promises.writeFile(
		path.join(process.cwd(), "eik.json"),
		JSON.stringify({
			name: "test",
			server: address,
			version: "1.0.0",
			files: {
				"/css": "/src/css/**/*",
				"/js": "/src/js/**/*",
			},
			"import-map": `${address}/one`,
		}),
	);

	t.after(async () => {
		await app.close();
		await fs.promises.unlink(path.join(process.cwd(), "eik.json"));
	});

	// @ts-ignore
	const result = await build({
		logLevel: "silent",
		plugins: [eik()],
		build: {
			write: false,
			lib: {
				entry: FILE,
				name: "test",
			},
			rollupOptions: {
				onwarn: () => {
					// Supress logging
				},
			},
		},
	});

	t.assert.snapshot(clean(result[0].output[0].code));
});

test('plugin() - Import map defined through constructor "maps" argument take precedence over import map defined in eik.json', async (t) => {
	const app = fastify();
	app.server.keepAliveTimeout = 20;
	app.get("/one", (request, reply) => {
		reply.send({
			imports: {
				"lit-element": "https://cdn.eik.dev/lit-element/v1",
			},
		});
	});

	const address = await app.listen({
		host: "0.0.0.0",
		port: 50253,
	});

	await fs.promises.writeFile(
		path.join(process.cwd(), "eik.json"),
		JSON.stringify({
			name: "test",
			server: address,
			version: "1.0.0",
			files: {
				"/css": "/src/css/",
				"/js": "/src/js/",
			},
			"import-map": `${address}/one`,
		}),
	);

	t.after(async () => {
		await app.close();
		await fs.promises.unlink(path.join(process.cwd(), "eik.json"));
	});

	// @ts-ignore
	const result = await build({
		logLevel: "silent",
		plugins: [
			eik({
				maps: [
					{
						imports: {
							"lit-element": "https://cdn.eik.dev/lit-element/v2",
						},
					},
				],
			}),
		],
		build: {
			write: false,
			lib: {
				entry: FILE,
				name: "test",
			},
			rollupOptions: {
				onwarn: () => {
					// Supress logging
				},
			},
		},
	});

	t.assert.snapshot(clean(result[0].output[0].code));
});

test('plugin() - Import map defined through constructor "urls" argument take precedence over import map defined in eik.json', async (t) => {
	const app = fastify();
	app.server.keepAliveTimeout = 20;
	app.get("/one", (request, reply) => {
		reply.send({
			imports: {
				"lit-element": "https://cdn.eik.dev/lit-element/v1",
			},
		});
	});

	app.get("/two", (request, reply) => {
		reply.send({
			imports: {
				"lit-element": "https://cdn.eik.dev/lit-element/v2",
			},
		});
	});

	const address = await app.listen({
		host: "0.0.0.0",
		port: 50253,
	});

	await fs.promises.writeFile(
		path.join(process.cwd(), "eik.json"),
		JSON.stringify({
			name: "test",
			server: address,
			version: "1.0.0",
			files: {
				"/css": "/src/css/",
				"/js": "/src/js/",
			},
			"import-map": `${address}/one`,
		}),
	);

	t.after(async () => {
		await app.close();
		await fs.promises.unlink(path.join(process.cwd(), "eik.json"));
	});

	// @ts-ignore
	const result = await build({
		logLevel: "silent",
		plugins: [
			eik({
				urls: [`${address}/two`],
			}),
		],
		build: {
			write: false,
			lib: {
				entry: FILE,
				name: "test",
			},
			rollupOptions: {
				onwarn: () => {
					// Supress logging
				},
			},
		},
	});

	t.assert.snapshot(clean(result[0].output[0].code));
});

test('plugin() - Import map defined through constructor "maps" argument take precedence over import map defined through constructor "urls" argument', async (t) => {
	const app = fastify();
	app.server.keepAliveTimeout = 20;
	app.get("/one", (request, reply) => {
		reply.send({
			imports: {
				"lit-element": "https://cdn.eik.dev/lit-element/v0",
			},
		});
	});

	app.get("/two", (request, reply) => {
		reply.send({
			imports: {
				"lit-element": "https://cdn.eik.dev/lit-element/v1",
			},
		});
	});

	const address = await app.listen({
		host: "0.0.0.0",
		port: 50253,
	});

	await fs.promises.writeFile(
		path.join(process.cwd(), "eik.json"),
		JSON.stringify({
			name: "test",
			server: address,
			version: "1.0.0",
			files: {
				"/css": "/src/css/",
				"/js": "/src/js/",
			},
			"import-map": `${address}/one`,
		}),
	);

	t.after(async () => {
		await app.close();
		await fs.promises.unlink(path.join(process.cwd(), "eik.json"));
	});

	// @ts-ignore
	const result = await build({
		logLevel: "silent",
		plugins: [
			eik({
				maps: [
					{
						imports: {
							"lit-element": "https://cdn.eik.dev/lit-element/v2",
						},
					},
				],
				urls: [`${address}/two`],
			}),
		],
		build: {
			write: false,
			lib: {
				entry: FILE,
				name: "test",
			},
			rollupOptions: {
				onwarn: () => {
					// Supress logging
				},
			},
		},
	});

	t.assert.snapshot(clean(result[0].output[0].code));
});

test("plugin() - require() of a mapped specifier emits a facade chunk", async (t) => {
	const app = fastify();
	app.server.keepAliveTimeout = 20;
	app.get("/one", (_, reply) => {
		reply.send({
			imports: { "lit-element": "https://cdn.eik.dev/lit-element/v2" },
		});
	});
	const address = await app.listen({ host: "0.0.0.0", port: 50254 });
	t.after(async () => {
		await app.close();
	});

	const result = await build({
		logLevel: "silent",
		plugins: [eik({ urls: [`${address}/one`] })],
		build: {
			write: false,
			lib: {
				entry: path.resolve(
					__dirname,
					"..",
					"fixtures",
					"modules",
					"require-cjs",
					"main.cjs",
				),
				name: "test",
				formats: ["es"],
			},
			rollupOptions: { onwarn: () => {} },
		},
	});

	// Snapshot all chunks together, sorted, so the snapshot is stable across runs.
	const chunks = result[0].output
		.filter((o) => o.type === "chunk")
		.sort((a, b) => a.fileName.localeCompare(b.fileName))
		.map((o) => `// === ${o.fileName} ===\n${clean(o.code)}`)
		.join("\n\n");
	t.assert.snapshot(chunks);
});

test("plugin() - mixed import + require of the same mapped specifier in one build", async (t) => {
	const app = fastify();
	app.server.keepAliveTimeout = 20;
	app.get("/one", (_, reply) => {
		reply.send({
			imports: { "lit-element": "https://cdn.eik.dev/lit-element/v2" },
		});
	});
	const address = await app.listen({ host: "0.0.0.0", port: 50255 });
	t.after(async () => {
		await app.close();
	});

	const result = await build({
		logLevel: "silent",
		plugins: [eik({ urls: [`${address}/one`] })],
		build: {
			write: false,
			lib: {
				entry: path.resolve(
					__dirname,
					"..",
					"fixtures",
					"modules",
					"require-mixed",
					"main.js",
				),
				name: "test",
				formats: ["es"],
			},
			rollupOptions: { onwarn: () => {} },
		},
	});

	const chunks = result[0].output
		.filter((o) => o.type === "chunk")
		.sort((a, b) => a.fileName.localeCompare(b.fileName))
		.map((o) => `// === ${o.fileName} ===\n${clean(o.code)}`)
		.join("\n\n");
	t.assert.snapshot(chunks);
});

test("plugin() - require() of an unmapped specifier passes through", async (t) => {
	const app = fastify();
	app.server.keepAliveTimeout = 20;
	app.get("/one", (_, reply) => {
		reply.send({
			imports: { "lit-element": "https://cdn.eik.dev/lit-element/v2" },
		});
	});
	const address = await app.listen({ host: "0.0.0.0", port: 50256 });
	t.after(async () => {
		await app.close();
	});

	const result = await build({
		logLevel: "silent",
		plugins: [eik({ urls: [`${address}/one`] })],
		build: {
			write: false,
			lib: {
				entry: path.resolve(
					__dirname,
					"..",
					"fixtures",
					"modules",
					"require-unmapped",
					"main.cjs",
				),
				name: "test",
				formats: ["es"],
			},
			rollupOptions: {
				onwarn: () => {},
				external: ["some-unmapped-package"],
			},
		},
	});

	const chunks = result[0].output
		.filter((o) => o.type === "chunk")
		.sort((a, b) => a.fileName.localeCompare(b.fileName))
		.map((o) => `// === ${o.fileName} ===\n${clean(o.code)}`)
		.join("\n\n");
	t.assert.snapshot(chunks);
});
