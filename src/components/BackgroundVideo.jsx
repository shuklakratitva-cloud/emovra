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
  // Clearing the way for the video is more than making <body>
  // transparent. Three opaque layers sit above a negative-z-index element:
  //
  //   body            - App.css:74  `body, #root { background: var(--bg) !important }`
  //   #root           - the same rule
  //   the page root   - e.g. Dashboard.jsx paints `background: var(--bg)`
  //                     inline on a min-height:100vh div
  //
  // An earlier version only handled <body>, which is why the video was
  // invisible in the real app while passing a test against a bare page.
  //
  // A stylesheet rule is used rather than inline styles because it can
  // reach elements this component does not own, and because an author
  // !important rule beats the page root's non-important inline style.
  // #root's own rule is !important too, so the selector is made more
  // specific than a bare `#root` to win that tie.
  useEffect(() => {
    if (!url) return;
    const style = document.createElement("style");
    style.dataset.evBgVideo = "1";
    style.textContent = `
      html[data-ev-bg-video="1"] body,
      html[data-ev-bg-video="1"] #root,
      html[data-ev-bg-video="1"] #root > div:not([data-ev-bg-layer]) {
        background-color: transparent !important;
        background-image: none !important;
      }
    `;
    document.head.appendChild(style);
    document.documentElement.dataset.evBgVideo = "1";

    // <body> needs one extra step. initTheme() runs before React mounts,
    // so applyThemeVars has already painted body with an INLINE
    // !important background - and an inline important declaration beats
    // the stylesheet rule above. The applyTheme guard stops it being
    // repainted from here on, but it cannot undo the paint that already
    // happened, so the existing one is lifted (and put back on cleanup).
    const hadInlineBg = !!document.body.style.getPropertyValue("background")
      || !!document.body.style.getPropertyValue("background-color");
    document.body.style.removeProperty("background");
    document.body.style.removeProperty("background-color");
    document.body.style.removeProperty("background-image");

    return () => {
      style.remove();
      delete document.documentElement.dataset.evBgVideo;
      // Restored through var(--bg) rather than the captured literal, so
      // the body picks up whichever theme is current - the person may
      // have changed it while the video was covering everything.
      if (hadInlineBg) {
        document.body.style.setProperty("background", "var(--bg)", "important");
        document.body.style.setProperty("background-image", "var(--bg-image, none)", "important");
      }
    };
  }, [url]);

  if (!url) return null;

  return (
    <div aria-hidden="true" data-ev-bg-layer="1" style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden", pointerEvents: "none" }}>
      <video
        src={url}
        autoPlay loop muted playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
    </div>
  );
}
