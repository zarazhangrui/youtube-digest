const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function loadSidepanelHelpers({
  sendMessage = () => Promise.resolve({}),
  setTimeoutImpl = () => 0,
  clearTimeoutImpl = () => {},
  storedValues = {},
  documentImpl = null,
} = {}) {
  const listeners = { addListener() {} };
  const storage = { ...storedValues };
  const sandbox = {
    console,
    URL,
    TextDecoder,
    TextEncoder,
    setTimeout: setTimeoutImpl,
    clearTimeout: clearTimeoutImpl,
    setInterval() {},
    clearInterval() {},
    IntersectionObserver: class {},
    CSS: { escape: (value) => value },
    window: { getSelection: () => null, close() {} },
    document: documentImpl || {
      addEventListener() {},
      querySelectorAll: () => [],
      querySelector: () => null,
      getElementById: () => null,
      createElement: () => {
        let value = "";
        return {
          set textContent(text) {
            value = String(text);
          },
          get innerHTML() {
            return value
              .replaceAll("&", "&amp;")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")
              .replaceAll('"', "&quot;");
          },
        };
      },
    },
    chrome: {
      storage: {
        local: {
          get: async (key) => {
            if (typeof key === "string") return { [key]: storage[key] };
            return { ...storage };
          },
          set: async (items) => Object.assign(storage, items),
        },
      },
      runtime: { onMessage: listeners, sendMessage },
      windows: { getCurrent: () => Promise.resolve({ id: 1 }) },
      tabs: { onUpdated: listeners, onActivated: listeners },
    },
    YTD_SETTINGS: {},
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(read("sidepanel.js"), sandbox);
  return { ...sandbox.__YTD_TRANSCRIPT_TESTING__, storage };
}

function loadBackgroundHelpers({
  settings = {
    provider: "deepseek",
    aiApiKey: "test-key",
    aiBaseUrl: "https://api.deepseek.com",
    aiModel: "deepseek-v4-flash",
  },
  fetchImpl = fetch,
  setTimeoutImpl = () => 0,
  clearTimeoutImpl = () => {},
} = {}) {
  const listeners = { addListener() {} };
  const sandbox = {
    console,
    URL,
    TextDecoder,
    TextEncoder,
    fetch: fetchImpl,
    AbortController,
    setTimeout: setTimeoutImpl,
    clearTimeout: clearTimeoutImpl,
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
    },
    YTD_SETTINGS: {
      STORAGE_KEY: "ytd_settings",
      normalize: (value) => value,
      chatCompletionsUrl: (baseUrl) => `${baseUrl}/chat/completions`,
    },
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(read("background.js"), sandbox);
  return sandbox.__YTD_TRANSLATION_TESTING__;
}

function createFakeTimers() {
  let nextId = 1;
  const timers = new Map();
  return {
    setTimeout(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, delay, active: true });
      return id;
    },
    clearTimeout(id) {
      const timer = timers.get(id);
      if (timer) timer.active = false;
    },
    fireActive(delay) {
      const match = [...timers.entries()].find(
        ([, timer]) => timer.active && timer.delay === delay,
      );
      assert.ok(match, `Expected an active ${delay}ms timer`);
      match[1].active = false;
      match[1].callback();
    },
    activeCount(delay) {
      return [...timers.values()].filter(
        (timer) => timer.active && timer.delay === delay,
      ).length;
    },
    createdCount(delay) {
      return [...timers.values()].filter((timer) => timer.delay === delay).length;
    },
  };
}

function streamingResponse(chunks, { ok = true, status = 200 } = {}) {
  let index = 0;
  return {
    ok,
    status,
    body: {
      getReader() {
        return {
          async read() {
            if (index >= chunks.length) return { done: true };
            return { done: false, value: chunks[index++] };
          },
          async cancel() {},
        };
      },
    },
  };
}

const encode = (value) => new TextEncoder().encode(value);
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

