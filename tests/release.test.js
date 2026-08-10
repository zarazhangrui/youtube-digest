const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("manifest uses minimized install-time permissions", () => {
  const manifest = JSON.parse(read("manifest.json"));
  const packageJson = JSON.parse(read("package.json"));

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.minimum_chrome_version, "116");
  assert.equal(packageJson.version, manifest.version);
  assert.equal(manifest.options_ui.page, "options.html");
  assert.ok(!manifest.permissions.includes("activeTab"));
  assert.ok(manifest.host_permissions.includes("https://api.deepseek.com/*"));
  assert.ok(manifest.optional_host_permissions.includes("https://*/*"));
});

test("release copy documents current scope without em dashes", () => {
  const readme = read("README.md");
  const chineseReadme = read("README.zh-CN.md");
  const manifest = JSON.parse(read("manifest.json"));
  const packageJson = JSON.parse(read("package.json"));

  assert.doesNotMatch(readme, /—/);
  assert.doesNotMatch(chineseReadme, /—/);
  assert.doesNotMatch(manifest.description, /—/);
  assert.doesNotMatch(packageJson.description, /—/);

  assert.equal(manifest.name, "YouTube Digest");
  assert.equal(packageJson.name, "youtube-digest");
  assert.match(read("scripts/package-extension.sh"), /youtube-digest-v\$version\.zip/);
  assert.doesNotMatch(
    [readme, chineseReadme, read("PRIVACY.md"), read("SECURITY.md")].join("\n"),
    /\bYT Digest\b/,
  );
  assert.match(readme, /^# YouTube Digest$/m);
  assert.match(
    readme,
    /Turn every YouTube video into a resource for deep learning\./,
  );
  assert.doesNotMatch(readme, /before deciding how much of it to watch/i);
  assert.match(readme, /^## Install with your coding agent$/m);
  assert.match(
    readme,
    /Download this for me and walk me through step by step how to install it and set it up\. Use simple terms\. https:\/\/github\.com\/zarazhangrui\/youtube-digest/,
  );
  assert.match(readme, /upstream issues and pull requests are not accepted/i);
  assert.doesNotMatch(readme, /^## Contributing$/m);
  assert.match(chineseReadme, /^# YouTube Digest$/m);
  assert.match(chineseReadme, /把每个 YouTube 视频变成一份可以深入学习的资料/);
  assert.match(chineseReadme, /^## 让你的编程 Agent 帮你安装$/m);
  assert.match(chineseReadme, /不接受上游 Issue 或 Pull Request/);
  assert.match(chineseReadme, /增加更多翻译语言/);

  assert.match(readme, /100 credits per month/i);
  assert.match(readme, /native transcript request uses \*\*1 credit\*\*/i);
  assert.match(readme, /generated transcript costs \*\*2 credits per video minute\*\*/i);
  assert.match(readme, /HTTP `206` still uses \*\*1 credit\*\*/i);
  assert.match(readme, /forces `mode=native`/i);
  assert.match(readme, /roughly 100 transcript lookups per month/i);
  assert.match(readme, /supadata\.ai\/pricing/i);
  assert.match(readme, /docs\.supadata\.ai\/get-transcript/i);
  assert.match(readme, /dash\.supadata\.ai\/auth\/sign-up/i);
  assert.match(readme, /platform\.deepseek\.com\/api_keys/i);
  assert.match(readme, /api-docs\.deepseek\.com/i);
  assert.match(readme, /api-docs\.deepseek\.com\/quick_start\/pricing/i);
  assert.match(readme, /api-docs\.deepseek\.com\/quick_start\/token_usage/i);
  assert.match(readme, /api-docs\.deepseek\.com\/guides\/kv_cache/i);
  assert.match(readme, /\$0\.0028[\s\S]*\$0\.14[\s\S]*\$0\.28/);
  assert.match(readme, /2,935 spoken English words/i);
  assert.match(readme, /about 32,600 input tokens/i);
  assert.match(readme, /\$0\.002[^\n]*\$0\.006 USD/i);
  assert.match(chineseReadme, /api-docs\.deepseek\.com\/quick_start\/pricing/i);
  assert.match(chineseReadme, /api-docs\.deepseek\.com\/quick_start\/token_usage/i);
  assert.match(chineseReadme, /api-docs\.deepseek\.com\/guides\/kv_cache/i);
  assert.match(chineseReadme, /\u00a50\.02[\s\S]*\u00a51[\s\S]*\u00a52/);
  assert.match(chineseReadme, /2,935 \u4e2a\u82f1\u6587\u53e3\u8bed\u8bcd/);
  assert.match(chineseReadme, /\u7ea6 32,600 \u4e2a\u8f93\u5165 token/);
  assert.match(chineseReadme, /\$0\.002[^\n]*\$0\.006 USD/);
  assert.match(chineseReadme, /dash\.supadata\.ai\/auth\/sign-up/i);
  assert.match(chineseReadme, /platform\.deepseek\.com\/api_keys/i);
  assert.match(readme, /^### The Digest button is missing on a YouTube video$/m);
  assert.match(
    chineseReadme,
    /^### YouTube 视频页面没有显示 Digest 按钮$/m,
  );

  const optionsPage = read("options.html");
  const optionsScript = read("options.js");
  assert.match(optionsPage, /dash\.supadata\.ai\/auth\/sign-up/i);
  assert.match(optionsPage, /platform\.deepseek\.com\/api_keys/i);
  assert.match(optionsScript, /platform\.deepseek\.com\/api_keys/i);

  assert.match(readme, /^## Remix it with your coding agent$/m);
  assert.match(readme, /more translation languages/i);
  assert.match(readme, /customized summary templates/i);
  assert.match(readme, /vocabulary notebook/i);
});

test("runtime has no source-file credential dependency or retired model", () => {
  const runtime = [
    "background.js",
    "content.js",
    "sidepanel.js",
    "options.js",
    "settings.js",
  ]
    .map(read)
    .join("\n");

  assert.doesNotMatch(runtime, /\bCONFIG\./);
  assert.doesNotMatch(runtime, /importScripts\(["']config\.js/);
  assert.doesNotMatch(runtime, /\bdeepseek-chat\b/);
  assert.match(runtime, /deepseek-v4-flash/);
});

test("retired Remix and reader files are absent", () => {
  for (const file of [
    "reader.html",
    "reader.js",
    "remix-prompts.js",
    "config.example.js",
  ]) {
    assert.equal(fs.existsSync(path.join(root, file)), false, file);
  }
});

test("published prompt files contain runtime sections", () => {
  const expectedSections = {
    "prompts/analysis.md": ["System prompt", "User prompt"],
    "prompts/explain.md": ["System prompt", "User prompt"],
    "prompts/note-cleanup.md": ["System prompt", "User prompt"],
    "prompts/translation.md": [
      "Shared base rules",
      "Chinese rules",
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
