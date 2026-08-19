#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const dev = args.includes("--dev");

const SCSS_ENTRY = path.resolve(__dirname, "../neoabs/templates/assets/stylesheets/neoabs.scss");
const SCSS_COMPONENTS = path.resolve(__dirname, "../neoabs/templates/assets/stylesheets/components.scss");
const CSS_OUTPUT = path.resolve(__dirname, "../neoabs/templates/assets/neoabs.css");
const INCLUDE_PATHS = [
  path.resolve(__dirname, "../"),
  path.resolve(__dirname, "../node_modules"),
];

let sass, postcss, autoprefixer, cssnano;

try {
  sass = require("sass");
} catch {
  console.error("Error: 'sass' package not found. Run: npm install");
  process.exit(1);
}

try {
  postcss = require("postcss");
  autoprefixer = require("autoprefixer");
  cssnano = require("cssnano");
} catch {
  if (!dev) {
    console.error("Error: PostCSS packages not found. Run: npm install");
    process.exit(1);
  }
}

let chokidar;
if (watch) {
  try {
    chokidar = require("chokidar");
  } catch {
    console.error("Error: 'chokidar' package not found for watch mode. Run: npm install");
    process.exit(1);
  }
}

function build() {
  const start = Date.now();

  try {
    const result = sass.compile(SCSS_ENTRY, {
      loadPaths: INCLUDE_PATHS,
      style: dev ? "expanded" : "compressed",
      sourceMap: dev,
    });

    let plugins = [autoprefixer()];
    if (!dev) {
      plugins.push(cssnano({ preset: "default" }));
    }

    postcss(plugins)
      .process(result.css, {
        from: SCSS_ENTRY,
        to: CSS_OUTPUT,
        map: dev ? { inline: true } : false,
      })
      .then((output) => {
        fs.mkdirSync(path.dirname(CSS_OUTPUT), { recursive: true });
        fs.writeFileSync(CSS_OUTPUT, output.css);
        const elapsed = Date.now() - start;
        const mode = dev ? "dev" : "production";
        console.log(`[${mode}] Built neoabs.css in ${elapsed}ms`);
      })
      .catch((err) => {
        console.error("PostCSS error:", err.message);
        if (!watch) process.exit(1);
      });
  } catch (err) {
    console.error("SCSS compilation error:", err.message);
    if (!watch) process.exit(1);
  }
}

build();

if (watch) {
  const watchPaths = [
    path.resolve(__dirname, "../neoabs/templates/assets/stylesheets/"),
  ];

  console.log("Watching for changes...");

  chokidar.watch(watchPaths, {
    ignored: /node_modules/,
    ignoreInitial: true,
  }).on("all", (event, filePath) => {
    if (filePath.endsWith(".scss")) {
      console.log(`Change detected: ${path.basename(filePath)}`);
      build();
    }
  });
}
