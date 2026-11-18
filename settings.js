/**
 * Shared, non-secret configuration helpers.
 *
 * API keys are stored in chrome.storage.local by options.js. This file contains
 * defaults and validation only, so it is safe to publish.
 */
var YTD_SETTINGS = (() => {
  const STORAGE_KEY = "ytd_settings";
  const AI_PROVIDERS = Object.freeze({
    deepseek: Object.freeze({
      label: "DeepSeek",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
    }),
    openai: Object.freeze({
      label: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4.1-mini",
    }),
  });
  const OPENAI_ORIGIN = "https://api.openai.com/*";
  const DEFAULTS = Object.freeze({
    provider: "deepseek",
    aiApiKey: "",
    openAiApiKey: "",
    aiBaseUrl: AI_PROVIDERS.deepseek.baseUrl,
    aiModel: AI_PROVIDERS.deepseek.model,
    supadataApiKey: "",
  });

  function isLegacyCustom(input) {
    return !!input && input.provider === "custom";
  }

  function normalize(input = {}) {
    input ??= {};
    const provider = input.provider === "openai" ? "openai" : DEFAULTS.provider;
    const { baseUrl, model } = AI_PROVIDERS[provider];
    return {
      provider,
      // Keep the original aiApiKey field dedicated to DeepSeek.
      aiApiKey: isLegacyCustom(input)
        ? ""
        : typeof input.aiApiKey === "string"
          ? input.aiApiKey.trim()
          : "",
      openAiApiKey:
        typeof input.openAiApiKey === "string" ? input.openAiApiKey.trim() : "",
      aiBaseUrl: baseUrl,
      aiModel: model,
      supadataApiKey:
        typeof input.supadataApiKey === "string"
          ? input.supadataApiKey.trim()
          : "",
    };
  }

  function migrateLegacyCustom(input = {}) {
    return {
      settings: normalize(input),
      migrated: isLegacyCustom(input),
    };
  }

  function getAiApiKey(settings) {
    return settings.provider === "openai"
      ? settings.openAiApiKey
      : settings.aiApiKey;
  }

  function chatCompletionsUrl(provider = DEFAULTS.provider) {
    const config = provider === "openai" ? AI_PROVIDERS.openai : AI_PROVIDERS.deepseek;
    return `${config.baseUrl}/chat/completions`;
  }

  function canonicalYouTubeUrl(videoId) {
    const normalized = String(videoId || "").trim();
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(normalized)) {
      throw new Error("Invalid YouTube video ID.");
    }
    return `https://www.youtube.com/watch?v=${normalized}`;
  }

  return {
    STORAGE_KEY,
    DEFAULTS,
    AI_PROVIDERS,
    OPENAI_ORIGIN,
    getAiApiKey,
    isLegacyCustom,
    normalize,
    migrateLegacyCustom,
    chatCompletionsUrl,
    canonicalYouTubeUrl,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = YTD_SETTINGS;
}
