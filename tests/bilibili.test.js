const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const videos = require("../platforms.js");
const { readInPage } = require("../bilibili.js");
const root = path.resolve(__dirname, "..");
const video = "BV1a6Yx62EH4";
const id = `bili:${video}:p2`;
const pageUrl = `https://www.bilibili.com/video/${video}/?p=2`;

function pageHarness({ tracks, viewCode = 0, playerCode = 0, rows, part = 2, fetchError, onFetch, playerIdentity = {} } = {}) {
  const calls = [];
  const sandbox = {
    URL, AbortSignal,
    location: new URL(pageUrl),
    fetch: async (url, options) => {
      calls.push({ url, options });
      onFetch?.(url, sandbox);
      if (fetchError) throw fetchError;
      let data;
      if (url.includes("/view?")) {
        data = { code: viewCode, data: { aid: 123, bvid: video, title: "课程", owner: { name: "老师" }, desc: "介绍",
          pages: [{ page: 1, cid: 111, part: "第一课", duration: 200 }, { page: part, cid: 222, part: "第二课", duration: 300 }] } };
      } else if (url.includes("/player/wbi/v2?")) {
        data = { code: playerCode, data: { aid: 123, bvid: video, cid: 222, ...playerIdentity, subtitle: { subtitles: tracks ?? [
          { lan: "en", subtitle_url: "//aisubtitle.hdslb.com/en.json" },
          { lan: "ai-zh", subtitle_url: "//aisubtitle.hdslb.com/ai.json" },
          { lan: "zh-CN", subtitle_url: "//aisubtitle.hdslb.com/zh.json" },
        ] } } };
      } else {
        data = { body: rows ?? [{ from: 2.5, to: 4, content: "第二句话" }, { from: 0, to: 2, content: "  你好  世界  " }] };
      }
      return { ok: true, json: async () => data };
    },
  };
  vm.createContext(sandbox);
  const read = vm.runInContext(`(${readInPage.toString()})`, sandbox);
  return { calls, sandbox, read: (include = true) => read(id, include) };
}

test("Bilibili identities isolate parts and preserve canonical seek links", () => {
  assert.equal(videos.parse(pageUrl + "&spm_id_from=tracking&t=9").id, id);
  assert.notEqual(videos.parse(pageUrl).id, videos.parse(pageUrl.replace("p=2", "p=1")).id);
  assert.equal(videos.url(id, 91.9), pageUrl + "&t=91");
  assert.equal(videos.parse("https://www.bilibili.com/video/av123/").id, "bili:av123:p1");
  assert.equal(videos.parse("https://www.youtube.com/watch?v=dQw4w9WgXcQ").id, "dQw4w9WgXcQ");
  assert.equal(videos.url("dQw4w9WgXcQ", 12), "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12s");
});

test("unsupported pages, deceptive domains and invalid part numbers are rejected", () => {
  for (const url of ["https://www.bilibili.com/", "https://www.bilibili.com/bangumi/play/ep123",
    "https://www.youtube.com.evil.test/watch?v=dQw4w9WgXcQ", "https://www.bilibili.com.evil.test/video/BV1a6Yx62EH4/",
    pageUrl.replace("https:", "http:"), pageUrl.replace("p=2", "p=-1"), pageUrl.replace("p=2", "p=1.5"),
    pageUrl.replace("p=2", "p=10001")]) assert.equal(videos.parse(url), null, url);
  assert.throws(() => videos.url("bili:invalid:p2"));
});

test("native API pipeline uses the selected part, sorts captions and does not forward credentials to CDN", async () => {
  const h = pageHarness();
  const result = await h.read();
  assert.equal(result.success, true);
  assert.equal(result.info.title, "课程 · P2 第二课");
  assert.equal(result.info.duration, 300);
  assert.equal(result.language, "zh-CN");
  assert.equal(result.transcript[1].start, 2.5);
  assert.equal(result.transcript[0].duration, 2);
  assert.equal(result.transcriptText, "你好 世界 第二句话");
  assert.equal(result.transcriptTextTimestamped, "[0:00] 你好 世界\n[0:02] 第二句话");
  assert.match(h.calls[1].url, /aid=123&cid=222$/);
  assert.equal(h.calls[2].url, "https://aisubtitle.hdslb.com/zh.json");
  assert.equal(h.calls[0].options.credentials, "include");
  assert.equal(h.calls[2].options.credentials, "omit");
});

test("metadata-only requests do not download subtitles", async () => {
  const h = pageHarness();
  assert.equal((await h.read(false)).info.channelName, "老师");
  assert.equal(h.calls.length, 1);
});