test("Transcript header exposes and wires Original, Chinese, and bilingual modes", () => {
  const html = read("sidepanel.html");
  const js = read("sidepanel.js");
  assert.match(html, /data-transcript-mode="original"[\s\S]*?>Original</);
  assert.match(html, /data-transcript-mode="zh"[\s\S]*?>\u4e2d\u6587</);
  assert.match(html, /data-transcript-mode="bilingual"[\s\S]*?>\u53cc\u8bed</);
  assert.match(js, /handleTranscriptModeChange\(button\.dataset\.transcriptMode\)/);
  assert.match(js, /contentType: "transcriptBatch"/);
  assert.doesNotMatch(js, /English \+ Chinese/);
  assert.match(js, /Original \(\$\{language\}\)/);
});

test("transcript display mode is restored as a persistent preference", () => {
  const {
    normalizeTranscriptMode,
    TRANSCRIPT_MODE_STORAGE_KEY,
    persistTranscriptMode,
    restoreTranscriptMode,
    storage,
  } =
    loadSidepanelHelpers();
  const js = read("sidepanel.js");

  assert.equal(TRANSCRIPT_MODE_STORAGE_KEY, "ytd_transcript_mode");
  assert.equal(normalizeTranscriptMode("bilingual"), "bilingual");
  assert.equal(normalizeTranscriptMode("zh"), "zh");
  assert.equal(normalizeTranscriptMode("unsupported"), "original");
  return persistTranscriptMode("bilingual").then(async () => {
    assert.equal(storage.ytd_transcript_mode, "bilingual");
    assert.equal(await restoreTranscriptMode(), "bilingual");
  });
});

test("transcript mode loads before the panel starts loading a video", () => {
  const js = read("sidepanel.js");
  assert.match(
    js,
    /await restoreTranscriptMode\(\);[\s\S]*?await evictOldCacheEntries/,
    "the preference must load before the panel starts loading a video",
  );
  assert.match(
    js,
    /currentTranscriptMode = mode;[\s\S]*?await persistTranscriptMode\(mode\);/,
    "a mode change must be saved before later navigation can recreate the panel",
  );
});

test("transcript scroll state is restored per video and display mode", async () => {
  let contentScrollTop = 0;
  const followButton = { style: { display: "none" } };
  const timers = createFakeTimers();
  const sidepanel = loadSidepanelHelpers({
    storedValues: {
      ytd_transcript_mode: "bilingual",
      ytd_transcript_view_state: {
        "abc123:bilingual": {
          scrollTop: 480,
          autoScrollEnabled: false,
          updatedAt: 1,
        },
      },
    },
    setTimeoutImpl: timers.setTimeout,
    clearTimeoutImpl: timers.clearTimeout,
    documentImpl: {
      addEventListener() {},
      querySelectorAll: () => [],
      querySelector: () => null,
      getElementById: (id) => {
        if (id === "contentArea") {
          return {
            get scrollTop() {
              return contentScrollTop;
            },
            set scrollTop(value) {
              contentScrollTop = value;
            },
          };
        }
        if (id === "followPlaybackBtn") return followButton;
        return null;
      },
      createElement: () => ({ textContent: "", innerHTML: "" }),
    },
  });

  await sidepanel.restoreTranscriptMode();
  sidepanel.__setCurrentVideoForTesting("abc123");
  await sidepanel.restoreTranscriptViewStateAfterRender();

  assert.equal(contentScrollTop, 480);
  assert.equal(followButton.style.display, "block");
  assert.equal(sidepanel.getTranscriptScrollGuardState().programmatic, true);
  timers.fireActive(50);
  assert.equal(sidepanel.getTranscriptScrollGuardState().programmatic, false);
});

