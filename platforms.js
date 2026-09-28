/* Shared video identities. YouTube cache keys stay backward compatible. */
var DIGEST_VIDEO = (() => {
  function parse(url) {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:") return null;
      if (u.hostname === "www.youtube.com" && (u.pathname === "/watch" || u.pathname.startsWith("/embed/"))) {
        const id = u.pathname.startsWith("/embed/") ? u.pathname.split("/")[2] : u.searchParams.get("v");
        return /^[A-Za-z0-9_-]{6,20}$/.test(id || "")
          ? { platform: "youtube", id } : null;
      }
      if (u.hostname === "www.bilibili.com") {
        const match = u.pathname.match(/^\/video\/(BV[A-Za-z0-9]{10}|av[1-9]\d*)\/?$/);
        const part = Number(u.searchParams.get("p") || 1);
        if (match && Number.isSafeInteger(part) && part > 0 && part <= 10000) {
          return { platform: "bilibili", video: match[1], part,
            id: `bili:${match[1]}:p${part}` };
        }
      }
    } catch {}
    return null;
  }

  function fromId(id) {
    const match = String(id || "").match(/^bili:(BV[A-Za-z0-9]{10}|av[1-9]\d*):p([1-9]\d*)$/);
    if (match) return parse(`https://www.bilibili.com/video/${match[1]}/?p=${match[2]}`);
    if (/^[A-Za-z0-9_-]{6,20}$/.test(id || "")) return { platform: "youtube", id };
    return null;
  }

  function url(id, seconds) {
    const video = fromId(id);
    if (!video) throw new Error("Invalid video ID");
    const u = new URL(video.platform === "bilibili"
      ? `https://www.bilibili.com/video/${video.video}/?p=${video.part}`
      : `https://www.youtube.com/watch?v=${video.id}`);
    if (seconds !== undefined) {
      const time = Math.max(0, Math.floor(Number(seconds) || 0));
      u.searchParams.set("t", video.platform === "youtube" ? `${time}s` : String(time));
    }
    return u.href;
  }
  function validTranscriptSource(id, source) {
    const video = fromId(id);
    if (!video) return false;
    if (video.platform !== "bilibili") return true;
    return source?.version === 2 && source.videoId === id && source.part === video.part &&
      source.endpoint === "wbi/v2" && /^[1-9]\d*$/.test(source.cid || "") &&
      (video.video.startsWith("BV") ? source.bvid === video.video : source.aid === video.video.slice(2));
  }
  return { parse, fromId, url, validTranscriptSource, supports: (url) => !!parse(url) };
})();
if (typeof module !== "undefined") module.exports = DIGEST_VIDEO;
