const YTD_OPTIONS = (() => {
  const LANGUAGE_STORAGE_KEY = "ytd_options_language";
  const PREVIEW_STORAGE_PREFIX = "youtubeDigestPreview:";
  const SUPPORTED_LANGUAGES = new Set(["en", "zh-CN"]);
  const TARGET_LANGUAGES = Object.freeze([
    ["zh-CN", "中文 (简体)"], ["zh-TW", "中文 (繁體)"], ["en", "English"],
    ["pt-PT", "Português (Portugal)"], ["pt-BR", "Português (Brasil)"],
    ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"],
    ["it", "Italiano"], ["nl", "Nederlands"], ["sv", "Svenska"],
    ["da", "Dansk"], ["no", "Norsk"], ["fi", "Suomi"], ["pl", "Polski"],
    ["cs", "Čeština"], ["tr", "Türkçe"], ["el", "Ελληνικά"],
    ["uk", "Українська"], ["ru", "Русский"], ["ar", "العربية"],
    ["he", "עברית"], ["fa", "فارسی"], ["hi", "हिन्दी"], ["id", "Bahasa Indonesia"],
    ["ms", "Bahasa Melayu"], ["th", "ไทย"], ["vi", "Tiếng Việt"],
    ["ja", "日本語"], ["ko", "한국어"],
  ]);

  const COPY = {
    en: {
      pageTitle: "YouTube Digest Settings",
      languageGroupLabel: "Interface language",
      heading: "Bring your own API keys",
      lede:
        "Keys stay in this Chrome profile and are sent only to the providers you enable and Supadata. This open-source extension has no developer server or analytics.",
      transcriptProvider: "Transcript provider",
      learningLanguagesTitle: "Learning languages",
      learningLanguagesHelp: "Choose one or more languages you may use for translation. The default language is used when a new video is opened, but you can switch targets at any time.",
      defaultTargetLanguageLabel: "Default target language",
      defaultTargetLanguageHelp: "This is only the initial target for a new video. It does not limit your other preferred languages.",
      supadataApiKeyLabel: "Supadata API key",
      supadataHelp: "Used to fetch timestamped YouTube subtitles. ",
      supadataLink: "Create a Supadata account and key",
      supadataHelpSuffix:
        ". Supadata generates the key during onboarding.",
      aiProvider: "AI providers & models",
      aiProviderHelp: "Connect one or more providers. The default model initializes new videos; each task can use its own model.",
      defaultAiModelLabel: "Default AI model",
      translationModelLabel: "Translation",
      explanationModelLabel: "Explanation",
      analysisModelLabel: "Overview / analysis",
      noteModelLabel: "Note polishing",
      deepseekProvider: "DeepSeek",
      geminiProvider: "Google Gemini",
      openaiProvider: "OpenAI",
      customProvider: "Custom OpenAI-compatible",
      providerEnabled: "Enabled",
      apiKeyLabel: "API key",
      modelLabel: "Model",
      baseUrlLabel: "Base URL",
      customModelLabel: "Custom model ID",
      testConnection: "Test connection",
      testing: "Testing…",
      connectionSuccess: ({ model }) => `Connection successful: ${model}`,
      connectionFailed: ({ error }) => `Connection failed: ${error}`,
      customPermissionHelp: "Custom endpoints require Chrome host permission for that API origin. Chrome will ask before granting it.",
      providerSummaryLabel: "Supported AI provider",
      providerBadge: "Supported in this version",
      deepseekApiKeyLabel: "DeepSeek API key",
      deepseekHelp:
        "YouTube Digest uses DeepSeek V4 Flash for overviews, explanations, translation, and note polishing. ",
      deepseekLink: "Create a DeepSeek API key",
      deepseekHelpSuffix: ".",
      privacyNote:
        "When you use AI features, the selected provider receives the video transcript and relevant video context. Review that provider's terms and pricing before saving.",
      saveSettings: "Save settings",
      localRemix: "Local remix",
      customizationTitle: "Want to use another AI model?",
      customizationPurpose: "Edit and copy a safe prompt for your coding agent",
      agentBadge: "Coding agent ready",
      customizationIntro:
        "You can edit the prompt directly. Complete these three steps before copying:",
      customizationStepFolder:
        "Open the extracted YouTube Digest project folder in your coding agent.",
      customizationStepReplace:
        "Replace [PROVIDER] and [MODEL] with the service and model you want to use.",
      customizationStepKeys:
        "Never include API keys in the prompt or chat. Enter them yourself after the code is ready.",
      customizationPromptLabel: "Editable customization prompt",
      customizationReminderLabel: "Prompt reminder",
      customizationReminder:
        "Before copying, replace [PROVIDER] and [MODEL] with the provider and model you want to use.",
      customizationPrompt:
        "Customize this local YouTube Digest workspace to use [PROVIDER] with [MODEL]. Work only in the current workspace. Before editing, verify that it contains manifest.json and that the manifest name is YouTube Digest. If verification fails, stop and ask me to open the extracted YouTube Digest project folder in my coding agent. Do not search other folders, edit a guessed copy, assume an installation path, or claim Chrome can reveal the absolute OS source path. Update the provider's API endpoint, request format, and minimum Chrome host permissions. Preserve bring-your-own-key and local Chrome storage. Never put API keys in source code, commits, logs, screenshots, this prompt, or chat; after the code is ready, tell me where to enter the key myself. Keep DeepSeek-only request fields and retry behavior isolated to DeepSeek. Handle provider-specific rules separately so one provider does not affect another. Update README.md, README.zh-CN.md, PRIVACY.md, SECURITY.md, and tests. Run npm test, npm run check, and npm run package. Then explain how to reload the unpacked extension and test it on a real YouTube video.",
      copyCustomizationPrompt: "Copy edited prompt",
      localData: "Local data",
      localDataHelp:
        "Digests, translations, and notes are stored only in this Chrome profile. You can remove them at any time.",
      clearCache: "Clear cached digests",
      deleteNotes: "Delete all notes",
      resetData: "Reset extension data",
      footer:
        'Read <a href="PRIVACY.md" target="_blank">PRIVACY.md</a> in the repository for the complete data-flow description.',
      migrationWarning:
        "Custom provider settings were removed safely. Your Supadata key was kept, but the AI key was cleared. Enter a DeepSeek API key to continue.",
      saving: "Saving…",
      addSupadataKey: "Add a Supadata API key.",
      addDeepseekKey: "Add a DeepSeek API key.",
      saved: "Saved. Reopen YouTube Digest to use these settings.",
      saveFailed: "Could not save settings. Please try again.",
      copying: "Copying…",
      promptCopied: "Edited prompt copied.",
      copyFailed:
        "Could not copy the prompt. Select the prompt text and copy it manually.",
      clearedDigests: ({ count }) =>
        `Cleared ${count} cached digest${count === 1 ? "" : "s"}.`,
      notesDeleted: "Deleted all saved notes.",
      resetConfirm:
        "Delete API keys, cached digests, translations, and saved notes from this Chrome profile?",
      allDataDeleted: "All YouTube Digest data was deleted.",
      settingsLoadFailed:
        "Could not load saved settings. You can still preview this page.",
    },
    "zh-CN": {
      pageTitle: "YouTube Digest 设置",
      languageGroupLabel: "界面语言",
      heading: "使用你自己的 API 密钥",
      lede:
        "密钥仅保存在当前 Chrome 个人资料中，只会发送给你启用的 AI 服务和 Supadata。本开源扩展没有开发者服务器，也不使用分析服务。",
      transcriptProvider: "字幕服务",
      learningLanguagesTitle: "学习语言",
      learningLanguagesHelp: "选择一个或多个你可能用于翻译的语言。打开新视频时使用默认语言，但你随时可以切换目标语言。",
      defaultTargetLanguageLabel: "默认目标语言",
      defaultTargetLanguageHelp: "这只是打开新视频时的初始目标语言，不会限制你的其他偏好语言。",
      supadataApiKeyLabel: "Supadata API 密钥",
      supadataHelp: "用于获取带时间戳的 YouTube 字幕。",
      supadataLink: "创建 Supadata 账号并获取密钥",
      supadataHelpSuffix: "。Supadata 会在引导流程中生成密钥。",
      aiProvider: "AI 服务与模型",
      aiProviderHelp: "可以连接一个或多个服务。默认模型用于打开新视频时初始化；不同任务可以分别使用不同模型。",
      defaultAiModelLabel: "默认 AI 模型",
      translationModelLabel: "翻译",
      explanationModelLabel: "解释",
      analysisModelLabel: "概览 / 分析",
      noteModelLabel: "笔记润色",
      deepseekProvider: "DeepSeek",
      geminiProvider: "Google Gemini",
      openaiProvider: "OpenAI",
      customProvider: "自定义 OpenAI 兼容服务",
      providerEnabled: "启用",
      apiKeyLabel: "API 密钥",
      modelLabel: "模型",
      baseUrlLabel: "Base URL",
      customModelLabel: "自定义模型 ID",
      testConnection: "测试连接",
      testing: "正在测试…",
      connectionSuccess: ({ model }) => `连接成功：${model}`,
      connectionFailed: ({ error }) => `连接失败：${error}`,
      customPermissionHelp: "自定义服务需要 Chrome 授予该 API 域名的访问权限。保存或测试时 Chrome 会请求授权。",
      providerSummaryLabel: "支持的 AI 服务",
      providerBadge: "当前版本支持",
      deepseekApiKeyLabel: "DeepSeek API 密钥",
      deepseekHelp:
        "YouTube Digest 使用 DeepSeek V4 Flash 生成概览、解释内容、翻译字幕和润色笔记。",
      deepseekLink: "创建 DeepSeek API 密钥",
      deepseekHelpSuffix: "。",
      privacyNote:
        "使用 AI 功能时，你选择的服务会收到视频字幕及相关视频上下文。保存前请查看对应服务的条款和价格。",
      saveSettings: "保存设置",
      localRemix: "本地改造",
      customizationTitle: "想使用其他 AI 模型？",
      customizationPurpose: "编辑并复制一段可安全交给编程 Agent 的提示词",
      agentBadge: "可交给编程 Agent",
      customizationIntro: "你可以直接编辑提示词。复制前完成以下三步：",
      customizationStepFolder:
        "在编程 Agent 中打开 YouTube Digest 解压后的项目文件夹。",
      customizationStepReplace:
        "把 [PROVIDER] 和 [MODEL] 替换成你想使用的服务和模型。",
      customizationStepKeys:
        "不要在提示词或聊天中加入 API 密钥。代码准备好后，请自行填写。",
      customizationPromptLabel: "可编辑的自定义提示词",
      customizationReminderLabel: "提示词提醒",
      customizationReminder:
        "复制前，请先把 [PROVIDER] 和 [MODEL] 替换成你想使用的服务和模型。",
      customizationPrompt:
        "请把当前本地 YouTube Digest 工作区改为使用 [PROVIDER] 提供的 [MODEL]。只在当前工作区中操作。编辑前，先确认其中包含 manifest.json，且 manifest 中的 name 是 YouTube Digest。如果验证失败，请停止，并让我在编程 Agent 中打开 YouTube Digest 解压后的项目文件夹。不要搜索其他文件夹，不要编辑猜测的副本，不要假设安装路径，也不要声称 Chrome 可以显示操作系统中的绝对源码路径。更新该服务的 API endpoint、请求格式和最少的 Chrome host permissions。保留用户自带密钥模式和 Chrome 本地存储。不要把 API 密钥写入源代码、提交记录、日志、截图、这段提示词或聊天；代码准备好后，请告诉我应该在哪里自行填写密钥。DeepSeek 专用的请求参数和重试逻辑继续只用于 DeepSeek。新服务的专属规则请单独处理，避免相互影响。更新 README.md、README.zh-CN.md、PRIVACY.md、SECURITY.md 和测试。运行 npm test、npm run check 和 npm run package。最后，说明如何重新加载已解压的扩展，并在真实 YouTube 视频上测试。",
      copyCustomizationPrompt: "复制编辑后的提示词",
      localData: "本地数据",
      localDataHelp:
        "摘要、翻译和笔记仅保存在当前 Chrome 个人资料中。你可以随时删除。",
      clearCache: "清除缓存的摘要",
      deleteNotes: "删除全部笔记",
      resetData: "重置扩展数据",
      footer:
        '完整数据流说明请参阅仓库中的 <a href="PRIVACY.md" target="_blank">PRIVACY.md</a>。',
      migrationWarning:
        "已安全移除自定义服务设置。Supadata 密钥已保留，AI 密钥已清除。请输入 DeepSeek API 密钥以继续使用。",
      saving: "正在保存…",
      addSupadataKey: "请添加 Supadata API 密钥。",
      addDeepseekKey: "请添加 DeepSeek API 密钥。",
      saved: "已保存。请重新打开 YouTube Digest 以使用这些设置。",
      saveFailed: "无法保存设置，请重试。",
      copying: "正在复制…",
      promptCopied: "已复制编辑后的提示词。",
      copyFailed: "无法复制提示词。请选中提示词文本并手动复制。",
      clearedDigests: ({ count }) => `已清除 ${count} 条缓存摘要。`,
      notesDeleted: "已删除全部已保存的笔记。",
      resetConfirm:
        "要从当前 Chrome 个人资料中删除 API 密钥、缓存摘要、翻译和已保存的笔记吗？",
      allDataDeleted: "已删除全部 YouTube Digest 数据。",
      settingsLoadFailed: "无法加载已保存的设置，但你仍可预览此页面。",
    },
  };

  function normalizeLanguage(language) {
    return SUPPORTED_LANGUAGES.has(language) ? language : "en";
  }

  function translate(language, key, params = {}) {
    const normalizedLanguage = normalizeLanguage(language);
    const value = COPY[normalizedLanguage][key] ?? COPY.en[key] ?? "";
    return typeof value === "function" ? value(params) : value;
  }

  function createStorageAdapter(chromeApi, fallbackStorage) {
    const chromeStorage = chromeApi?.storage?.local;
    const memoryStorage = new Map();

    function fallbackKeys() {
      const keys = [];
      if (!fallbackStorage) return keys;
      try {
        for (let index = 0; index < fallbackStorage.length; index += 1) {
          const key = fallbackStorage.key(index);
          if (key?.startsWith(PREVIEW_STORAGE_PREFIX)) keys.push(key);
        }
      } catch (_error) {
        return [];
      }
      return keys;
    }

    function readFallbackValue(key) {
      try {
        const rawValue = fallbackStorage?.getItem(
          `${PREVIEW_STORAGE_PREFIX}${key}`,
        );
        if (rawValue !== null && rawValue !== undefined) {
          return JSON.parse(rawValue);
        }
      } catch (_error) {
        // Fall through to memory when localStorage is unavailable or malformed.
      }
      return memoryStorage.get(key);
    }

    function writeFallbackValue(key, value) {
      memoryStorage.set(key, value);
      try {
        fallbackStorage?.setItem(
          `${PREVIEW_STORAGE_PREFIX}${key}`,
          JSON.stringify(value),
        );
      } catch (_error) {
        // The in-memory copy keeps a restricted preview functional.
      }
    }

    return {
      async get(keys) {
        if (chromeStorage) return chromeStorage.get(keys);

        const requestedKeys =
          keys === null
            ? [
                ...new Set([
                  ...memoryStorage.keys(),
                  ...fallbackKeys().map((key) =>
                    key.slice(PREVIEW_STORAGE_PREFIX.length),
                  ),
                ]),
              ]
            : Array.isArray(keys)
              ? keys
              : [keys];

        return Object.fromEntries(
          requestedKeys
            .map((key) => [key, readFallbackValue(key)])
            .filter(([, value]) => value !== undefined),
        );
      },

      async set(items) {
        if (chromeStorage) return chromeStorage.set(items);
        for (const [key, value] of Object.entries(items)) {
          writeFallbackValue(key, value);
        }
      },

      async remove(keys) {
        if (chromeStorage) return chromeStorage.remove(keys);
        for (const key of Array.isArray(keys) ? keys : [keys]) {
          memoryStorage.delete(key);
          try {
            fallbackStorage?.removeItem(`${PREVIEW_STORAGE_PREFIX}${key}`);
          } catch (_error) {
            // Memory removal is sufficient for this preview session.
          }
        }
      },

      async clear() {
        if (chromeStorage) return chromeStorage.clear();
        memoryStorage.clear();
        for (const key of fallbackKeys()) {
          try {
            fallbackStorage.removeItem(key);
          } catch (_error) {
            // Continue clearing any remaining preview keys.
          }
        }
      },
    };
  }

  async function readPreferredLanguage(storage) {
    const stored = await storage.get(LANGUAGE_STORAGE_KEY);
    return normalizeLanguage(stored[LANGUAGE_STORAGE_KEY]);
  }

  async function persistPreferredLanguage(storage, language) {
    const normalizedLanguage = normalizeLanguage(language);
    await storage.set({ [LANGUAGE_STORAGE_KEY]: normalizedLanguage });
    return normalizedLanguage;
  }

  function updateLanguageButtonState(buttons, language) {
    const normalizedLanguage = normalizeLanguage(language);
    for (const button of buttons) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.language === normalizedLanguage),
      );
    }
  }

  function updateLocalizedPrompt(textarea, prompt) {
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectionDirection = textarea.selectionDirection;
    const scrollTop = textarea.scrollTop;
    const scrollLeft = textarea.scrollLeft;

    textarea.value = prompt;

    if (
      Number.isInteger(selectionStart) &&
      Number.isInteger(selectionEnd) &&
      typeof textarea.setSelectionRange === "function"
    ) {
      textarea.setSelectionRange(
        Math.min(selectionStart, prompt.length),
        Math.min(selectionEnd, prompt.length),
        selectionDirection || "none",
      );
    }
    textarea.scrollTop = scrollTop;
    textarea.scrollLeft = scrollLeft;
  }

  function createPromptDrafts() {
    return {
      en: translate("en", "customizationPrompt"),
      "zh-CN": translate("zh-CN", "customizationPrompt"),
    };
  }

  function switchPromptDraft(
    drafts,
    currentLanguage,
    nextLanguage,
    currentValue,
  ) {
    const normalizedCurrentLanguage = normalizeLanguage(currentLanguage);
    const normalizedNextLanguage = normalizeLanguage(nextLanguage);
    drafts[normalizedCurrentLanguage] = String(currentValue ?? "");
    if (typeof drafts[normalizedNextLanguage] !== "string") {
      drafts[normalizedNextLanguage] = translate(
        normalizedNextLanguage,
        "customizationPrompt",
      );
    }
    return {
      language: normalizedNextLanguage,
      prompt: drafts[normalizedNextLanguage],
    };
  }

  async function copyPromptValue(clipboard, value) {
    await clipboard.writeText(value);
  }

  function getSafeLocalStorage(root) {
    try {
      return root.localStorage;
    } catch (_error) {
      return null;
    }
  }

  function initialize(root = globalThis) {
    const doc = root.document;
    const settingsApi = root.YTD_SETTINGS;
    if (!doc || !settingsApi) return;

    const storage = createStorageAdapter(
      root.chrome,
      getSafeLocalStorage(root),
    );
    const form = doc.getElementById("settingsForm");
    const aiApiKeyInput = doc.getElementById("aiApiKey");
    const geminiApiKeyInput = doc.getElementById("geminiApiKey");
    const openaiApiKeyInput = doc.getElementById("openaiApiKey");
    const customApiKeyInput = doc.getElementById("customApiKey");
    const customBaseUrlInput = doc.getElementById("customBaseUrl");
    const customModelInput = doc.getElementById("customModel");
    const defaultAiModel = doc.getElementById("defaultAiModel");
    const taskModelSelects = {
      translation: doc.getElementById("translationModel"),
      explanation: doc.getElementById("explanationModel"),
      analysis: doc.getElementById("analysisModel"),
      note: doc.getElementById("noteModel"),
    };
    const supadataApiKeyInput = doc.getElementById("supadataApiKey");
    const customizationPrompt = doc.getElementById("customizationPrompt");
    const copyCustomizationPromptBtn = doc.getElementById(
      "copyCustomizationPromptBtn",
    );
    const copyStatus = doc.getElementById("copyStatus");
    const saveStatus = doc.getElementById("saveStatus");
    const dataStatus = doc.getElementById("dataStatus");
    const targetLanguageOptions = doc.getElementById("targetLanguageOptions");
    const defaultTargetLanguage = doc.getElementById("defaultTargetLanguage");
    const languageButtons = [...doc.querySelectorAll("[data-language]")];
    const statusStates = new Map();
    const promptDrafts = createPromptDrafts();
    let currentLanguage = "en";

    function renderStatus(element) {
      const state = statusStates.get(element);
      element.textContent = state
        ? translate(currentLanguage, state.key, state.params)
        : "";
    }

    function setStatus(element, key, params = {}) {
      if (!element) return;
      statusStates.set(element, { key, params });
      renderStatus(element);
    }

    function clearStatus(element) {
      if (!element) return;
      statusStates.delete(element);
      element.textContent = "";
      element.classList.remove("success", "error", "testing");
    }

    function applyLanguage(language) {
      const nextDraft = switchPromptDraft(
        promptDrafts,
        currentLanguage,
        language,
        customizationPrompt.value,
      );
      currentLanguage = nextDraft.language;
      doc.documentElement.lang = currentLanguage;
      doc.title = translate(currentLanguage, "pageTitle");

      for (const element of doc.querySelectorAll("[data-i18n]")) {
        element.textContent = translate(
          currentLanguage,
          element.dataset.i18n,
        );
      }
      for (const element of doc.querySelectorAll("[data-i18n-html]")) {
        element.innerHTML = translate(
          currentLanguage,
          element.dataset.i18nHtml,
        );
      }
      for (const element of doc.querySelectorAll("[data-i18n-aria-label]")) {
        element.setAttribute(
          "aria-label",
          translate(currentLanguage, element.dataset.i18nAriaLabel),
        );
      }

      updateLocalizedPrompt(
        customizationPrompt,
        nextDraft.prompt,
      );
      updateLanguageButtonState(languageButtons, currentLanguage);
      for (const element of statusStates.keys()) renderStatus(element);
    }

    function renderTargetLanguagePreferences(settings) {
      const selected = new Set(settings.preferredTargetLanguages || ["zh-CN"]);
      targetLanguageOptions.innerHTML = TARGET_LANGUAGES.map(([code, label]) => `
        <label class="target-language-option">
          <input type="checkbox" value="${code}" ${selected.has(code) ? "checked" : ""} />
          <span>${label}</span>
        </label>
      `).join("");

      defaultTargetLanguage.innerHTML = TARGET_LANGUAGES
        .filter(([code]) => selected.has(code))
        .map(([code, label]) => `<option value="${code}">${label}</option>`)
        .join("");
      if (!defaultTargetLanguage.options.length) {
        const option = document.createElement("option");
        option.value = "zh-CN";
        option.textContent = "中文 (简体)";
        defaultTargetLanguage.appendChild(option);
      }
      defaultTargetLanguage.value = selected.has(settings.defaultTargetLanguage)
        ? settings.defaultTargetLanguage
        : defaultTargetLanguage.options[0].value;
    }

    function readTargetLanguagePreferences() {
      const selected = [...targetLanguageOptions.querySelectorAll("input[type=checkbox]:checked")].map((input) => input.value);
      const preferredTargetLanguages = selected.length ? selected : ["zh-CN"];
      const defaultValue = preferredTargetLanguages.includes(defaultTargetLanguage.value)
        ? defaultTargetLanguage.value
        : preferredTargetLanguages[0];
      return { preferredTargetLanguages, defaultTargetLanguage: defaultValue };
    }

    function syncDefaultTargetOptions() {
      const selected = [...targetLanguageOptions.querySelectorAll("input[type=checkbox]:checked")].map((input) => input.value);
      const preferred = selected.length ? selected : ["zh-CN"];
      const previous = defaultTargetLanguage.value;
      defaultTargetLanguage.innerHTML = TARGET_LANGUAGES
        .filter(([code]) => preferred.includes(code))
        .map(([code, label]) => `<option value="${code}">${label}</option>`)
        .join("");
      defaultTargetLanguage.value = preferred.includes(previous) ? previous : preferred[0];
    }

    function renderModelOptions() {
      const profiles = settingsApi.getModelProfiles();
      const enabledProviders = new Set();
      ["deepseek", "gemini", "openai", "custom"].forEach((id) => {
        const input = doc.getElementById(`${id}Enabled`);
        if (input?.checked) enabledProviders.add(id);
      });
      const options = Object.values(profiles)
        .filter((profile) => enabledProviders.has(profile.provider))
        .map((profile) => `<option value="${profile.id}">${profile.label}</option>`)
        .join("");
      [defaultAiModel, ...Object.values(taskModelSelects)].forEach((select) => {
        if (!select) return;
        const previous = select.value;
        select.innerHTML = options;
        if ([...select.options].some((option) => option.value === previous)) select.value = previous;
      });
      const customOption = Object.values(profiles).find((profile) => profile.id === "custom");
      if (customOption && customApiKeyInput?.value && ![...defaultAiModel.options].some((o) => o.value === "custom")) {
        // custom is already included whenever Custom is enabled
      }
    }

    function setProviderFields(settings) {
      const providers = settings.providers || {};
      ["deepseek", "gemini", "openai", "custom"].forEach((id) => {
        const provider = providers[id] || {};
        const enabled = doc.getElementById(`${id}Enabled`);
        if (enabled) enabled.checked = !!provider.enabled;
        const key = doc.getElementById(`${id}ApiKey`);
        if (key) key.value = provider.apiKey || "";
      });
      if (customBaseUrlInput) customBaseUrlInput.value = providers.custom?.baseUrl || "";
      if (customModelInput) customModelInput.value = providers.custom?.model || "";
      renderModelOptions();
      defaultAiModel.value = settings.defaultModel;
      Object.entries(taskModelSelects).forEach(([task, select]) => { if (select) select.value = settings.taskModels?.[task] || settings.defaultModel; });
    }

    function readAiSettings() {
      const providers = {
        deepseek: { enabled: !!doc.getElementById("deepseekEnabled")?.checked, apiKey: aiApiKeyInput.value, baseUrl: "https://api.deepseek.com" },
        gemini: { enabled: !!doc.getElementById("geminiEnabled")?.checked, apiKey: geminiApiKeyInput?.value || "", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai" },
        openai: { enabled: !!doc.getElementById("openaiEnabled")?.checked, apiKey: openaiApiKeyInput?.value || "", baseUrl: "https://api.openai.com/v1" },
        custom: { enabled: !!doc.getElementById("customEnabled")?.checked, apiKey: customApiKeyInput?.value || "", baseUrl: customBaseUrlInput?.value || "", model: customModelInput?.value || "" },
      };
      return {
        providers,
        defaultModel: defaultAiModel.value,
        taskModels: Object.fromEntries(Object.entries(taskModelSelects).map(([task, select]) => [task, select?.value || defaultAiModel.value])),
      };
    }

    async function requestCustomOriginPermission() {
      const custom = readAiSettings().providers.custom;
      if (!custom.enabled || !custom.baseUrl) return true;
      let origin;
      try { origin = new URL(custom.baseUrl).origin; } catch (_error) { throw new Error("Custom Base URL is not a valid URL."); }
      if (!/^https:$/.test(new URL(custom.baseUrl).protocol)) throw new Error("Custom AI Base URL must use HTTPS.");
      if (!root.chrome?.permissions?.request) return true;
      return root.chrome.permissions.request({ origins: [`${origin}/*`] });
    }

    async function testModel(modelId, button, statusElement) {
      if (!button) return;
      const original = button.textContent;
      clearStatus(statusElement);
      button.disabled = true;
      button.textContent = translate(currentLanguage, "testing");
      statusElement?.classList.add("testing");
      try {
        const permissionGranted = await requestCustomOriginPermission();
        if (!permissionGranted) throw new Error("Chrome host permission was not granted.");
        const result = await root.chrome.runtime.sendMessage({ action: "testAiProvider", modelId, draftSettings: settingsApi.normalize(readAiSettings()) });
        if (!result?.success) throw new Error(result?.error || "Unknown error");
        statusElement?.classList.remove("testing");
        statusElement?.classList.add("success");
        setStatus(statusElement, "connectionSuccess", { model: result.model });
      } catch (error) {
        statusElement?.classList.remove("testing");
        statusElement?.classList.add("error");
        setStatus(statusElement, "connectionFailed", { error: error.message });
      } finally {
        button.disabled = false;
        button.textContent = original;
      }
    }

    async function loadSettings() {
      try {
        const stored = await storage.get(settingsApi.STORAGE_KEY);
        const migration = settingsApi.migrateLegacyCustom(
          stored[settingsApi.STORAGE_KEY],
        );
        const settings = migration.settings;

        aiApiKeyInput.value = settings.aiApiKey;
        setProviderFields(settings);
        supadataApiKeyInput.value = settings.supadataApiKey;
        renderTargetLanguagePreferences(settings);
        if (migration.migrated) {
          await storage.set({ [settingsApi.STORAGE_KEY]: settings });
          setStatus(saveStatus, "migrationWarning");
        }
      } catch (_error) {
        setStatus(saveStatus, "settingsLoadFailed");
      }
    }

    async function loadOptions() {
      try {
        applyLanguage(await readPreferredLanguage(storage));
      } catch (_error) {
        applyLanguage("en");
      }
      await loadSettings();
    }

    async function saveSettings(event) {
      event.preventDefault();
      setStatus(saveStatus, "saving");

      const languagePreferences = readTargetLanguagePreferences();
      const aiSettings = readAiSettings();
      const settings = settingsApi.normalize({
        ...aiSettings,
        supadataApiKey: supadataApiKeyInput.value,
        preferredTargetLanguages: languagePreferences.preferredTargetLanguages,
        defaultTargetLanguage: languagePreferences.defaultTargetLanguage,
      });

      if (!settings.supadataApiKey) {
        setStatus(saveStatus, "addSupadataKey");
        return;
      }
      if (!Object.values(settings.providers).some((provider) => provider.enabled && provider.apiKey)) {
        setStatus(saveStatus, "addDeepseekKey");
        return;
      }

      try {
        const granted = await requestCustomOriginPermission();
        if (!granted) throw new Error("Chrome host permission was not granted.");
        await storage.set({ [settingsApi.STORAGE_KEY]: settings });
        setStatus(saveStatus, "saved");
      } catch (_error) {
        setStatus(saveStatus, "saveFailed");
      }
    }

    async function copyCustomizationPrompt() {
      setStatus(copyStatus, "copying");
      try {
        await copyPromptValue(
          root.navigator.clipboard,
          customizationPrompt.value,
        );
        setStatus(copyStatus, "promptCopied");
      } catch (_error) {
        setStatus(copyStatus, "copyFailed");
      }
    }

    async function clearCachedDigests() {
      const all = await storage.get(null);
      const keys = Object.keys(all).filter((key) => key.startsWith("digest_"));
      if (keys.length) await storage.remove(keys);
      setStatus(dataStatus, "clearedDigests", { count: keys.length });
    }

    async function clearNotes() {
      await storage.remove("ytd_notes");
      setStatus(dataStatus, "notesDeleted");
    }

    async function resetAllData() {
      const confirmed = root.confirm(
        translate(currentLanguage, "resetConfirm"),
      );
      if (!confirmed) return;

      await storage.clear();
      await persistPreferredLanguage(storage, currentLanguage);
      await loadSettings();
      setStatus(dataStatus, "allDataDeleted");
    }

    form.addEventListener("submit", saveSettings);
    copyCustomizationPromptBtn.addEventListener(
      "click",
      copyCustomizationPrompt,
    );
    doc
      .getElementById("clearCacheBtn")
      .addEventListener("click", clearCachedDigests);
    doc.getElementById("clearNotesBtn").addEventListener("click", clearNotes);
    doc.getElementById("resetBtn").addEventListener("click", resetAllData);
    for (const button of languageButtons) {
      button.addEventListener("click", async () => {
        const language = button.dataset.language;
        applyLanguage(language);
        await persistPreferredLanguage(storage, language);
      });
    }

    ["deepseekEnabled", "geminiEnabled", "openaiEnabled", "customEnabled"].forEach((id) => {
      doc.getElementById(id)?.addEventListener("change", renderModelOptions);
    });
    doc.querySelectorAll("[data-test-model]").forEach((button) => {
      const statusElement = button.closest(".connection-test-row")?.querySelector(".connection-status");
      button.addEventListener("click", () => testModel(button.dataset.testModel, button, statusElement));
    });

    targetLanguageOptions?.addEventListener("change", (event) => {
      if (event.target?.matches("input[type=checkbox]")) syncDefaultTargetOptions();
    });

    if (doc.readyState === "loading") {
      doc.addEventListener("DOMContentLoaded", loadOptions, { once: true });
    } else {
      void loadOptions();
    }
  }

  return {
    COPY,
    LANGUAGE_STORAGE_KEY,
    copyPromptValue,
    createPromptDrafts,
    createStorageAdapter,
    normalizeLanguage,
    persistPreferredLanguage,
    readPreferredLanguage,
    translate,
    updateLanguageButtonState,
    updateLocalizedPrompt,
    switchPromptDraft,
    TARGET_LANGUAGES,
    initialize,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = YTD_OPTIONS;
}

if (typeof document !== "undefined") {
  YTD_OPTIONS.initialize();
}