test("saved scroll position does not override active Follow playback", async () => {
  let contentScrollTop = 0;
  const followButton = { style: { display: "none" } };
  const sidepanel = loadSidepanelHelpers({
    storedValues: {
      ytd_transcript_mode: "bilingual",
      ytd_transcript_view_state: {
        "abc123:bilingual": {
          scrollTop: 480,
          autoScrollEnabled: true,
          updatedAt: 1,
        },
      },
    },
    documentImpl: {
      addEventListener() {},
      querySelectorAll: () => [],
      querySelector: () => null,
      getElementById: (id) => {
        if (id === "contentArea") {
          return {
            get scrollTop() {
              return contentScrollTop;
            },
            set scrollTop(value) {
              contentScrollTop = value;
            },
          };
        }
        if (id === "followPlaybackBtn") return followButton;
        return null;
      },
      createElement: () => ({ textContent: "", innerHTML: "" }),
    },
  });

  await sidepanel.restoreTranscriptMode();
  sidepanel.__setCurrentVideoForTesting("abc123");
  await sidepanel.restoreTranscriptViewStateAfterRender();

  assert.equal(contentScrollTop, 0);
  assert.equal(followButton.style.display, "none");
  assert.equal(sidepanel.getTranscriptScrollGuardState().programmatic, false);
});

test("same-video tab activation does not rebuild transcript from cache", () => {
  const js = read("sidepanel.js");

  assert.match(
    js,
    /if \(videoId === currentVideoId && currentTranscript\) \{[\s\S]*?return;[\s\S]*?\}/,
    "returning to an already-loaded video should keep the current transcript DOM",
  );
  assert.match(
    js,
    /startPlaybackTracking\(\{ preserveFollowState: true \}\)/,
    "same-video activation must preserve the user's Follow playback choice",
  );
  assert.match(
    js,
    /function handleFrontTab\(tab\)[\s\S]*?youtubeTabId = tab\.id;[\s\S]*?playbackTrackingTick\(true\);/,
    "same-video tab switches must re-bind and re-sync Follow playback without rebuilding",
  );
});

test("saved video title and author fill in when page metadata is unavailable", () => {
  const { chooseVideoMetadata } = loadSidepanelHelpers();

  assert.equal(
    chooseVideoMetadata("", "Cached video title"),
    "Cached video title",
  );
  assert.equal(
    chooseVideoMetadata(null, "Cached channel"),
    "Cached channel",
  );
  assert.equal(
    chooseVideoMetadata("Live video title", "Older cached title"),
    "Live video title",
  );
});

