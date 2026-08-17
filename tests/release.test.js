const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("manifest packages the current v1.2 extension capabilities", () => {
  const manifest = JSON.parse(read("manifest.json"));
  const packageJson = JSON.parse(read("package.json"));

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.minimum_chrome_version, "116");
  assert.equal(manifest.version, "1.2.0");
  assert.equal(packageJson.version, manifest.version);
  assert.ok(!manifest.permissions.includes("activeTab"));
  assert.ok(manifest.host_permissions.includes("https://api.deepseek.com/*"));
  assert.ok(manifest.host_permissions.includes("https://api.openai.com/*"));
  assert.ok(manifest.optional_host_permissions.includes("https://*/*"));
  assert.equal(manifest.options_ui.page, "options.html");
});

test("release copy and settings document the multilingual multi-provider interface", () => {
  const readme = read("README.md");
  const chineseReadme = read("README.zh-CN.md");
  const optionsPage = read("options.html");
  const optionsScript = read("options.js");

  assert.match(readme, /user-selected target languages/i);
  assert.match(readme, /Original, Translation, and Bilingual/i);
  assert.match(readme, /multiple AI providers/i);
  assert.match(chineseReadme, /目标语言/);
  assert.match(optionsPage, /id="defaultAiModel"/);
  assert.match(optionsPage, /data-test-model="deepseek-v4-flash"/);
  assert.match(optionsPage, /data-test-model="gpt-5.6-luna"/);
  assert.match(optionsScript, /connectionSuccess/);
  assert.match(optionsScript, /connectionFailed/);
});

test("runtime has no source-file credential dependency", () => {
  const runtime = ["background.js", "content.js", "sidepanel.js", "options.js", "settings.js"]
    .map(read)
    .join("\n");

  assert.doesNotMatch(runtime, /\bCONFIG\./);
  assert.doesNotMatch(runtime, /importScripts\(["']config\.js/);
  assert.match(runtime, /deepseek-v4-flash/);
  assert.match(runtime, /gpt-5.6-luna/);
});

test("published prompt files contain the sections used by the runtime", () => {
  const expectedSections = {
    "prompts/analysis.md": ["System prompt", "User prompt"],
    "prompts/explain.md": ["System prompt", "User prompt"],
    "prompts/note-cleanup.md": ["System prompt", "User prompt"],
    "prompts/translation.md": [
      "Shared base rules",
      "Simplified Chinese rules",
      "Transcript batch translation",
    ],
  };

  for (const [file, sections] of Object.entries(expectedSections)) {
    const markdown = read(file);
    for (const section of sections) {
      assert.match(markdown, new RegExp(`^## ${section}$`, "m"));
    }
  }
});
