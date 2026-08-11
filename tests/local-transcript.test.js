const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function loadBackgroundHelpers({
  settings = {
    provider: "deepseek",
    aiApiKey: "",
    aiBaseUrl: "https://api.deepseek.com",
    aiModel: "deepseek-v4-flash",
    supadataApiKey: "",
  },
  fetchImpl = async () => {
    throw new Error("unexpected fetch");
  },
  executeScriptImpl = async () => [{ result: null }],
} = {}) {
  const listeners = { addListener() {} };
  const sandbox = {
    console,
    URL,
    TextDecoder,
    TextEncoder,
    fetch: fetchImpl,
    AbortController,
    setTimeout,
    clearTimeout,
    importScripts() {},
    chrome: {
      storage: {
        local: {
          setAccessLevel: () => Promise.resolve(),
          get: async () => ({ ytd_settings: settings }),
        },
      },
      action: { onClicked: listeners },
      sidePanel: {
        setPanelBehavior() {},
        setOptions: () => Promise.resolve(),
      },
      runtime: {
        onInstalled: listeners,
        onMessage: listeners,
        openOptionsPage() {},
        getURL: (resourcePath) => `chrome-extension://test/${resourcePath}`,
      },
      tabs: { onUpdated: listeners, onActivated: listeners },
      scripting: { executeScript: executeScriptImpl },
    },
    YTD_SETTINGS: {
      STORAGE_KEY: "ytd_settings",
      normalize: (value) => value,
      chatCompletionsUrl: (baseUrl) => `${baseUrl}/chat/completions`,
      canonicalYouTubeUrl: (videoId) =>
        `https://www.youtube.com/watch?v=${videoId}`,
    },
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(read("background.js"), sandbox);
  return sandbox.__YTD_TRANSLATION_TESTING__;
}

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body };
}

const BASE_SETTINGS = {
  provider: "deepseek",
  aiApiKey: "",
  aiBaseUrl: "https://api.deepseek.com",
  aiModel: "deepseek-v4-flash",
};

const TIMEDTEXT_EVENTS = {
  events: [
    {
      tStartMs: 0,
      dDurationMs: 5000,
      segs: [{ utf8: "Hello " }, { utf8: "world" }],
    },
    { tStartMs: 5000, dDurationMs: 4000, segs: [{ utf8: "Second line" }] },
  ],
};

// ============================================================
// buildTranscriptResult
// ============================================================

test("buildTranscriptResult converts chunks into the shared transcript format", () => {
  const helpers = loadBackgroundHelpers();
  const result = helpers.buildTranscriptResult(
    [
      { text: "First >> line", offset: 1200, duration: 3000, lang: "en" },
      { text: "Second line", offset: 4200, duration: 2000 },
    ],
    "en",
  );

  assert.equal(result.success, true);
  assert.equal(result.transcript.length, 2);
  assert.equal(result.transcript[0].text, "First line");
  assert.equal(result.transcript[0].start, 1);
  assert.equal(result.transcript[0].duration, 3);
  assert.equal(result.transcript[0].language, "en");
  assert.equal(result.transcript[1].language, "en");
  assert.equal(result.transcriptText, "First line Second line");
  assert.equal(
    result.transcriptTextTimestamped,
    "[0:01] First line\n[0:04] Second line",
  );
  assert.equal(result.language, "en");
});

test("buildTranscriptResult returns null when no usable text remains", () => {
  const helpers = loadBackgroundHelpers();
  assert.equal(helpers.buildTranscriptResult([], "en"), null);
  assert.equal(
    helpers.buildTranscriptResult([{ text: ">>", offset: 0 }], "en"),
    null,
  );
});

test("local and Supadata chunks produce identical shared output", () => {
  const helpers = loadBackgroundHelpers();
  const supadataResult = helpers.buildTranscriptResult(
    [{ text: "Hello world", offset: 0, duration: 5000, lang: "en" }],
    "en",
  );
  const localResult = helpers.buildTranscriptResult(
    [{ text: "Hello world", offset: 0, duration: 5000, lang: "en" }],
    "en",
  );
  assert.deepEqual(localResult, supadataResult);
});

