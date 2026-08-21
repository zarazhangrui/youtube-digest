/**
 * PAGE TRANSLATE CONTENT SCRIPT
 *
 * Runs on ordinary web pages and translates selected text in a small popup.
 * YouTube-specific UI stays in content.js.
 */

const PAGE_TRANSLATE_MAX_SELECTION_CHARS = 4000;
const PAGE_TRANSLATE_POPUP_ID = "ytd-page-translate-popup";

let pageTranslatePopup = null;
let pageTranslatePopupContent = null;
let pageTranslateRequestId = 0;

function getSelectedPageText() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return { text: "", rect: null };
  }

  const text = selection.toString().trim();
  if (!text) return { text: "", rect: null };

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (!rect || (rect.width === 0 && rect.height === 0)) {
    return { text: "", rect: null };
  }

  return { text, rect };
}

function ensurePageTranslatePopup() {
  if (pageTranslatePopup?.isConnected) return pageTranslatePopup;

  const host = document.createElement("div");
  host.id = PAGE_TRANSLATE_POPUP_ID;
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  host.style.display = "none";
  host.style.left = "0";
  host.style.top = "0";

  const shadow = host.attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        color-scheme: light;
      }
      .card {
        box-sizing: border-box;
        width: min(340px, calc(100vw - 24px));
        max-height: min(260px, calc(100vh - 24px));
        overflow: auto;
        padding: 12px 14px;
        border: 1px solid rgba(43, 38, 32, 0.14);
        border-radius: 10px;
        background: #fffaf3;
        color: #2f2a24;
        box-shadow: 0 14px 34px rgba(31, 27, 22, 0.22);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 14px;
        line-height: 1.55;
      }
      .status {
        color: #7a7066;
        font-size: 13px;
      }
      .error {
        color: #b0442e;
        font-size: 13px;
      }
      .text {
        white-space: pre-wrap;
      }
    </style>
    <div class="card" role="status" aria-live="polite">
      <div class="status" id="content">Translating...</div>
    </div>
  `;

  pageTranslatePopup = host;
  pageTranslatePopupContent = shadow.getElementById("content");
  document.documentElement.appendChild(host);
  host.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  return host;
}

function positionPageTranslatePopup(rect) {
  const popup = ensurePageTranslatePopup();
  popup.style.display = "block";

  const margin = 12;
  const desiredTop = rect.bottom + 8;
  const desiredLeft = rect.left + rect.width / 2 - 170;
  const maxLeft = window.innerWidth - 340 - margin;
  const left = Math.max(margin, Math.min(desiredLeft, Math.max(margin, maxLeft)));
  const top = Math.max(
    margin,
    Math.min(desiredTop, window.innerHeight - 260 - margin),
  );

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}

function setPageTranslatePopupContent(text, state = "text") {
  ensurePageTranslatePopup();
  if (!pageTranslatePopupContent) return;
  pageTranslatePopupContent.className = state;
  pageTranslatePopupContent.textContent = text;
}

function hidePageTranslatePopup() {
  pageTranslateRequestId += 1;
  if (pageTranslatePopup) pageTranslatePopup.style.display = "none";
}

async function translatePageSelection(text) {
  const result = await chrome.runtime.sendMessage({
    action: "translateContent",
    content: { text },
    contentType: "selectedText",
    targetLanguage: "zh",
    videoTitle: document.title || "Web page",
  });

  if (!result?.success) {
    throw new Error(result?.error || "Translation failed.");
  }

  const translatedText = result.translatedContent?.text?.trim();
  if (!translatedText) {
    throw new Error("Translation returned empty text.");
  }
  return translatedText;
}

function handlePageSelectionMouseup(event) {
  if (pageTranslatePopup?.contains(event.target)) return;

  setTimeout(async () => {
    const { text, rect } = getSelectedPageText();
    if (!text || !rect) {
      hidePageTranslatePopup();
      return;
    }

    const requestId = ++pageTranslateRequestId;
    positionPageTranslatePopup(rect);

    if (text.length > PAGE_TRANSLATE_MAX_SELECTION_CHARS) {
      setPageTranslatePopupContent("Selected text is too long.", "error");
      return;
    }

    setPageTranslatePopupContent("Translating...", "status");
    try {
      const translatedText = await translatePageSelection(text);
      if (requestId !== pageTranslateRequestId) return;
      setPageTranslatePopupContent(translatedText, "text");
    } catch (error) {
      if (requestId !== pageTranslateRequestId) return;
      setPageTranslatePopupContent(error.message || "Translation failed.", "error");
    }
  }, 0);
}

document.addEventListener("mouseup", handlePageSelectionMouseup);
document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) hidePageTranslatePopup();
});
window.addEventListener("scroll", hidePageTranslatePopup, true);
window.addEventListener("resize", hidePageTranslatePopup);
