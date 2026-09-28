const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const read = (name) => fs.readFileSync(path.join(__dirname, "..", name), "utf8");
const DIGEST_VIDEO = require("../platforms.js");
const id = "bili:BV1a6Yx62EH4:p2";

function backgroundHarness(url = DIGEST_VIDEO.url(id)) {
  const store = {};
  const scripts = [];
  const listener = { addListener() {} };
  const sandbox = {
    URL, console, setTimeout, clearTimeout, AbortController,
    fetch: async () => { throw new Error("Unexpected external service request"); },
    chrome: {
      storage: { local: {
        setAccessLevel: async () => {}, get: async (key) => ({ [key]: store[key] }),
        set: async (values) => Object.assign(store, values),
      } },
      runtime: { onMessage: listener, onInstalled: listener, sendMessage: async () => {} },
      action: { onClicked: listener },
      sidePanel: { setPanelBehavior() {} },
      tabs: { onUpdated: listener, onActivated: listener,
        get: async (tabId) => ({ id: tabId, url }), query: async () => [{ id: 7, url }] },
      scripting: { executeScript: async (request) => {
        scripts.push(request);
        return [{ result: { success: true, transcript: [{ start: 0, duration: 2, text: "字幕" }] } }];
      } },
    },
  };
  vm.createContext(sandbox);
  sandbox.importScripts = (file) => vm.runInContext(read(file), sandbox);
  vm.runInContext(read("background.js"), sandbox);
  return { sandbox, store, scripts };
}

test("Bilibili transcript routing works with empty settings and binds the supplied tab", async () => {
  const h = backgroundHarness();
  assert.equal((await h.sandbox.handleFetchTranscript(id, 7)).success, true);
  assert.equal(h.scripts[0].target.tabId, 7);
  assert.equal(h.scripts[0].world, "MAIN");
  assert.equal(h.scripts[0].args[0], id);
});

test("background rejects mismatched part rather than fetching another open video", async () => {
  const h = backgroundHarness(DIGEST_VIDEO.url("bili:BV1a6Yx62EH4:p1"));
  assert.equal((await h.sandbox.handleFetchTranscript(id, 7)).error, "VIDEO_CHANGED");
  assert.equal(h.scripts.length, 0);
});

test("selected Bilibili notes persist exact text and part-aware URLs without API keys", async () => {
  const h = backgroundHarness();
  const result = await h.sandbox.handleSaveNote(id, 91, "课程 P2", "老师", "关键观点");
  assert.equal(result.success, true);
  assert.equal(result.note.timestampedUrl, "https://www.bilibili.com/video/BV1a6Yx62EH4/?p=2&t=91");
  assert.equal(result.note.text, "关键观点");
  assert.equal(h.scripts.length, 0);
  assert.ok(Object.values(h.store).some(value => JSON.stringify(value).includes("关键观点")));
});

test("a late P1 transcript cannot overwrite the P2 panel or its cache", async () => {
  const listener = { addListener() {} };
  const requests = [];
  const stored = [];
  const element = { style: {}, classList: { toggle() {} } };
  const sandbox = {
    URL, console, DIGEST_VIDEO, setTimeout, clearTimeout,
    window: { close() {} },
    document: { addEventListener() {}, getElementById: () => element },
    chrome: { runtime: { onMessage: listener, sendMessage: (message) => new Promise(resolve => requests.push({ message, resolve })) },
      tabs: { onUpdated: listener, onActivated: listener }, windows: { getCurrent: async () => ({ id: 1 }) } },
    stored,
  };
  vm.createContext(sandbox); vm.runInContext(read("sidepanel.js"), sandbox);
  vm.runInContext(`
    loadTranscriptViewState = async () => null;
    loadDisplayLanguageMode = async () => "original";
    loadFromCache = async () => null;
    resetTranscriptSearch = renderTranscript = showState = updateLoading =
      restorePendingTranscriptViewState = loadNotes = setupExplainFeature = () => {};
    saveToCache = async id => stored.push({ id, text: currentTranscriptText });
  `, sandbox);
  const id1 = "bili:BV1a6Yx62EH4:p1";
  const first = sandbox.startDigest(id1, DIGEST_VIDEO.url(id1));
  await new Promise(setImmediate);
  const second = sandbox.startDigest(id, DIGEST_VIDEO.url(id));
  await new Promise(setImmediate);
  assert.equal(requests.length, 2);
  requests[1].resolve({ success: true, source: {version: 2, videoId: id, part: 2, bvid: "BV1a6Yx62EH4", aid: "123", cid: "222", endpoint: "wbi/v2"}, transcript: [{ start: 0, text: "P2" }], transcriptText: "P2" });
  await second;
  requests[0].resolve({ success: true, transcript: [{ start: 0, text: "P1" }], transcriptText: "P1" });
  await first;
  assert.equal(vm.runInContext("currentTranscriptText", sandbox), "P2");
  assert.equal(stored.length, 1);
  assert.equal(stored[0].id, id);
});
