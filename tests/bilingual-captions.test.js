const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("bilingual captions render a player toggle and overlay", () => {
  const source = read("content.js");
  assert.match(source, /\.id = "ytd-captions-toggle"/);
  assert.match(source, /\.id = "ytd-captions-overlay"/);
  assert.match(
    source,
    /document\.getElementById\("ytd-captions-toggle"\)/,
    "SPA navigation must clean up the toggle",
  );
  assert.match(
    source,
    /document\.getElementById\("ytd-captions-overlay"\)/,
    "SPA navigation must clean up the overlay",
  );
});

test("bilingual captions reuse the transcript and translation message paths", () => {
  const source = read("content.js");
  assert.match(source, /action: "fetchTranscript"/);
  assert.match(source, /action: "translateContent"/);
  assert.match(source, /contentType: "transcriptBatch"/);
  assert.match(source, /targetLanguage: "zh"/);
});

test("bilingual captions sync to playback and translate in sequential batches", () => {
  const source = read("content.js");
  assert.match(
    source,
    /document\.addEventListener\("timeupdate", handleCaptionsTimeUpdate, true\)/,
    "capture-phase listener must survive YouTube swapping the <video> element",
  );
  assert.match(source, /\.splice\(0, 4\)/, "translation batches must be capped at 4");
  assert.match(source, /resetCaptionsState\(\)/);
});

test("background exposes the captions preference through the service worker", () => {
  const source = read("background.js");
  assert.match(source, /message\.action === "getCaptionsPref"/);
  assert.match(source, /message\.action === "setCaptionsPref"/);
  assert.match(source, /ytd_captions_enabled/);
  assert.doesNotMatch(
    source,
    /chrome\.storage\.local\.setAccessLevel\(\{ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS"/,
    "storage must stay TRUSTED_CONTEXTS so content scripts cannot read API keys",
  );
});

test("bilingual captions reuse the side panel's semantic segmentation", () => {
  const source = read("content.js");
  assert.match(source, /CAPTIONS_SEGMENT_LIMITS/);
  assert.match(source, /idealChars: 180/);
  assert.match(source, /maxChars: 320/);
  assert.match(source, /function groupCaptionsIntoPages/);
  assert.match(source, /groupCaptionsIntoPages\(cleanChunks\)/);
  assert.match(source, /id: ytdCaptionsState\.pages\[index\]\.id/);
});