test("playback tracking keeps a relay fallback when a direct tab is unavailable", async () => {
  const { getPlaybackState } = loadSidepanelHelpers({
    sendMessage: () =>
      Promise.resolve({ success: true, response: { currentTime: 42 } }),
  });
  const js = read("sidepanel.js");

  assert.deepEqual(await getPlaybackState(), { currentTime: 42 });
  assert.match(
    js,
    /chrome\.runtime\.sendMessage\(\{[\s\S]*?action: "relayToContent",[\s\S]*?tabId: youtubeTabId,[\s\S]*?payload,/,
    "the relay fallback must keep targeting the selected YouTube tab",
  );
  assert.match(
    read("background.js"),
    /const targetTabId = Number\.isInteger\(message\.tabId\)[\s\S]*?chrome\.tabs\.get\(targetTabId\)[\s\S]*?tabs = targetTab\s*\? \[targetTab\]/,
    "the selected YouTube tab must be preferred over a newly queried tab",
  );
});

test("transcript entry lookup keeps fractional timestamps precise", () => {
  const { findTranscriptEntryForTime } = loadSidepanelHelpers();
  const entries = [
    { dataset: { seconds: "10.25" } },
    { dataset: { seconds: "12.75" } },
    { dataset: { seconds: "15.5" } },
  ];

  assert.equal(findTranscriptEntryForTime(entries, 12.6), entries[0]);
  assert.equal(findTranscriptEntryForTime(entries, 12.75), entries[1]);
  assert.equal(findTranscriptEntryForTime(entries, 15.7), entries[2]);
});

test("Follow playback refreshes the current player position before scrolling", () => {
  const js = read("sidepanel.js");

  assert.match(
    js,
    /const didScroll = await playbackTrackingTick\(true\);[\s\S]*?if \(!didScroll\) scrollToActiveEntry\(\);/,
    "the button must fall back to the existing highlight instead of looking dead",
  );
  assert.match(
    js,
    /async function playbackTrackingTick\(forceScroll = false\)[\s\S]*?return highlightActiveEntry\(currentTime, forceScroll\);/,
  );
  assert.match(
    js,
    /if \(forceScroll && autoScrollEnabled\) \{[\s\S]*?scrollTranscriptEntryIntoView\(activeEntry\);[\s\S]*?return true;/,
  );
  assert.match(
    js,
    /contentArea\.addEventListener\("scrollend", onContentAreaScrollEnd\)/,
    "programmatic smooth scrolling must remain marked until it actually ends",
  );
  assert.match(
    js,
    /function onContentAreaScroll\(\) \{\s*if \(programmaticTranscriptScroll\) return;/,
    "the extension's own scrolling must not turn Follow playback off",
  );
  assert.match(
    js,
    /function onManualTranscriptNavigation\(\)[\s\S]*?finishProgrammaticTranscriptScroll\(\);[\s\S]*?disableAutoScrollForManualNavigation\(\);/,
    "real wheel and touch input must still pause following immediately",
  );
  assert.doesNotMatch(
    js,
    /lastAutoScrollTime/,
    "a fixed time window cannot reliably classify a long smooth scroll",
  );
  assert.match(
    js,
    /autoScrollInterval = setInterval\(\(\) => playbackTrackingTick\(\), 500\);[\s\S]*?playbackTrackingTick\(true\);/,
    "initial follow must force a jump to the current playback position",
  );
});

test("programmatic transcript scrolling cannot be mistaken for manual scrolling", () => {
  const {
    beginProgrammaticTranscriptScroll,
    finishProgrammaticTranscriptScroll,
    getTranscriptScrollGuardState,
    onManualTranscriptNavigation,
  } = loadSidepanelHelpers();

  beginProgrammaticTranscriptScroll();
  assert.equal(getTranscriptScrollGuardState().programmatic, true);

  finishProgrammaticTranscriptScroll();
  assert.equal(getTranscriptScrollGuardState().programmatic, false);

  beginProgrammaticTranscriptScroll();
  onManualTranscriptNavigation();
  assert.equal(
    getTranscriptScrollGuardState().programmatic,
    false,
    "real user input must interrupt a smooth programmatic scroll",
  );
});

test("semantic segmentation rebuilds sentences across caption boundaries", () => {
  const { groupTranscriptEntries } = loadSidepanelHelpers();
  const segments = groupTranscriptEntries(
    [
      { start: 0, text: "Caption boundaries should" },
      { start: 2, text: "not break a complete sentence." },
      { start: 5, text: "The next thought also" },
      { start: 7, text: "stays together!" },
    ],
    { minChars: 1, idealChars: 100, maxChars: 320, maxSeconds: 20 },
  );
  assert.equal(segments.length, 2);
  assert.equal(
    segments[0].text,
    "Caption boundaries should not break a complete sentence.",
  );
  assert.equal(segments[0].start, 0);
  assert.equal(segments[1].text, "The next thought also stays together!");
  assert.equal(segments[1].start, 5);
});

test("a huge raw Supadata entry is split into seekable bounded segments", () => {
  const { groupTranscriptEntries } = loadSidepanelHelpers();
  const text = Array.from({ length: 900 }, (_, index) => `word${index}`).join(" ");
  const segments = groupTranscriptEntries([
    { start: 12, duration: 90, text },
  ]);
  assert.ok(segments.length > 8);
  assert.ok(segments.every((segment) => segment.text.length <= 384));
  assert.equal(segments[0].start, 12);
  assert.ok(segments.at(-1).start > segments[0].start);
  assert.ok(segments.every((segment) => /^segment-\d+-\d+$/.test(segment.id)));
});

test("Chinese sentence and clause punctuation creates semantic guardrails", () => {
  const { groupTranscriptEntries } = loadSidepanelHelpers();
  const segments = groupTranscriptEntries(
    [
      { start: 0, text: "这是一个被字幕切开的" },
      { start: 2, text: "完整句子。这是第二个想法，" },
      { start: 5, text: "也应该保持语义完整！" },
    ],
    { minChars: 1, idealChars: 100, maxChars: 320, maxSeconds: 20 },
  );
  assert.equal(segments.length, 2);
  assert.equal(segments[0].text, "这是一个被字幕切开的完整句子。");
  assert.equal(segments[1].text, "这是第二个想法，也应该保持语义完整！");
});

test("structured translation batches align by stable ID and expose missing fallback", () => {
  const sidepanel = loadSidepanelHelpers();
  const background = loadBackgroundHelpers();
  const source = [
    { id: "segment-0-0", text: "A complete first sentence." },
    { id: "segment-1-5000", text: "A complete second sentence." },
  ];
  assert.deepEqual(
    JSON.parse(JSON.stringify(background.validateTranscriptBatchRequest({ segments: source }))),
    source,
  );

  const normalized = background.normalizeTranslatedSegmentBatch(
    {
      segments: [
        { id: "unknown", text: "\u5ffd\u7565" },
        { id: "segment-1-5000", text: "\u7b2c\u4e8c\u4e2a\u5b8c\u6574\u53e5\u5b50\u3002" },
      ],
    },
    source,
  );
  const aligned = sidepanel.alignTranslatedSegmentBatch(
    source,
    normalized.segments,
  );
  assert.equal(aligned[0].id, source[0].id);
  assert.equal(aligned[0].text, "");
  assert.match(aligned[0].error, /unavailable/i);
  assert.equal(aligned[1].text, "\u7b2c\u4e8c\u4e2a\u5b8c\u6574\u53e5\u5b50\u3002");
});

test("transcript translation queues every missing row after the first viewport", () => {
  const js = read("sidepanel.js");

  assert.match(
    js,
    /const indices = queue\.splice\(0, 4\);/,
    "batch size should use the full provider-supported transcript window",
  );
  assert.match(
    js,
    /if \(index < 4\) enqueue\(index\);/,
    "the first visible rows should still translate immediately",
  );
  assert.match(
    js,
    /setTimeout\(\(\) => \{[\s\S]*?rows\.forEach\(\(row, index\) => \{[\s\S]*?!row\.classList\.contains\("translated"\)[\s\S]*?enqueue\(index\);/,
    "remaining untranslated rows must be queued even if the user never scrolls to them",
  );
});

test("translated-only omits English while bilingual renders aligned English and Chinese", () => {
  const { renderTranscriptSegmentContent } = loadSidepanelHelpers();
  const segment = { id: "segment-0-0", text: "Original English sentence." };
  const translatedOnly = renderTranscriptSegmentContent(
    segment,
    "zh",
    "\u4e2d\u6587\u8bd1\u6587\u3002",
    "",
  );
  const bilingual = renderTranscriptSegmentContent(
    segment,
    "bilingual",
    "\u4e2d\u6587\u8bd1\u6587\u3002",
    "",
  );
  assert.doesNotMatch(translatedOnly, /Original English sentence/);
  assert.match(translatedOnly, /\u4e2d\u6587\u8bd1\u6587/);
  assert.match(bilingual, /transcript-original/);
  assert.match(bilingual, /Original English sentence/);
  assert.match(bilingual, /\u4e2d\u6587\u8bd1\u6587/);
});

test("subtitle formatting tags render in original and translated segment text", () => {
  const { renderTranscriptSegmentContent } = loadSidepanelHelpers();
  const html = renderTranscriptSegmentContent(
    {
      id: "segment-0-0",
      text: "Think <i>deeply</i>, <b>carefully</b>, and <u>clearly</u>.<br>Next line.",
    },
    "bilingual",
    "\u5b57\u5730<i>\u601d\u8003</i>\u7684\u3002<strong>\u91cd\u70b9</strong>",
    "",
  );

  assert.match(html, /Think <i>deeply<\/i>/);
  assert.match(html, /<b>carefully<\/b>/);
  assert.match(html, /<u>clearly<\/u>\.<br>Next line/);
  assert.match(html, /\u5b57\u5730<i>\u601d\u8003<\/i>\u7684\u3002<strong>\u91cd\u70b9<\/strong>/);
});

test("subtitle markup renderer keeps attributed and arbitrary HTML escaped", () => {
  const { renderSubtitleInlineMarkup } = loadSidepanelHelpers();
  const html = renderSubtitleInlineMarkup(
    '<img src=x onerror="alert(1)"><i onclick="alert(2)">unsafe</i><script>alert(3)</script>',
  );

  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html, /&lt;i onclick=&quot;alert\(2\)&quot;&gt;unsafe<\/i>/);
  assert.match(html, /&lt;script&gt;alert\(3\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<img\b|<i\s+onclick|<script\b/);
});

test("background rejects unsupported language fallthrough and malformed batches", () => {
  const source = read("background.js");
  const { validateTranscriptBatchRequest } = loadBackgroundHelpers();
  assert.match(source, /targetLanguage !== "zh"/);
  assert.throws(
    () => validateTranscriptBatchRequest({ segments: [] }),
    /1 to 4 segments/,
  );
  assert.throws(
    () =>
      validateTranscriptBatchRequest({
        segments: [
          { id: "duplicate", text: "first" },
          { id: "duplicate", text: "second" },
        ],
      }),
    /unique and stable/,
  );
});

test("all AI product requests use DeepSeek non-thinking and JSON behavior", async () => {
  const deepSeekRequests = [];
  const successfulFetch = (requests) => async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "translated" } }],
      }),
    };
  };

  const deepSeek = loadBackgroundHelpers({
    fetchImpl: successfulFetch(deepSeekRequests),
  });
  const deepSeekResult = await deepSeek.requestAiCompletion({
    maxTokens: 128,
    responseFormat: { type: "json_object" },
    messages: [{ role: "user", content: "Hello." }],
  });
  assert.equal(deepSeekResult.text, "translated");
  assert.deepEqual(deepSeekRequests[0].thinking, { type: "disabled" });
  assert.deepEqual(deepSeekRequests[0].response_format, {
    type: "json_object",
  });

  const backgroundSource = read("background.js");
  assert.equal(
    (backgroundSource.match(/await requestAiCompletion\(\{/g) || []).length,
    4,
  );
  assert.doesNotMatch(backgroundSource, /disableThinking/);
  for (const callPath of [
    "handleAnalyzeTranscript",
    "cleanupNoteText",
    "handleExplainSelection",
    "callAiTranslation",
  ]) {
    assert.match(
      backgroundSource,
      new RegExp(`async function ${callPath}\\([\\s\\S]*?requestAiCompletion\\(\\{`),
    );
  }
});

test("blank-line chunks reset provider idle timeout and valid JSON succeeds", async () => {
  const timers = createFakeTimers();
  const helpers = loadBackgroundHelpers({
    setTimeoutImpl: timers.setTimeout,
    clearTimeoutImpl: timers.clearTimeout,
    fetchImpl: async () =>
      streamingResponse([
        encode("\n"),
        encode("\n"),
        encode('{"choices":[{"message":{"content":"translated"}}]}'),
      ]),
  });

  const result = await helpers.callAiTranslation("Translate.", "Hello.");
  assert.equal(result.success, true);
  assert.equal(result.text, "translated");
  assert.equal(timers.createdCount(50_000), 5);
  assert.equal(timers.activeCount(50_000), 0);
  assert.equal(timers.activeCount(120_000), 0);
});

test("provider idle silence aborts with a distinct Retry-able error", async () => {
  const timers = createFakeTimers();
  const helpers = loadBackgroundHelpers({
    setTimeoutImpl: timers.setTimeout,
    clearTimeoutImpl: timers.clearTimeout,
    fetchImpl: async (_url, { signal }) => ({
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: () =>
            new Promise((_resolve, reject) => {
              signal.addEventListener("abort", () => {
                const error = new Error("aborted");
                error.name = "AbortError";
                reject(error);
              });
            }),
        }),
      },
    }),
  });

  const request = helpers.callAiTranslation("Translate.", "Hello.");
  await nextTurn();
  timers.fireActive(50_000);
  const result = await request;
  assert.equal(result.success, false);
  assert.equal(result.code, "AI_IDLE_TIMEOUT");
  assert.match(result.error, /inactive for 50 seconds.*Retry/i);
  assert.equal(timers.activeCount(120_000), 0);
});

