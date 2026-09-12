import { useEffect, useRef, useState } from "react";
import { getLocalMedia, subscribeLocalMedia, BG_VIDEO_KEY } from "../utils/localMedia.js";

// The app's background video, mounted once at the root and sitting behind
// everything else.
//
// It cannot be a CSS background: applyTheme.js sets document.body's
// background-image, and a <video> is not an image. So this is a fixed,
// full-viewport element at a negative z-index with the rest of the app
// painted over it.
//
// The scrim above it is not decoration. applyTheme already lays a 55%
// black gradient over background IMAGES so body text stays readable; a
// moving picture is harder to read over than a still one, not easier, so
// the same treatment applies here rather than less of it.
export default function BackgroundVideo() {
  const [url, setUrl] = useState(null);
  const urlRef = useRef(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const rec = await getLocalMedia(BG_VIDEO_KEY);
        if (!alive) return;
        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current);
          urlRef.current = null;
        }
        if (rec?.blob) {
          const next = URL.createObjectURL(rec.blob);
          urlRef.current = next;
          setUrl(next);
        } else {
          setUrl(null);
        }
      } catch {
        setUrl(null);
      }
    }

    load();
    // Re-read when the settings screen swaps or clears the video.
    const off = subscribeLocalMedia((key) => { if (key === BG_VIDEO_KEY) load(); });
    return () => {
      alive = false;
      off();
      // An object URL pins the whole file in memory until it is revoked,
      // and this one can be very large.
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  // applyTheme paints an OPAQUE background on <body>, and a body
  // background is painted after negative-z-index layers - so without this
  // the video would sit behind it and never be seen. The flag lets
  // applyThemeVars know not to repaint over the video when the theme
  // changes later; clearing it restores the normal painted background.
  const claimedRef = useRef(false);
  useEffect(() => {
    const root = document.documentElement;
    if (url) {
      root.dataset.evBgVideo = "1";
      document.body.style.setProperty("background-color", "transparent", "important");
      document.body.style.setProperty("background-image", "none", "important");
      claimedRef.current = true;
    } else if (claimedRef.current) {
      // Only restore if this component was the one that took the
      // background away. An earlier version cleared it unconditionally on
      // mount, which stripped the themed background applyTheme had just
      // painted for everyone who has no video at all.
      //
      // Restored through the custom properties rather than a literal
      // colour, so the body picks up whatever theme is current instead of
      // whichever one happened to be active when the video was set.
      delete root.dataset.evBgVideo;
      document.body.style.setProperty("background-color", "var(--bg)", "important");
      document.body.style.setProperty("background-image", "var(--bg-image, none)", "important");
      claimedRef.current = false;
    }
    return () => {
      delete root.dataset.evBgVideo;
    };
  }, [url]);

  if (!url) return null;

  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden", pointerEvents: "none" }}>
      <video
        src={url}
        autoPlay loop muted playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
    </div>
  );
}