// ============================================================
// parseTimedtextJson3
// ============================================================

test("parseTimedtextJson3 joins segments and normalizes line breaks", () => {
  const helpers = loadBackgroundHelpers();
  const chunks = helpers.parseTimedtextJson3(
    {
      events: [
        { tStartMs: 0, dDurationMs: 5000, segs: [{ utf8: "A " }, { utf8: "B" }] },
        { tStartMs: 5000, dDurationMs: 0, segs: [{ utf8: "Multi\nline" }] },
        { tStartMs: 9000, segs: [{ utf8: "No duration" }] },
        { tStartMs: 10000 },
        { segs: [{ utf8: "  " }] },
      ],
    },
    "en",
  );

  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].text, "A B");
  assert.equal(chunks[0].offset, 0);
  assert.equal(chunks[0].duration, 5000);
  assert.equal(chunks[0].lang, "en");
  assert.equal(chunks[1].text, "Multi line");
  assert.equal(chunks[2].offset, 9000);
  assert.equal(chunks[2].duration, 0);
});

test("parseTimedtextJson3 tolerates missing events", () => {
  const helpers = loadBackgroundHelpers();
  // Cross-realm arrays from the vm sandbox are not host-realm arrays, so
  // compare lengths instead of deep equality.
  assert.equal(helpers.parseTimedtextJson3({}, "en").length, 0);
  assert.equal(helpers.parseTimedtextJson3(null, "en").length, 0);
});

// ============================================================
// pickCaptionTrack
// ============================================================

test("pickCaptionTrack prefers exact English, then English variants", () => {
  const helpers = loadBackgroundHelpers();
  const tracks = [
    { baseUrl: "https://www.youtube.com/api/timedtext?lang=fr", languageCode: "fr" },
    {
      baseUrl: "https://www.youtube.com/api/timedtext?lang=en-US",
      languageCode: "en-US",
    },
    { baseUrl: "https://www.youtube.com/api/timedtext?lang=en", languageCode: "en" },
  ];

  assert.equal(helpers.pickCaptionTrack(tracks).languageCode, "en");
  assert.equal(
    helpers.pickCaptionTrack(tracks.filter((t) => t.languageCode !== "en"))
      .languageCode,
    "en-US",
  );
  assert.equal(
    helpers.pickCaptionTrack([
      { baseUrl: "https://www.youtube.com/api/timedtext?lang=ja", languageCode: "ja" },
    ]).languageCode,
    "ja",
  );
  assert.equal(helpers.pickCaptionTrack([]), null);
  assert.equal(helpers.pickCaptionTrack(null), null);
});

// ============================================================
// handleFetchTranscriptLocalFirst orchestration
// ============================================================

test("local extraction short-circuits before any Supadata call", async () => {
  let supadataCalled = false;
  const helpers = loadBackgroundHelpers({
    settings: { ...BASE_SETTINGS, supadataApiKey: "supadata-key" },
    executeScriptImpl: async () => [
      {
        result: [
          {
            baseUrl: "https://www.youtube.com/api/timedtext?lang=en&v=abc123",
            languageCode: "en",
          },
        ],
      },
    ],
    fetchImpl: async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("timedtext")) {
        return jsonResponse(TIMEDTEXT_EVENTS);
      }
      if (urlStr.includes("api.supadata.ai")) {
        supadataCalled = true;
        return jsonResponse({
          content: [{ text: "Supadata line", offset: 3000, duration: 2000 }],
          lang: "en",
        });
      }
      throw new Error(`unexpected fetch: ${urlStr}`);
    },
  });

  const result = await helpers.handleFetchTranscriptLocalFirst("abc123", 42);

  assert.equal(result.success, true);
  assert.equal(result.source, "local");
  assert.equal(supadataCalled, false);
  assert.equal(result.transcript.length, 2);
  assert.equal(result.transcript[0].text, "Hello world");
  assert.equal(result.transcript[0].start, 0);
  assert.equal(result.transcript[1].start, 5);
  assert.equal(result.transcriptText, "Hello world Second line");
  assert.equal(
    result.transcriptTextTimestamped,
    "[0:00] Hello world\n[0:05] Second line",
  );
});

