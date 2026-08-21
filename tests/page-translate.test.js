const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("ordinary web pages receive the selection translation content script", () => {
  const manifest = JSON.parse(read("manifest.json"));
  const script = manifest.content_scripts.find((item) =>
    item.js.includes("page-translate.js")
  );

  assert.ok(script, "page translation content script must be registered");
  assert.deepEqual(script.matches, ["http://*/*", "https://*/*"]);
  assert.deepEqual(script.exclude_matches, ["https://www.youtube.com/*"]);
  assert.equal(script.run_at, "document_idle");
});

test("page translation script sends selected text to the translation action", () => {
  const source = read("page-translate.js");

  assert.match(source, /window\.getSelection\(\)/);
  assert.match(source, /action: "translateContent"/);
  assert.match(source, /contentType: "selectedText"/);
  assert.match(source, /targetLanguage: "zh"/);
  assert.match(source, /PAGE_TRANSLATE_MAX_SELECTION_CHARS = 4000/);
  assert.doesNotMatch(source, /youtube\.com/);
});
