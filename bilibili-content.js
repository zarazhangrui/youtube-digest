(() => {
  if (globalThis.__digestBiliLoaded) return;
  globalThis.__digestBiliLoaded = true;
  const current = () => DIGEST_VIDEO.parse(location.href);
  const media = () => document.querySelector(".bpx-player-video-wrap video, .bpx-player-video-wrap bwp-video, video, bwp-video");
  let lastVideoId = null;
  let buttons;
  let status;
  let statusTimer;

  function info() {
    return {
      title: document.querySelector("h1.video-title, h1")?.textContent?.trim() || "",
      channelName: document.querySelector(".up-name, .up-detail .up-name")?.textContent?.trim() || "",
      description: document.querySelector(".basic-desc-info, .video-desc")?.textContent?.trim() || "",
      duration: Number(media()?.duration) || 0,
    };
  }
  function feedback(text) {
    if (!status) return;
    status.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { if (status) status.textContent = ""; }, 5000);
  }
  async function saveNote() {
    const video = current();
    const player = media();
    if (!video || !player) return;
    feedback("保存中…");
    try {
      const metadata = info();
      const result = await chrome.runtime.sendMessage({ action: "saveNote", videoId: video.id,
        timestamp: Math.max(0, Math.floor(player.currentTime) - 3),
        videoTitle: metadata.title, channelName: metadata.channelName });
      feedback(result.success ? "笔记已保存" : (result.message || result.error || "保存失败，请重试"));
    } catch { feedback("扩展已更新，请刷新页面。"); }
  }
  function reconcile() {
    const video = current();
    if (!video) {
      buttons?.remove(); buttons = null; status = null; lastVideoId = null;
      return;
    }
    if (video.id !== lastVideoId) {
      lastVideoId = video.id;
      feedback("");
      chrome.runtime.sendMessage({ action: "videoPageChanged", videoId: video.id }).catch(() => {});
    }
    if (buttons?.isConnected) return;
    buttons = document.createElement("div");
    buttons.id = "bili-digest-controls";
    const shadow = buttons.attachShadow({ mode: "open" });
    // An isolated floating control stays usable across Bilibili's toolbar layouts.
    const style = document.createElement("style");
    style.textContent = `:host{position:fixed;right:24px;bottom:84px;z-index:9999;font:14px system-ui,sans-serif}
      .controls{display:flex;gap:6px;justify-content:flex-end}button{background:#c8674f;color:white;border:0;border-radius:20px;
      padding:10px 16px;cursor:pointer;box-shadow:0 3px 12px #0002;font:600 14px system-ui,sans-serif}
      button:hover{background:#b25742}button:focus-visible{outline:3px solid #00aeec;outline-offset:3px}
      [role=status]{display:block;max-width:300px;color:#333;background:#fff;border-radius:8px;margin-top:6px}
      [role=status]:not(:empty){padding:8px 12px;box-shadow:0 3px 12px #0002}`;
    const controls = document.createElement("div"); controls.className = "controls";
    const open = document.createElement("button"); open.textContent = "Digest · 字幕";
    open.title = "打开字幕、摘要与笔记";
    open.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "openSidePanel" }).catch(() => feedback("请刷新页面后重试。"));
    });
    const note = document.createElement("button"); note.textContent = "记笔记";
    note.addEventListener("click", saveNote);
    status = document.createElement("span"); status.setAttribute("role", "status");
    controls.append(open, note); shadow.append(style, controls, status); document.body.append(buttons);
  }
  chrome.runtime.onMessage.addListener((message, _sender, respond) => {
    if (!current() || (message.videoId && message.videoId !== current().id)) {
      respond({ success: false, error: "VIDEO_CHANGED" }); return false;
    }
    const player = media();
    switch (message.action) {
      case "getVideoInfo": respond(info()); break;
      case "getCurrentTime": respond({ currentTime: Number(player?.currentTime) || 0, paused: player?.paused ?? true }); break;
      case "seekTo": {
        if (!player || !Number.isFinite(message.seconds) || message.seconds < 0) {
          respond({ success: false, error: "PLAYER_UNAVAILABLE" }); break;
        }
        player.currentTime = message.seconds;
        if (player.paused) Promise.resolve(player.play()).catch(() => {});
        respond({ success: true }); break;
      }
      case "highlightMoments": respond({ success: true }); break;
      case "showNoteSavedFeedback": feedback("笔记已保存"); respond({ success: true }); break;
      default: respond({ success: false, error: "Unknown action" });
    }
    return false;
  });
  reconcile();
  // Detect both SPA video changes and p= changes; also recover removed controls.
  setInterval(reconcile, 750);
})();
