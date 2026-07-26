import ScrollCanvasSequence from "./ScrollCanvasSequence.jsx";
import "./SequenceDemo.css";

// 23 pre-rendered frames of a refrigerator rotating (frame_000 .. frame_022)
const FRAME_COUNT = 23;
const FRAMES = Array.from(
  { length: FRAME_COUNT },
  (_, i) => `/frames/frame_${String(i).padStart(3, "0")}.jpg`
);

export default function SequenceDemo() {
  return (
    <main className="demo">
      <section className="demo-hero">
        <span className="demo-eyebrow">HTML5 Canvas · React</span>
        <h1 className="demo-title">Scroll-Driven Image Sequence</h1>
        <p className="demo-lede">
          Keep scrolling — the refrigerator below is a sequence of frames painted
          onto a canvas and scrubbed by your scroll position.
        </p>
        <div className="demo-scroll-cue" aria-hidden="true">
          <span>Scroll</span>
          <span className="demo-arrow" />
        </div>
      </section>

      <ScrollCanvasSequence frames={FRAMES} aspectRatio={16 / 9} scrollLength={3} fit="cover">
        {(progress) => (
          <div className="demo-overlay-inner">
            <div className="demo-badge">
              Frame {Math.round(progress * (FRAME_COUNT - 1)) + 1} / {FRAME_COUNT}
            </div>
            <h2 className="demo-overlay-title">FreshGuard Series</h2>
          </div>
        )}
      </ScrollCanvasSequence>

      <section className="demo-outro">
        <h2>Sequence complete</h2>
        <p>
          Once every frame has played, the container releases and the page scrolls
          normally again. The canvas renders each frame at device-pixel resolution
          and preserves aspect ratio across any screen size.
        </p>
      </section>
    </main>
  );
}
