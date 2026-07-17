const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const RELEASE_DIR = path.join(ROOT, "release", "focusink");

const FILES_TO_COPY = [
  "manifest.json",
  "dist/content/content.js",
  "dist/popup/popup.js",
  "src/content/content.css",
  "src/popup/popup.html",
  "src/popup/popup.css",
  "public/icons/icon16.png",
  "public/icons/icon32.png",
  "public/icons/icon48.png",
  "public/icons/icon128.png",
];

fs.rmSync(RELEASE_DIR, { recursive: true, force: true });

for (const relativePath of FILES_TO_COPY) {
  const source = path.join(ROOT, relativePath);
  const destination = path.join(RELEASE_DIR, relativePath);

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

console.log(`Release staged at ${RELEASE_DIR}`);