test("local failure falls back to Supadata", async () => {
  let scriptCalls = 0;
  let supadataCalled = false;
  const helpers = loadBackgroundHelpers({
    settings: { ...BASE_SETTINGS, supadataApiKey: "supadata-key" },
    executeScriptImpl: async () => {
      scriptCalls++;
      return [{ result: null }];
    },
    fetchImpl: async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("api.supadata.ai")) {
        supadataCalled = true;
        return jsonResponse({
          content: [{ text: "Supadata >> line", offset: 3000, duration: 2000, lang: "en" }],
          lang: "en",
        });
      }
      throw new Error(`unexpected fetch: ${urlStr}`);
    },
  });

  const result = await helpers.handleFetchTranscriptLocalFirst("abc123", 42);

  assert.equal(result.success, true);
  assert.equal(result.source, "supadata");
  assert.equal(scriptCalls, 1);
  assert.equal(supadataCalled, true);
  assert.equal(result.transcript[0].text, "Supadata line");
  assert.equal(result.transcript[0].start, 3);
});

test("timedtext failure falls back to Supadata", async () => {
  let supadataCalled = false;
  const helpers = loadBackgroundHelpers({
    settings: { ...BASE_SETTINGS, supadataApiKey: "supadata-key" },
    executeScriptImpl: async () => [
      {
        result: [
          {
            baseUrl: "https://www.youtube.com/api/timedtext?lang=en&v=abc123",
            languageCode: "en",
          },
        ],
      },
    ],
    fetchImpl: async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("timedtext")) {
        return jsonResponse({ error: "nope" }, { ok: false, status: 403 });
      }
      if (urlStr.includes("api.supadata.ai")) {
        supadataCalled = true;
        return jsonResponse({
          content: [{ text: "Fallback line", offset: 0, duration: 1000 }],
          lang: "en",
        });
      }
      throw new Error(`unexpected fetch: ${urlStr}`);
    },
  });

  const result = await helpers.handleFetchTranscriptLocalFirst("abc123", 42);

  assert.equal(result.success, true);
  assert.equal(result.source, "supadata");
  assert.equal(supadataCalled, true);
});

test("no tabId skips local extraction entirely", async () => {
  let scriptCalls = 0;
  const helpers = loadBackgroundHelpers({
    settings: { ...BASE_SETTINGS, supadataApiKey: "supadata-key" },
    executeScriptImpl: async () => {
      scriptCalls++;
      return [{ result: null }];
    },
    fetchImpl: async (url) => {
      if (String(url).includes("api.supadata.ai")) {
        return jsonResponse({
          content: [{ text: "Fallback line", offset: 0, duration: 1000 }],
          lang: "en",
        });
      }
      throw new Error(`unexpected fetch: ${String(url)}`);
    },
  });

  const result = await helpers.handleFetchTranscriptLocalFirst("abc123", null);

  assert.equal(result.success, true);
  assert.equal(result.source, "supadata");
  assert.equal(scriptCalls, 0);
});

test("combined error when local extraction fails and no Supadata key exists", async () => {
  const helpers = loadBackgroundHelpers({
    settings: { ...BASE_SETTINGS, supadataApiKey: "" },
    executeScriptImpl: async () => [{ result: null }],
  });

  const result = await helpers.handleFetchTranscriptLocalFirst("abc123", 42);

  assert.equal(result.success, false);
  assert.equal(result.error, "NO_TRANSCRIPT");
  assert.match(result.message, /Supadata API key/);
});

test("missing Supadata key without a tabId keeps the original error", async () => {
  const helpers = loadBackgroundHelpers({
    settings: { ...BASE_SETTINGS, supadataApiKey: "" },
  });

  const result = await helpers.handleFetchTranscriptLocalFirst("abc123", null);

  assert.equal(result.success, false);
  assert.equal(result.error, "NO_SUPADATA_KEY");
});
