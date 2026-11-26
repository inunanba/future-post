import { build } from "esbuild";

await build({
  entryPoints: ["src/app.js"],
  bundle: true,
  minify: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  outfile: "dist/app.bundle.js",
  sourcemap: false,
  legalComments: "none"
});
