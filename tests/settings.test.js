const test = require("node:test");
const assert = require("node:assert/strict");

const settings = require("../settings.js");

test("multi-provider settings preserve DeepSeek defaults and normalize provider configuration", () => {
  const normalized = settings.normalize({
    provider: "unexpected",
    aiApiKey: "  example-key  ",
    aiBaseUrl: "https://api.example.com/v1",
    aiModel: "example-model",
    supadataApiKey: "  example-supadata  ",
  });

  assert.equal(normalized.provider, "deepseek");
  assert.equal(normalized.providers.deepseek.baseUrl, "https://api.example.com/v1");
  assert.equal(normalized.defaultModel, "deepseek-v4-flash");
  assert.equal(normalized.aiApiKey, "example-key");
  assert.equal(normalized.supadataApiKey, "example-supadata");
  assert.equal(
    settings.chatCompletionsUrl(normalized.providers.deepseek.baseUrl),
    "https://api.example.com/v1/chat/completions",
  );
});

test("legacy custom migration preserves the remaining settings and is idempotent", () => {
  const legacy = {
    provider: "custom",
    aiApiKey: "custom-secret",
    aiBaseUrl: "https://api.example.com/v1",
    aiModel: "example-model",
    supadataApiKey: " supadata-secret ",
  };
  const first = settings.migrateLegacyCustom(legacy);

  assert.equal(first.migrated, true);
  assert.equal(first.settings.provider, "deepseek");
  assert.equal(first.settings.providers.deepseek.baseUrl, "https://api.example.com/v1");
  assert.equal(first.settings.defaultModel, "deepseek-v4-flash");
  assert.equal(first.settings.aiApiKey, "custom-secret");
  assert.equal(first.settings.supadataApiKey, "supadata-secret");

  const second = settings.migrateLegacyCustom(first.settings);
  assert.equal(second.migrated, false);
  assert.deepEqual(second.settings, first.settings);

  const configuredDeepSeek = settings.normalize({
    ...first.settings,
    providers: {
      ...first.settings.providers,
      deepseek: { ...first.settings.providers.deepseek, apiKey: "dkey2" },
    },
  });
  assert.equal(configuredDeepSeek.aiApiKey, "dkey2");
});

test("OpenAI and multiple target languages are retained", () => {
  const normalized = settings.normalize({
    preferredTargetLanguages: ["pt-BR", "zh-CN", "pt-BR"],
    defaultTargetLanguage: "pt-BR",
    defaultModel: "gpt-5.6-luna",
    providers: { openai: { enabled: true, apiKey: "openai-key" } },
  });
  assert.deepEqual(normalized.preferredTargetLanguages, ["pt-BR", "zh-CN"]);
  assert.equal(normalized.defaultTargetLanguage, "pt-BR");
  assert.equal(normalized.providers.openai.enabled, true);
  assert.equal(settings.resolveModel(normalized).providerId, "openai");
});

test("Supadata receives a canonical YouTube URL", () => {
  assert.equal(
    settings.canonicalYouTubeUrl("ydTeb_I0b94"),
    "https://www.youtube.com/watch?v=ydTeb_I0b94",
  );
  assert.throws(
    () => settings.canonicalYouTubeUrl('"><script>'),
    /Invalid YouTube video ID/,
  );
});
test("sourceLanguage defaults to auto and accepts explicit BCP-47 values", () => {
  assert.equal(settings.normalize({}).sourceLanguage, "auto");
  assert.equal(settings.normalize({ sourceLanguage: " pt " }).sourceLanguage, "pt");
  assert.equal(
    settings.normalize({ sourceLanguage: "zh-Hant-TW" }).sourceLanguage,
    "zh-Hant-TW",
  );
});