test("AI-only subtitle tracks work without Supadata", async () => {
  const h = pageHarness({ tracks: [{ lan: "ai-zh", subtitle_url: "//aisubtitle.hdslb.com/ai.json" }] });
  assert.equal((await h.read()).language, "ai-zh");
  assert.ok(h.calls.every((c) => !c.url.includes("supadata")));
});

test("missing subtitles provide actionable login/CC guidance and no transcription request", async () => {
  const h = pageHarness({ tracks: [] });
  const result = await h.read();
  assert.equal(result.error, "BILI_NO_SUBTITLE");
  assert.match(result.message, /登录.*CC/);
  assert.equal(h.calls.length, 2);
});

test("private, unavailable and invalid-part videos return explicit errors", async () => {
  assert.equal((await pageHarness({ viewCode: -404 }).read()).error, "BILI_VIDEO_UNAVAILABLE");
  assert.equal((await pageHarness({ part: 3 }).read()).error, "BILI_PART_UNAVAILABLE");
  assert.equal((await pageHarness({ playerCode: -101 }).read()).error, "BILI_PLAYER_UNAVAILABLE");
});

test("a navigation during a subtitle fetch cannot publish stale captions", async () => {
  const h = pageHarness({ onFetch: (url, sandbox) => {
    if (url.includes("hdslb.com")) sandbox.location = new URL(pageUrl.replace("p=2", "p=1"));
  } });
  assert.equal((await h.read()).error, "VIDEO_CHANGED");
});

test("untrusted subtitle hosts and credentials in URLs are never fetched", async () => {
  for (const subtitle_url of ["https://evil.test/sub.json", "http://aisubtitle.hdslb.com/a.json",
    "https://aisubtitle.hdslb.com.evil.test/a.json", "https://user:pass@aisubtitle.hdslb.com/a.json"]) {
    const h = pageHarness({ tracks: [{ lan: "zh", subtitle_url }] });
    assert.equal((await h.read()).error, "BILI_SUBTITLE_HOST");
    assert.equal(h.calls.length, 2);
  }
});

test("malformed captions and failed requests terminate with useful errors", async () => {
  const invalid = [{ from: -1, to: 0, content: "bad" }, { from: 3, to: 1, content: "bad" }, { from: 0, to: 1, content: " " }];
  assert.equal((await pageHarness({ rows: invalid }).read()).error, "EMPTY_TRANSCRIPT");
  assert.equal((await pageHarness({ fetchError: new Error("network") }).read()).error, "BILI_FETCH_FAILED");
});

test("Bilibili access is limited to its video page; no cookies permission is added", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json")));
  assert.deepEqual(manifest.host_permissions, ["https://www.youtube.com/*", "https://api.supadata.ai/*",
    "https://api.deepseek.com/*", "https://www.bilibili.com/*"]);
  assert.ok(!manifest.permissions.includes("cookies"));
  assert.deepEqual(manifest.content_scripts[1].js, ["platforms.js", "bilibili-content.js"]);
});

test("the legacy endpoint is never used and verified provenance accompanies captions", async () => {
  const h = pageHarness();
  const result = await h.read();
  assert.ok(h.calls.some(c => c.url.includes('/x/player/wbi/v2?')));
  assert.ok(h.calls.every(c => !c.url.includes('/x/player/v2?')));
  assert.equal(videos.validTranscriptSource(id, result.source), true);
  assert.equal(result.source.cid, '222');
  assert.equal(h.calls[1].options.cache, 'no-store');
});

test("mismatched player identity is rejected before downloading captions", async () => {
  for (const playerIdentity of [{ cid: 111 }, { aid: 456 }, { bvid: 'BV1G2G369EZp' }]) {
    const h = pageHarness({ playerIdentity });
    assert.equal((await h.read()).error, 'BILI_IDENTITY_MISMATCH');
    assert.equal(h.calls.length, 2);
  }
});

test("legacy poisoned caches cannot be reused by the panel or note pipeline", () => {
  const good = {version: 2, videoId: id, part: 2, aid: '123', bvid: video, cid: '222', endpoint: 'wbi/v2'};
  assert.equal(videos.validTranscriptSource(id, undefined), false);
  assert.equal(videos.validTranscriptSource(id, {...good, version: 1}), false);
  assert.equal(videos.validTranscriptSource(id, {...good, part: 1}), false);
  assert.equal(videos.validTranscriptSource(id, {...good, endpoint: 'v2'}), false);
  assert.equal(videos.validTranscriptSource(id, good), true);
  assert.equal(videos.validTranscriptSource('dQw4w9WgXcQ', undefined), true);
  for (const file of ['sidepanel.js', 'background.js']) {
    assert.match(fs.readFileSync(path.join(root, file), 'utf8'), /validTranscriptSource\(videoId, cached/);
  }
});
