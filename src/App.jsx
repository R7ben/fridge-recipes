import { useEffect, useState } from "react";
import "./App.css";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-flash-latest"; // if this errors, use the ListModels trick to find a live one

const QUOTES = [
  "Abs are made in the kitchen. So is garlic bread.",
  "Protein first, regrets later.",
  "A recipe a day keeps the takeout app away.",
  "Track your macros, not your excuses.",
  "Cooking is cheaper than a gym membership — and tastier.",
  "Your fridge called. It has ideas.",
  "Calories count, but flavor counts more.",
  "Meal prep now, thank yourself later.",
  "Real chefs check the fridge before the recipe.",
  "Fitness goals start with what's actually in your kitchen.",
  "Gains are made one sad, wilted vegetable at a time.",
  "Eat like your future self is watching.",
];

const LOADING_LINES = [
  "Peeking into your fridge...",
  "Chopping virtual veggies...",
  "Simmering some ideas...",
  "Tasting for seasoning...",
  "Plating your recipes...",
];

const MAX_CALORIES = 800; // gauge ceiling, kcal per serving
const MAX_PROTEIN = 50; // gauge ceiling, grams per serving

export default function App() {
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null); // holds a structured object
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [loadingLine, setLoadingLine] = useState(LOADING_LINES[0]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Fake-but-satisfying progress bar + cycling status line while we wait on the API.
  useEffect(() => {
    if (!loading) return;
    let lineIdx = 0;
    const progressTimer = setInterval(() => {
      setProgress((p) => (p < 92 ? p + Math.random() * 10 : p));
    }, 350);
    const lineTimer = setInterval(() => {
      lineIdx = (lineIdx + 1) % LOADING_LINES.length;
      setLoadingLine(LOADING_LINES[lineIdx]);
    }, 1400);
    return () => {
      clearInterval(progressTimer);
      clearInterval(lineTimer);
    };
  }, [loading]);

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setLoading(true);
    setError("");
    setResult(null);
    setProgress(4);
    setLoadingLine(LOADING_LINES[0]);

    try {
      const base64 = await fileToBase64(file);

      const prompt = `You are a fun, upbeat kitchen assistant. Look at this photo of food or ingredients.
Return ONLY valid JSON in exactly this shape:
{
  "ingredients": ["item1", "item2"],
  "recipes": [
    { "name": "Recipe name", "steps": ["step 1", "step 2", "step 3"], "calories": 450, "protein": 28 }
  ]
}
"calories" is an estimated number of kcal per serving (integer). "protein" is estimated grams of protein per serving (integer).
Suggest 3 simple recipes using mostly what you can see. Keep recipe names short and punchy.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: prompt }, { inline_data: { mime_type: file.type, data: base64 } }] },
            ],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error?.message || "Unknown error";
        setError(res.status === 429 ? "Rate limit hit — wait ~60s and retry." : `API error ${res.status}: ${msg}`);
        return;
      }

      const text = data.candidates[0].content.parts[0].text;
      setResult(JSON.parse(text));
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError("Something went wrong — check the console (F12).");
    } finally {
      setLoading(false);
    }
  }

  function copyRecipe(recipe, i) {
    const text = `${recipe.name}\n${recipe.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex((cur) => (cur === i ? null : cur)), 1500);
  }

  function reset() {
    setResult(null);
    setImagePreview(null);
    setError("");
    setProgress(0);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍳 Fridge → Plate</h1>
        <p className="tagline">Snap it. Scan it. Cook it.</p>
        <p className="quote">"{quote}"</p>
      </header>

      <label className={`upload-zone${loading ? " is-loading" : ""}`}>
        <input type="file" accept="image/*" onChange={handleUpload} disabled={loading} hidden />
        {imagePreview ? (
          <div className="scan-wrapper">
            <img src={imagePreview} alt="your food" className="preview-img" />
            {loading && <div className="scan-line" />}
          </div>
        ) : (
          <div className="upload-placeholder">
            <span className="upload-icon">📸</span>
            <span>Tap to snap or upload your fridge</span>
          </div>
        )}
      </label>

      {result && !loading && (
        <button className="btn-ghost" onClick={reset}>
          🔄 Start over
        </button>
      )}

      {loading && (
        <div className="pan-loader">
          <div className="pan-scene">
            <div className="steam">
              <span />
              <span />
              <span />
            </div>
            <span className="pan-food">🍳</span>
          </div>
          <p className="loading-line">{loadingLine}</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      )}

      {error && <p className="error-box">⚠️ {error}</p>}

      {result && (
        <div className="results">
          {result.ingredients.length === 0 && (
            <p className="empty-box">🤔 Hmm, couldn't spot much food there. Try a clearer photo of your ingredients!</p>
          )}

          {result.ingredients.length > 0 && (
            <section>
              <h2>🥕 Spotted in your fridge ({result.ingredients.length})</h2>
              <div className="chip-row">
                {result.ingredients.map((item, i) => (
                  <span key={i} className="chip">
                    {item}
                  </span>
                ))}
              </div>
            </section>
          )}

          {result.recipes.length > 0 && (
            <section>
              <h2>👨‍🍳 Your recipe lineup</h2>
              <div className="recipe-grid">
                {result.recipes.map((recipe, i) => {
                  const cal = recipe.calories ?? 0;
                  const protein = recipe.protein ?? 0;
                  return (
                    <div key={i} className="recipe-card">
                      <div className="recipe-head">
                        <h3>{recipe.name}</h3>
                        <button className="copy-btn" onClick={() => copyRecipe(recipe, i)}>
                          {copiedIndex === i ? "✅ Copied" : "📋 Copy"}
                        </button>
                      </div>

                      <div className="gauges">
                        <div className="gauge">
                          <div className="gauge-label">
                            <span>🔥 Calories</span>
                            <span>{cal} kcal</span>
                          </div>
                          <div className="gauge-track">
                            <div
                              className="gauge-fill cal"
                              style={{ width: `${Math.min((cal / MAX_CALORIES) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="gauge">
                          <div className="gauge-label">
                            <span>💪 Protein</span>
                            <span>{protein} g</span>
                          </div>
                          <div className="gauge-track">
                            <div
                              className="gauge-fill protein"
                              style={{ width: `${Math.min((protein / MAX_PROTEIN) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <ol className="steps">
                        {recipe.steps.map((step, j) => (
                          <li key={j}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