test("blank-line keepalives cannot evade the provider hard cap", async () => {
  const timers = createFakeTimers();
  let releaseRead;
  let signal;
  const helpers = loadBackgroundHelpers({
    setTimeoutImpl: timers.setTimeout,
    clearTimeoutImpl: timers.clearTimeout,
    fetchImpl: async (_url, options) => {
      signal = options.signal;
      return {
        ok: true,
        status: 200,
        body: {
          getReader: () => ({
            read: () =>
              new Promise((resolve, reject) => {
                releaseRead = () => resolve({ done: false, value: encode("\n") });
                signal.addEventListener("abort", () => {
                  const error = new Error("aborted");
                  error.name = "AbortError";
                  reject(error);
                }, { once: true });
              }),
          }),
        },
      };
    },
  });

  const request = helpers.callAiTranslation("Translate.", "Hello.");
  await nextTurn();
  releaseRead();
  await nextTurn();
  releaseRead();
  await nextTurn();
  assert.equal(timers.activeCount(50_000), 1);
  timers.fireActive(120_000);
  const result = await request;
  assert.equal(result.success, false);
  assert.equal(result.code, "AI_HARD_TIMEOUT");
  assert.match(result.error, /120-second limit.*Retry/i);
  assert.equal(timers.activeCount(50_000), 0);
});

