const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const listeners = { addListener() {} };
const plain = (value) => JSON.parse(JSON.stringify(value));

function loadBackgroundHelpers() {
  const sandbox = {
    console,
    URL,
    TextDecoder,
    TextEncoder,
    AbortController,
    fetch: () => Promise.reject(new Error("network disabled in tests")),
    setTimeout: () => 0,
    clearTimeout: () => {},
    importScripts() {},
    chrome: {
      storage: {
        local: {
          setAccessLevel: () => Promise.resolve(),
          get: async () => ({}),
          set: async () => {},
          remove: async () => {},
        },
      },
      action: { onClicked: listeners },
      sidePanel: { setPanelBehavior() {}, setOptions: () => Promise.resolve() },
      runtime: {
        onInstalled: listeners,
        onMessage: listeners,
        openOptionsPage() {},
        getURL: (resourcePath) => `chrome-extension://test/${resourcePath}`,
        sendMessage: () => Promise.resolve({ success: true }),
      },
      tabs: { onUpdated: listeners, onActivated: listeners },
    },
    YTD_SETTINGS: {
      STORAGE_KEY: "ytd_settings",
      normalize: (value) => value,
      chatCompletionsUrl: () => "",
      canonicalYouTubeUrl: (videoId) => videoId,
    },
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(read("background.js"), sandbox);
  return sandbox.__YTD_TRANSLATION_TESTING__;
}

function loadSidepanelHelpers(localStorage) {
  const sandbox = {
    console,
    URL,
    TextDecoder,
    TextEncoder,
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval() {},
    clearInterval() {},
    IntersectionObserver: class {},
    CSS: { escape: (value) => value },
    document: {
      addEventListener() {},
      querySelectorAll: () => [],
      querySelector: () => null,
      getElementById: () => null,
      createElement: () => ({
        set textContent(_text) {},
        get innerHTML() {
          return "";
        },
      }),
    },
    chrome: {
      runtime: { onMessage: listeners, sendMessage: () => Promise.resolve({}) },
      storage: {
        local: {
          get: async (key) => ({ [key]: localStorage[key] }),
          set: async (values) => Object.assign(localStorage, values),
          remove: async (key) => {
            delete localStorage[key];
          },
        },
        session: { get: async () => ({}), set: async () => {} },
      },
      windows: { getCurrent: () => Promise.resolve({ id: 1 }) },
      tabs: { onUpdated: listeners, onActivated: listeners },
    },
    YTD_SETTINGS: {},
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(read("sidepanel.js"), sandbox);
  return sandbox.__YTD_TRANSCRIPT_TESTING__;
}

test("executive summary is rebuilt from an allowlist with bounded lists", () => {
  const { validateAndFixTimestamps } = loadBackgroundHelpers();
  const analysis = validateAndFixTimestamps(
    {
      execSummary: {
        oneLine: "  A fixed wake-up time matters more than hours slept.  ",
        framework: ["Anchor", "", "Light", 4, "Caffeine", "Naps", "Overflow"],
        takeaway: ["Wake at 7:00 daily", "b", "c", "overflow"],
        verdict: "Skim in 6 min; jump to 12:30.",
        injected: "must be dropped",
      },
      chapters: [],
      keyQuotes: [],
      keyMoments: [],
      extraTopLevel: "must be dropped",
    },
    600,
  );

  assert.deepEqual(Object.keys(analysis), [
    "execSummary",
    "chapters",
    "keyQuotes",
    "keyMoments",
  ]);
  assert.deepEqual(plain(analysis.execSummary), {
    oneLine: "A fixed wake-up time matters more than hours slept.",
    framework: ["Anchor", "Light", "Caffeine", "Naps"],
    takeaway: ["Wake at 7:00 daily", "b", "c"],
    verdict: "Skim in 6 min; jump to 12:30.",
  });
});

test("a response without an executive summary yields an empty, hidden-safe shape", () => {
  const { validateAndFixTimestamps } = loadBackgroundHelpers();
  const analysis = validateAndFixTimestamps({ chapters: [], keyQuotes: [] }, 600);
  assert.deepEqual(plain(analysis.execSummary), {
    oneLine: "",
    framework: [],
    takeaway: [],
    verdict: "",
  });
});

test("an analysis cached under an older schema is discarded but the transcript is kept", async () => {
  const localStorage = {
    digest_oldVideo01: {
      analysis: { chapters: [{ title: "Old" }], keyQuotes: [], keyMoments: [] },
      transcript: [{ text: "hello" }],
      transcriptText: "hello",
      timestamp: Date.now(),
    },
  };
  const helpers = loadSidepanelHelpers(localStorage);
  const cached = await helpers.loadFromCache("oldVideo01");
  assert.equal(cached.analysis, null);
  assert.deepEqual(plain(cached.transcript), [{ text: "hello" }]);
});

test("an analysis cached under the current schema is kept", async () => {
  const localStorage = {};
  const helpers = loadSidepanelHelpers(localStorage);
  localStorage.digest_newVideo01 = {
    analysisSchema: helpers.ANALYSIS_SCHEMA_VERSION,
    analysis: {
      execSummary: { oneLine: "claim", framework: [], takeaway: [], verdict: "" },
      chapters: [],
      keyQuotes: [],
      keyMoments: [],
    },
    transcript: [{ text: "hello" }],
    timestamp: Date.now(),
  };
  const cached = await helpers.loadFromCache("newVideo01");
  assert.equal(cached.analysis.execSummary.oneLine, "claim");
});

test("analysis prompt requests every executive summary field", () => {
  const prompt = read("prompts/analysis.md");
  const fields = ["execSummary", "oneLine", "framework", "takeaway", "verdict"];
  for (const field of fields) {
    assert.match(prompt, new RegExp(`"${field}"`));
  }
});
