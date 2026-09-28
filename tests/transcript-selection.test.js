const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.resolve(__dirname, "..", "sidepanel.js"),
  "utf8",
);

test("all timestamped transcript row clicks use the selection-aware seek helper", () => {
  assert.match(
    source,
    /function hasNonCollapsedTextSelection\(\)[\s\S]*?selection\.rangeCount > 0 && !selection\.isCollapsed/,
  );
  assert.match(
    source,
    /function seekFromTranscriptEntryClick\(event, seconds\)[\s\S]*?if \(hasNonCollapsedTextSelection\(\)\) \{[\s\S]*?event\.preventDefault\(\);[\s\S]*?event\.stopPropagation\(\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?seekTo\(seconds\);/,
  );

  const guardedRowHandlers = source.match(
    /div\.addEventListener\("click", \(event\) =>\s+seekFromTranscriptEntryClick\(event, group\.start\),\s+\);/g,
  );
  assert.equal(
    guardedRowHandlers?.length,
    1,
    "raw transcript rows must use the guard",
  );
  assert.match(
    source,
    /div\.addEventListener\("click", \(event\) =>\s+seekFromTranscriptEntryClick\(event, segment\.start\),\s+\);/,
    "translated-only and bilingual rows must use the guard",
  );
  assert.doesNotMatch(
    source,
    /div\.addEventListener\("click", \(\) => seekTo\(group\.start\)\);/,
  );
});

test("the selection toolbar preserves selection and contains pointer events", () => {
  assert.match(
    source,
    /class="explain-btn"[\s\S]*?>Explain<[\s\S]*class="selection-note-btn"[\s\S]*?>Note</,
  );
  assert.match(
    source,
    /tooltip\.addEventListener\("mousedown", \(event\) => \{\s+event\.preventDefault\(\);\s+event\.stopPropagation\(\);/,
  );
  assert.match(
    source,
    /tooltip\.addEventListener\("mouseup", \(event\) => \{\s+event\.stopPropagation\(\);/,
  );
  assert.match(
    source,
    /\.addEventListener\("click", async \(event\) => \{\s+event\.preventDefault\(\);\s+event\.stopPropagation\(\);/,
  );
  assert.match(
    source,
    /querySelector\("\.selection-note-btn"\)[\s\S]*action: "saveNote"[\s\S]*timestamp: selectedTimestamp[\s\S]*selectedText/,
  );
  assert.match(
    source,
    /tooltip\.style\.top =[\s\S]*tooltip\.style\.left =[\s\S]*tooltip\.style\.display = "flex"/,
    "the toolbar must be positioned before it becomes visible",
  );
});

test("leaving Transcript dismisses its selection actions", () => {
  assert.match(
    source,
    /if \(tabName !== "transcript" && transcriptTabIsActive\(\)\) \{\s*captureCurrentTranscriptScrollTop\(\);\s*dismissSelectionActions\(true\);/,
  );
  assert.match(
    source,
    /function dismissSelectionActions\(clearSelection = false\)[\s\S]*tooltip\.style\.display = "none"[\s\S]*window\.getSelection\(\)\?\.removeAllRanges\(\)/,
  );
});

test("Notes opens at its newest item and Transcript keeps its position", () => {
  assert.match(
    source,
    /if \(tabName === "notes"\)[\s\S]*notesPanelIsActive[\s\S]*contentArea\.scrollTop = 0/,
  );
  assert.match(
    source,
    /if \(tabName === "transcript"\)[\s\S]*contentArea\.scrollTop = lastTranscriptScrollTop/,
  );
});

test("the transcript view restores without resuming automatic scrolling", () => {
  assert.match(
    source,
    /void saveCurrentTranscriptViewState\(\);\s+window\.close\(\);/,
  );
  assert.match(
    source,
    /const nextViewState = await loadTranscriptViewState\(videoId\)/,
  );
  assert.match(
    source,
    /function restorePendingTranscriptViewState\(videoId\)[\s\S]*autoScrollEnabled = false;[\s\S]*contentArea\.scrollTop = state\.scrollTop;/,
  );
  assert.match(
    source,
    /willRestoreReadingPosition[\s\S]*autoScrollEnabled = !willRestoreReadingPosition/,
  );
  assert.match(
    source,
    /function scheduleTranscriptViewStateSave\(\)[\s\S]*!transcriptTabIsActive\(\)[\s\S]*return;/,
  );
  assert.match(
    source,
    /tabName !== "transcript" && transcriptTabIsActive\(\)[\s\S]*captureCurrentTranscriptScrollTop\(\)/,
  );
});

test("the first non-YouTube navigation is checked again after commit", () => {
  assert.match(
    source,
    /function getNavigationUrl\(changeInfo, tab\)[\s\S]*changeInfo\.status !== "loading"[\s\S]*changeInfo\.status !== "complete"[\s\S]*tab\.pendingUrl \|\| tab\.url/,
  );
  assert.match(
    source,
    /chrome\.tabs\.onUpdated\.addListener\(\(tabId, changeInfo, tab\)[\s\S]*getNavigationUrl\(changeInfo, tab\)[\s\S]*handleFrontTabUrl\(url\)/,
  );
});

test("the panel never borrows a background YouTube tab", () => {
  assert.match(
    source,
    /const tabs = await chrome\.tabs\.query\(\{\s*active: true,\s*lastFocusedWindow: true,\s*\}\);/,
  );
  assert.match(
    source,
    /if \(!DIGEST_VIDEO\.supports\(tab\.url\)\) \{\s*handleFrontTabUrl\(tab\.url\);\s*return;/,
  );
  assert.doesNotMatch(
    source,
    /chrome\.tabs\.query\(\{ url: "https:\/\/www\.youtube\.com\/\*" \}\)/,
  );
});