test("provider response reader accepts leading whitespace before JSON", async () => {
  const helpers = loadBackgroundHelpers({
    fetchImpl: async () =>
      streamingResponse([
        encode('  \n\t{"choices":[{"message":{"content":"ok"}}]}'),
      ]),
  });
  const result = await helpers.callAiTranslation("Translate.", "Hello.");
  assert.equal(result.success, true);
  assert.equal(result.text, "ok");
});

test("provider response reader rejects bodies over 2 MiB", async () => {
  const helpers = loadBackgroundHelpers({
    fetchImpl: async () =>
      streamingResponse([new Uint8Array(2 * 1024 * 1024 + 1)]),
  });
  const result = await helpers.callAiTranslation("Translate.", "Hello.");
  assert.equal(result.success, false);
  assert.equal(result.code, "AI_RESPONSE_TOO_LARGE");
  assert.match(result.error, /2 MiB limit/);
});

test("DeepSeek retries one empty transcript JSON response without response_format", async () => {
  const requests = [];
  const helpers = loadBackgroundHelpers({
    fetchImpl: async (url, options) => {
      if (url.startsWith("chrome-extension://")) {
        return { ok: true, text: async () => read("prompts/translation.md") };
      }
      requests.push(JSON.parse(options.body));
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: requests.length === 1
                ? ""
                : '{"segments":[{"id":"segment-0-0","text":"\u4e2d\u6587\u8bd1\u6587\u3002"}]}',
            },
          }],
        }),
      };
    },
  });
  const result = await helpers.handleTranslateContent(
    { segments: [{ id: "segment-0-0", text: "English source sentence." }] },
    "transcriptBatch",
    "zh",
    "Video",
  );
  assert.equal(result.success, true);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0].response_format, { type: "json_object" });
  assert.equal(Object.hasOwn(requests[1], "response_format"), false);
  assert.equal(requests[0].max_tokens, 1536);
});

