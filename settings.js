/**
 * Shared, non-secret configuration helpers.
 *
 * API keys are stored in chrome.storage.local by options.js. This file contains
 * defaults, model/provider metadata, and validation only.
 */
var YTD_SETTINGS = (() => {
  const STORAGE_KEY = "ytd_settings";
  const DEFAULTS = Object.freeze({
    supadataApiKey: "",
    sourceLanguage: "auto",
    preferredTargetLanguages: ["zh-CN"],
    defaultTargetLanguage: "zh-CN",
    defaultModel: "deepseek-v4-flash",
    taskModels: Object.freeze({
      translation: "deepseek-v4-flash",
      explanation: "deepseek-v4-flash",
      analysis: "deepseek-v4-flash",
      note: "deepseek-v4-flash",
    }),
    providers: Object.freeze({
      deepseek: Object.freeze({
        enabled: true,
        apiKey: "",
        baseUrl: "https://api.deepseek.com",
      }),
      gemini: Object.freeze({
        enabled: false,
        apiKey: "",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      }),
      openai: Object.freeze({
        enabled: false,
        apiKey: "",
        baseUrl: "https://api.openai.com/v1",
      }),
      custom: Object.freeze({
        enabled: false,
        apiKey: "",
        baseUrl: "",
        model: "",
      }),
    }),
  });

  const MODEL_PROFILES = Object.freeze({
    "deepseek-v4-flash": { id: "deepseek-v4-flash", provider: "deepseek", model: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
    "deepseek-v4-pro": { id: "deepseek-v4-pro", provider: "deepseek", model: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
    "gemini-3.6-flash": { id: "gemini-3.6-flash", provider: "gemini", model: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
    "gemini-3.5-flash-lite": { id: "gemini-3.5-flash-lite", provider: "gemini", model: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
    "gpt-5.6-luna": { id: "gpt-5.6-luna", provider: "openai", model: "gpt-5.6-luna", label: "GPT-5.6 Luna" },
    "gpt-5.6-terra": { id: "gpt-5.6-terra", provider: "openai", model: "gpt-5.6-terra", label: "GPT-5.6 Terra" },
    "custom": { id: "custom", provider: "custom", model: "", label: "Custom OpenAI-compatible" },
  });

  const LANGUAGE_ALIASES = Object.freeze({
    "zh-cn": "zh-CN", "zh-tw": "zh-TW", "zh-hk": "zh-HK",
    "pt-pt": "pt-PT", "pt-br": "pt-BR", "en-us": "en-US", "en-gb": "en-GB",
  });

  function normalizeTargetLanguage(value) {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw) return "";
    const normalized = raw.replace(/_/g, "-");
    const alias = LANGUAGE_ALIASES[normalized.toLowerCase()];
    if (alias) return alias;
    try { return new Intl.Locale(normalized).toString(); } catch (_error) { return normalized; }
  }

  function normalizeTargetLanguageList(values) {
    const input = Array.isArray(values) ? values : [];
    const result = [];
    const seen = new Set();
    for (const value of input) {
      const normalized = normalizeTargetLanguage(value);
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(normalized);
    }
    return result;
  }

  function normalizeSourceLanguage(value) {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw || raw === "auto") return "auto";
    const normalized = raw.replace(/_/g, "-");
    try { return new Intl.Locale(normalized).toString(); } catch (_error) { return normalized; }
  }

  function normalizeProviderId(value) {
    return Object.prototype.hasOwnProperty.call(DEFAULTS.providers, value) ? value : "deepseek";
  }

  function normalizeProviders(input = {}) {
    const source = input && typeof input === "object" ? input : {};
    const result = {};
    for (const providerId of Object.keys(DEFAULTS.providers)) {
      const fallback = DEFAULTS.providers[providerId];
      const current = source[providerId] && typeof source[providerId] === "object" ? source[providerId] : {};
      result[providerId] = {
        enabled: providerId === "deepseek" ? true : !!current.enabled,
        apiKey: typeof current.apiKey === "string" ? current.apiKey.trim() : fallback.apiKey,
        baseUrl: typeof current.baseUrl === "string" ? current.baseUrl.trim() || fallback.baseUrl : fallback.baseUrl,
        model: typeof current.model === "string" ? current.model.trim() : (fallback.model || ""),
      };
    }
    // v11.x stored DeepSeek in top-level aiApiKey/aiBaseUrl.
    if (!result.deepseek.apiKey && typeof input.aiApiKey === "string") result.deepseek.apiKey = input.aiApiKey.trim();
    if ((!result.deepseek.baseUrl || result.deepseek.baseUrl === DEFAULTS.providers.deepseek.baseUrl) && typeof input.aiBaseUrl === "string" && input.aiBaseUrl.trim()) {
      result.deepseek.baseUrl = input.aiBaseUrl.trim();
    }
    return result;
  }

  function normalizeModelId(value, fallback = DEFAULTS.defaultModel) {
    const candidate = typeof value === "string" ? value.trim() : "";
    return MODEL_PROFILES[candidate] ? candidate : fallback;
  }

  function normalizeTaskModels(input = {}) {
    const source = input && typeof input === "object" ? input : {};
    const result = {};
    for (const task of Object.keys(DEFAULTS.taskModels)) result[task] = normalizeModelId(source[task], DEFAULTS.taskModels[task]);
    return result;
  }

  function normalize(input = {}) {
    const providers = normalizeProviders(input.providers || input);
    const defaultModel = normalizeModelId(input.defaultModel || input.aiModel, DEFAULTS.defaultModel);
    return {
      supadataApiKey: typeof input.supadataApiKey === "string" ? input.supadataApiKey.trim() : "",
      sourceLanguage: normalizeSourceLanguage(input.sourceLanguage),
      preferredTargetLanguages: (() => {
        const preferred = normalizeTargetLanguageList(input.preferredTargetLanguages);
        const fallback = normalizeTargetLanguage(input.defaultTargetLanguage) || DEFAULTS.defaultTargetLanguage;
        return preferred.length ? preferred : [fallback];
      })(),
      defaultTargetLanguage: (() => {
        const preferred = normalizeTargetLanguageList(input.preferredTargetLanguages);
        const candidate = normalizeTargetLanguage(input.defaultTargetLanguage);
        if (candidate && (preferred.length === 0 || preferred.some((v) => v.toLowerCase() === candidate.toLowerCase()))) return candidate;
        return preferred[0] || DEFAULTS.defaultTargetLanguage;
      })(),
      defaultModel,
      taskModels: normalizeTaskModels(input.taskModels),
      providers,
      // Legacy aliases are retained for one release so older code/tests can read them.
      provider: "deepseek",
      aiApiKey: providers.deepseek.apiKey,
      aiBaseUrl: providers.deepseek.baseUrl,
      aiModel: MODEL_PROFILES[defaultModel]?.model || DEFAULTS.defaultModel,
    };
  }

  function isLegacyCustom(input = {}) { return !!input && input.provider === "custom"; }

  function migrateLegacyCustom(input = {}) {
    const legacy = isLegacyCustom(input);
    return { settings: normalize(input), migrated: legacy };
  }

  function resolveLanguageFromVideoMetadata(metadata) {
    if (!metadata || typeof metadata !== "object") return null;
    const captionLanguages = Array.isArray(metadata.captionLanguages) ? metadata.captionLanguages.filter(Boolean) : [];
    const raw = String(captionLanguages[0] || metadata.defaultAudioLanguage || metadata.audioLanguage || "").trim();
    if (!raw) return null;
    const normalized = raw.replace(/_/g, "-");
    try {
      const locale = new Intl.Locale(normalized);
      const language = locale.language;
      if (!language) return null;
      if (language === "zh" && locale.script) return `${language}-${locale.script}`;
      return language;
    } catch (_error) { return normalized.split("-")[0] || null; }
  }

  function getModelProfiles() { return MODEL_PROFILES; }

  function resolveModel(settings, modelId) {
    const normalized = normalize(settings);
    const id = normalizeModelId(modelId, normalized.defaultModel);
    const profile = MODEL_PROFILES[id];
    if (!profile) throw new Error(`Unknown AI model: ${id}`);
    const provider = normalized.providers[profile.provider];
    if (!provider) throw new Error(`Unknown AI provider: ${profile.provider}`);
    return {
      id,
      providerId: profile.provider,
      model: profile.provider === "custom" ? (provider.model || "") : profile.model,
      label: profile.provider === "custom" ? "Custom OpenAI-compatible" : profile.label,
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      enabled: provider.enabled,
    };
  }

  function chatCompletionsUrl(baseUrl) {
    const base = String(baseUrl || "").replace(/\/+$/, "");
    return base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
  }

  function canonicalYouTubeUrl(videoId) {
    const normalized = String(videoId || "").trim();
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(normalized)) throw new Error("Invalid YouTube video ID.");
    return `https://www.youtube.com/watch?v=${normalized}`;
  }

  return {
    STORAGE_KEY, DEFAULTS, MODEL_PROFILES, getModelProfiles, isLegacyCustom, migrateLegacyCustom,
    normalize, normalizeSourceLanguage, normalizeTargetLanguage, normalizeTargetLanguageList,
    resolveLanguageFromVideoMetadata, resolveModel, chatCompletionsUrl, canonicalYouTubeUrl,
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = YTD_SETTINGS;
