import ScrollCanvasSequence from "./ScrollCanvasSequence.jsx";
import App from "./App.jsx";
import "./Home.css";

// 23 pre-rendered frames of a refrigerator rotating / opening (frame_000 .. frame_022)
const FRAME_COUNT = 23;
const FRAMES = Array.from(
  { length: FRAME_COUNT },
  (_, i) => `/frames/frame_${String(i).padStart(3, "0")}.jpg`
);

export default function Home() {
  return (
    <>
      {/* Cinematic scroll-driven intro. It pins while you scroll through the
          frames, then releases into the recipe app below. */}
      <ScrollCanvasSequence
        frames={FRAMES}
        aspectRatio={16 / 9}
        scrollLength={3}
        fit="cover"
      >
        {(progress) => (
          <div className="intro-overlay">
            <span className="intro-eyebrow">Fridge to Plate</span>
            <h1 className="intro-title">Open the fridge.</h1>
            <p className="intro-lede">
              Keep scrolling to see what&apos;s inside — then snap a photo and let
              us turn it into recipes.
            </p>
            <div
              className="intro-progress"
              style={{ opacity: progress > 0.85 ? 1 : 0 }}
            >
              <span>Scroll to begin cooking</span>
              <span className="intro-arrow" aria-hidden="true" />
            </div>
          </div>
        )}
      </ScrollCanvasSequence>

      {/* The actual recipe app, sitting on top of / after the sequence. */}
      <App />
    </>
  );
}