test("selected text translation uses the plain text prompt path", async () => {
  const requests = [];
  const helpers = loadBackgroundHelpers({
    fetchImpl: async (url, options) => {
      if (url.startsWith("chrome-extension://")) {
        return { ok: true, text: async () => read("prompts/translation.md") };
      }
      requests.push(JSON.parse(options.body));
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "这是一段中文翻译。" } }],
        }),
      };
    },
  });

  const result = await helpers.handleTranslateContent(
    { text: "This is selected text." },
    "selectedText",
    "zh",
    "Video",
  );

  assert.equal(result.success, true);
  assert.equal(result.translatedContent.text, "这是一段中文翻译。");
  assert.equal(requests.length, 1);
  assert.match(requests[0].messages[0].content, /selected transcript text/);
  assert.equal(requests[0].messages[1].content, "This is selected text.");
  assert.equal(Object.hasOwn(requests[0], "response_format"), false);
});

test("translation message watchdog rejects, clears its timer, and ignores late replies", async () => {
  let timeoutCallback;
  let timeoutDelay;
  let resolveMessage;
  let clearCount = 0;
  const helpers = loadSidepanelHelpers({
    sendMessage: () =>
      new Promise((resolve) => {
        resolveMessage = resolve;
      }),
    setTimeoutImpl(callback, delay) {
      timeoutCallback = callback;
      timeoutDelay = delay;
      return 73;
    },
    clearTimeoutImpl(id) {
      assert.equal(id, 73);
      clearCount += 1;
    },
  });

  const request = helpers.sendTranslationMessage({
    action: "translateContent",
  });
  assert.equal(timeoutDelay, 130_000);
  timeoutCallback();
  await assert.rejects(request, /timed out after 130 seconds.*Retry/i);
  assert.equal(clearCount, 1);

  resolveMessage({ success: true });
  await Promise.resolve();
  assert.equal(clearCount, 1);

  let successTimeoutCallback;
  let successClearCount = 0;
  const successfulHelpers = loadSidepanelHelpers({
    sendMessage: () => Promise.resolve({ success: true }),
    setTimeoutImpl(callback) {
      successTimeoutCallback = callback;
      return 91;
    },
    clearTimeoutImpl(id) {
      assert.equal(id, 91);
      successClearCount += 1;
    },
  });
  assert.deepEqual(
    await successfulHelpers.sendTranslationMessage({
      action: "translateContent",
    }),
    { success: true },
  );
  assert.equal(successClearCount, 1);
  successTimeoutCallback();
  assert.equal(successClearCount, 1);
});

test("Chinese prompt preserves natural bilingual-learning style rules", () => {
  const prompt = read("prompts/translation.md");
  assert.match(prompt, /Translate the complete thought/);
  assert.match(prompt, /Use 你, never 您/);
  assert.match(prompt, /spaces between Chinese and adjacent English words or digits/);
  assert.match(prompt, /source-language `text`/);
});

test("both transcript paths feed speaker-marker-cleaned text to the AI provider", () => {
  const source = read("background.js");
  const cleaned = (source.match(/\$\{cleanText\}\\n`/g) || []).length;
  assert.equal(
    cleaned,
    2,
    "the synchronous and async polling paths must both use cleaned text",
  );
  assert.doesNotMatch(source, /\$\{chunk\.text\}\\n/);
});

test("background service worker has no dead action.onClicked listener", () => {
  const source = read("background.js");
  assert.doesNotMatch(source, /chrome\.action\.onClicked\.addListener/);
  assert.match(source, /openPanelOnActionClick: true/);
});
