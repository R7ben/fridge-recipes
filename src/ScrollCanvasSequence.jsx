import { useEffect, useRef, useState, useCallback } from "react";
import "./ScrollCanvasSequence.css";

/**
 * ScrollCanvasSequence
 * A scroll-driven image sequence rendered to an HTML5 <canvas>.
 *
 * The section becomes "sticky" (pinned) while the user scrolls through it.
 * Scroll progress is mapped to a frame index and the matching pre-loaded
 * image is drawn to the canvas via requestAnimationFrame for flicker-free,
 * 60fps playback. Once the sequence completes, normal scrolling resumes.
 *
 * Props:
 *  - frames:       string[]  array of image URLs (ordered)
 *  - aspectRatio:  number    width / height of the frames (default 16/9)
 *  - scrollLength: number    scroll distance as a multiple of viewport height
 *                            that the animation spans (default 3 = 300vh)
 *  - fit:          "cover" | "contain"  how frames fill the canvas (default "cover")
 *  - children:     optional overlay content pinned on top of the canvas
 */
export default function ScrollCanvasSequence({
  frames = [],
  aspectRatio = 16 / 9,
  scrollLength = 3,
  fit = "cover",
  children,
}) {
  const wrapperRef = useRef(null); // tall scroll track
  const canvasRef = useRef(null);
  const imagesRef = useRef([]); // decoded HTMLImageElements
  const currentFrameRef = useRef(-1); // last frame drawn (avoids redundant draws)
  const rafRef = useRef(null);
  const targetFrameRef = useRef(0);

  const [loadedCount, setLoadedCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 through the sequence

  const total = frames.length;

  // ---- Draw a single frame with cover/contain fit + devicePixelRatio scaling ----
  const drawFrame = useCallback(
    (index) => {
      const canvas = canvasRef.current;
      const img = imagesRef.current[index];
      if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

      const ctx = canvas.getContext("2d");
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      const canvasRatio = cw / ch;
      const imgRatio = iw / ih;

      let dw, dh, dx, dy;
      const useCover = fit === "cover";
      // cover -> fill & crop; contain -> letterbox
      if (useCover ? imgRatio > canvasRatio : imgRatio < canvasRatio) {
        dh = ch;
        dw = ch * imgRatio;
      } else {
        dw = cw;
        dh = cw / imgRatio;
      }
      dx = (cw - dw) / 2;
      dy = (ch - dh) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
      currentFrameRef.current = index;
    },
    [fit]
  );

  // ---- Size the canvas backing store to its display size * DPR ----
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    // force a redraw of the current/target frame after resize
    const idx = currentFrameRef.current >= 0 ? currentFrameRef.current : targetFrameRef.current;
    drawFrame(idx);
  }, [drawFrame]);

  // ---- Preload every frame; track progress for the loading indicator ----
  useEffect(() => {
    if (total === 0) return;
    let cancelled = false;
    let loaded = 0;
    const imgs = new Array(total);

    frames.forEach((src, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      const onDone = () => {
        if (cancelled) return;
        loaded += 1;
        setLoadedCount(loaded);
        if (loaded === total) {
          setReady(true);
        }
      };
      img.onload = onDone;
      img.onerror = onDone; // don't stall the loader on a broken frame
      img.src = src;
      imgs[i] = img;
    });

    imagesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, [frames, total]);

  // ---- Draw first frame as soon as it is ready ----
  useEffect(() => {
    if (loadedCount > 0) {
      resizeCanvas();
      drawFrame(0);
    }
  }, [loadedCount, resizeCanvas, drawFrame]);

  // ---- Scroll -> frame index mapping (rAF throttled) ----
  useEffect(() => {
    if (!ready) return;

    const computeAndDraw = () => {
      rafRef.current = null;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      const vh = window.innerHeight;
      // total scrollable distance while the sticky canvas is pinned
      const scrollable = rect.height - vh;
      // how far we've scrolled into the wrapper (0 at top pin, 1 at bottom)
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
      const p = scrollable > 0 ? scrolled / scrollable : 0;

      setProgress(p);
      const frame = Math.min(total - 1, Math.max(0, Math.round(p * (total - 1))));
      targetFrameRef.current = frame;
      if (frame !== currentFrameRef.current) {
        drawFrame(frame);
      }
    };

    const onScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(computeAndDraw);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // initial position
    computeAndDraw();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, total, drawFrame]);

  // ---- Keep the canvas resolution in sync with its display size ----
  useEffect(() => {
    resizeCanvas();
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    // Defer the resize into a rAF so the canvas mutation happens outside the
    // observer's delivery cycle. This avoids the benign but noisy
    // "ResizeObserver loop completed with undelivered notifications" error.
    let roRaf = null;
    const ro = new ResizeObserver(() => {
      if (roRaf !== null) return;
      roRaf = requestAnimationFrame(() => {
        roRaf = null;
        resizeCanvas();
      });
    });
    ro.observe(canvas);
    return () => {
      if (roRaf !== null) cancelAnimationFrame(roRaf);
      ro.disconnect();
    };
  }, [resizeCanvas]);

  const loadPct = total > 0 ? Math.round((loadedCount / total) * 100) : 0;

  return (
    <section
      ref={wrapperRef}
      className="scs-wrapper"
      style={{ height: `${scrollLength * 100}vh` }}
    >
      <div className="scs-sticky">
        <div className="scs-stage" style={{ aspectRatio }}>
          <canvas ref={canvasRef} className="scs-canvas" />

          {/* Loading fallback while frames pre-load */}
          {!ready && (
            <div className="scs-loader" role="status" aria-live="polite">
              <div className="scs-spinner" aria-hidden="true" />
              <div className="scs-loader-track">
                <div className="scs-loader-fill" style={{ width: `${loadPct}%` }} />
              </div>
              <p className="scs-loader-text">
                Loading sequence… {loadPct}%
              </p>
            </div>
          )}

          {/* Optional overlay content, pinned over the canvas */}
          {children && (
            <div className="scs-overlay" data-ready={ready ? "true" : "false"}>
              {typeof children === "function" ? children(progress) : children}
            </div>
          )}

          {/* Scrubber / progress indicator */}
          {ready && (
            <div className="scs-progress" aria-hidden="true">
              <div className="scs-progress-fill" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
