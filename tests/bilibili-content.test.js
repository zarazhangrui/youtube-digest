const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const DIGEST_VIDEO = require("../platforms.js");
const source = fs.readFileSync(path.join(__dirname, "../bilibili-content.js"), "utf8");

function harness() {
  class Element {
    constructor() { this.children = []; this.listeners = {}; this.isConnected = false; }
    append(...children) { this.children.push(...children); children.forEach(c => c.isConnected = true); }
    attachShadow() { return this.shadow = new Element(); }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    setAttribute() {}
    remove() { this.isConnected = false; }
  }
  const body = new Element();
  const sent = [];
  const player = { currentTime: 45, duration: 300, paused: true, play() { this.paused = false; return Promise.resolve(); } };
  let onMessage, tick;
  const sandbox = {
    DIGEST_VIDEO, URL, location: new URL("https://www.bilibili.com/video/BV1a6Yx62EH4/?p=2"),
    document: { body, createElement: () => new Element(), querySelector: (selector) => {
      if (selector.includes("bwp-video")) return player;
      if (selector.includes("h1")) return { textContent: "第二课" };
      return null;
    } },
    chrome: { runtime: {
      onMessage: { addListener: fn => onMessage = fn },
      sendMessage: async message => { sent.push(message); return { success: true }; },
    } },
    setInterval: fn => tick = fn, setTimeout: () => 0, clearTimeout() {},
  };
  vm.createContext(sandbox); vm.runInContext(source, sandbox);
  return { sandbox, body, player, sent, tick: () => tick(), message: (message) => {
    let response; onMessage(message, {}, r => response = r); return response;
  } };
}

test("Bilibili controls open the panel and save current-part timestamp notes", async () => {
  const h = harness();
  const controls = h.body.children[0].shadow.children[1];
  assert.equal(controls.children[0].textContent, "Digest · 字幕");
  await controls.children[0].listeners.click();
  assert.equal(h.sent.at(-1).action, "openSidePanel");
  await controls.children[1].listeners.click();
  assert.equal(h.sent.at(-1).action, "saveNote");
  assert.equal(h.sent.at(-1).videoId, "bili:BV1a6Yx62EH4:p2");
  assert.equal(h.sent.at(-1).timestamp, 42);
});

test("custom Bilibili media elements support seek, playback state and stale-part guards", () => {
  const h = harness();
  assert.equal(h.message({ action: "getCurrentTime" }).currentTime, 45);
  assert.equal(h.message({ action: "seekTo", seconds: 12.5, videoId: "bili:BV1a6Yx62EH4:p2" }).success, true);
  assert.equal(h.player.currentTime, 12.5);
  assert.equal(h.player.paused, false);
  assert.equal(h.message({ action: "seekTo", seconds: 90, videoId: "bili:BV1a6Yx62EH4:p1" }).error, "VIDEO_CHANGED");
  assert.equal(h.player.currentTime, 12.5);
  assert.equal(h.message({ action: "seekTo", seconds: -3 }).success, false);
});

test("SPA part changes notify once and controls disappear off video pages", () => {
  const h = harness();
  h.tick(); h.tick();
  assert.equal(h.body.children.length, 1);
  assert.equal(h.sent.length, 1);
  h.sandbox.location = new URL("https://www.bilibili.com/video/BV1a6Yx62EH4/?p=3");
  h.tick();
  assert.equal(h.sent.at(-1).videoId, "bili:BV1a6Yx62EH4:p3");
  h.sandbox.location = new URL("https://www.bilibili.com/");
  h.tick();
  assert.equal(h.body.children[0].isConnected, false);
});
