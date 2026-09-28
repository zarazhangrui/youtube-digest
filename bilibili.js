/* Executed in the Bilibili tab's MAIN world. No cookies or API keys cross
 * the extension message boundary. Only video metadata and captions return. */
var DIGEST_BILI = (() => {
  async function readInPage(videoId, includeTranscript) {
    const fail = (error, message) => ({ success: false, error, message });
    const match = String(videoId).match(/^bili:(BV[A-Za-z0-9]{10}|av[1-9]\d*):p([1-9]\d*)$/);
    const matchesPage = () => {
      const pageVideo = location.pathname.match(/^\/video\/([^/]+)\/?$/)?.[1];
      return location.origin === "https://www.bilibili.com" && match &&
        pageVideo === match[1] && Number(new URL(location.href).searchParams.get("p") || 1) === Number(match[2]);
    };
    if (!matchesPage()) return fail("VIDEO_CHANGED", "视频已切换，请重试。");

    async function getJson(url, credentials = "include") {
      const r = await fetch(url, { credentials, cache: "no-store", signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error(`B 站请求失败（HTTP ${r.status}），请稍后重试。`);
      return r.json();
    }
    try {
      const query = match[1].startsWith("BV") ? `bvid=${match[1]}` : `aid=${match[1].slice(2)}`;
      const view = await getJson(`https://api.bilibili.com/x/web-interface/view?${query}`);
      if (view.code !== 0 || !view.data) {
        return fail("BILI_VIDEO_UNAVAILABLE", "无法读取视频信息，请确认视频可播放后重试。");
      }
      const data = view.data;
      if ((match[1].startsWith("BV") && data.bvid !== match[1]) ||
          (match[1].startsWith("av") && String(data.aid) !== match[1].slice(2))) {
        return fail("BILI_IDENTITY_MISMATCH", "视频信息与当前页面不一致，已停止读取，请刷新重试。");
      }
      const part = data.pages?.find((p) => p.page === Number(match[2]));
      if (!part) return fail("BILI_PART_UNAVAILABLE", "找不到当前分 P，请刷新视频页面。");
      const info = {
        title: data.pages.length > 1 ? `${data.title} · P${part.page} ${part.part}` : data.title,
        channelName: data.owner?.name || "", description: data.desc || "",
        duration: part.duration || 0,
      };
      if (!includeTranscript) return matchesPage()
        ? { success: true, info } : fail("VIDEO_CHANGED", "视频已切换，请重试。");

      // The legacy /x/player/v2 endpoint can return unrelated AI captions,
      // even with matching aid/cid fields. Never fall back to that endpoint.
      const player = await getJson(`https://api.bilibili.com/x/player/wbi/v2?aid=${data.aid}&cid=${part.cid}`);
      if (player.code !== 0) {
        return fail("BILI_PLAYER_UNAVAILABLE", "无法读取 B 站字幕，请登录 B 站并确认视频可播放后重试。");
      }
      if (String(player.data?.aid) !== String(data.aid) ||
          player.data?.bvid !== data.bvid || String(player.data?.cid) !== String(part.cid)) {
        return fail("BILI_IDENTITY_MISMATCH", "字幕归属与当前视频/分 P 不一致，已停止读取，请刷新重试。");
      }
      const tracks = player.data?.subtitle?.subtitles || [];
      // Prefer creator-provided Chinese, then AI Chinese, then other tracks.
      const score = (t) => (/^(zh|ai-zh)/.test(t.lan) ? 0 : 10) + (/^ai-/.test(t.lan) ? 1 : 0);
      const track = [...tracks].filter((t) => t.subtitle_url).sort((a, b) => score(a) - score(b))[0];
      if (!track) return fail("BILI_NO_SUBTITLE",
        "B 站未返回可读取的字幕。请先登录 B 站，并确认播放器的 CC/字幕菜单有字幕，再点击重试。仅烧录在画面里的字幕暂不支持。");

      const subtitleUrl = new URL(track.subtitle_url, "https://www.bilibili.com");
      // The URL is supplied by a page/API, so do not fetch arbitrary hosts.
      const allowed = ["aisubtitle.hdslb.com", "i0.hdslb.com", "i1.hdslb.com", "i2.hdslb.com", "subtitle.bilibili.com"];
      if (subtitleUrl.protocol !== "https:" || !allowed.includes(subtitleUrl.hostname) || subtitleUrl.port || subtitleUrl.username || subtitleUrl.password) {
        return fail("BILI_SUBTITLE_HOST", "字幕地址不受支持，请反馈该视频链接。");
      }
      const captions = await getJson(subtitleUrl.href, "omit");
      const transcript = (Array.isArray(captions.body) ? captions.body : [])
        .filter((row) => typeof row.content === "string" && row.content.trim() &&
          Number.isFinite(row.from) && row.from >= 0 && Number.isFinite(row.to) && row.to >= row.from)
        .map((row) => ({ text: row.content.replace(/\s+/g, " ").trim(), start: row.from,
          duration: row.to - row.from, language: track.lan || null }))
        .sort((a, b) => a.start - b.start);
      if (!matchesPage()) return fail("VIDEO_CHANGED", "视频已切换，请重试。");
      if (!transcript.length) return fail("EMPTY_TRANSCRIPT", "B 站返回的字幕为空。");
      return { success: true, info, transcript, language: track.lan || null,
        source: { version: 2, videoId, aid: String(data.aid), bvid: data.bvid,
          cid: String(part.cid), part: Number(match[2]), endpoint: "wbi/v2" },
        transcriptText: transcript.map((row) => row.text).join(" "),
        transcriptTextTimestamped: transcript.map((row) => {
          const t = Math.floor(row.start);
          return `[${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}] ${row.text}`;
        }).join("\n") };
    } catch (error) {
      return fail("BILI_FETCH_FAILED", error.name === "TimeoutError"
        ? "读取 B 站字幕超时，请重试。" : "读取 B 站字幕失败，请确认网络连接和 B 站登录状态后重试。");
    }
  }
  return { readInPage };
})();
if (typeof module !== "undefined") module.exports = DIGEST_BILI;
