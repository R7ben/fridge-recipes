import { useState } from "react";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-flash-latest"; // if this errors, use the ListModels trick to find a live one

export default function App() {
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null); // now holds a structured object, not text
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    try {
      const base64 = await fileToBase64(file);

      // Ask for JSON in an exact shape so it's easy to display
      const prompt = `You are a kitchen assistant. Look at this photo of food or ingredients.
Return ONLY valid JSON in exactly this shape:
{
  "ingredients": ["item1", "item2"],
  "recipes": [
    { "name": "Recipe name", "steps": ["step 1", "step 2", "step 3"] }
  ]
}
Suggest 3 simple recipes using mostly what you can see.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: prompt }, { inline_data: { mime_type: file.type, data: base64 } }] },
            ],
            generationConfig: { responseMimeType: "application/json" }, // forces clean JSON
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
      setResult(JSON.parse(text)); // turn JSON text into a real object
    } catch (err) {
      console.error(err);
      setError("Something went wrong — check the console (F12).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>🍳 Fridge → Recipes</h1>
      <p style={{ color: "#666", marginTop: 0 }}>Snap your ingredients, get recipe ideas.</p>

      <input type="file" accept="image/*" onChange={handleUpload} />

      {imagePreview && (
        <img src={imagePreview} alt="your food" style={{ width: "100%", borderRadius: 16, marginTop: 16 }} />
      )}

      {loading && <p>🔍 Looking at your food...</p>}
      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          <h2>🥕 Ingredients spotted</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {result.ingredients.map((item, i) => (
              <span key={i} style={{ background: "#eafaf1", color: "#1e7e46", padding: "6px 12px", borderRadius: 999, fontSize: 14 }}>
                {item}
              </span>
            ))}
          </div>

          <h2 style={{ marginTop: 24 }}>👨‍🍳 Recipe ideas</h2>
          {result.recipes.map((recipe, i) => (
            <div key={i} style={{ border: "1px solid #eee", borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ marginTop: 0 }}>{recipe.name}</h3>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                {recipe.steps.map((step, j) => (
                  <li key={j} style={{ marginBottom: 4 }}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}