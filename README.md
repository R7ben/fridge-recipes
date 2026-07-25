# 🍳 Fridge → Recipes

**Snap a photo of your ingredients and get instant AI-powered recipe ideas.**

> Built in [24 hours] at [Hackathon Name].

🔗 **Live demo:** [your-app.vercel.app](https://your-app.vercel.app)

---

## 📸 Demo

<!-- Drag a screenshot or GIF into your GitHub README editor, or use: -->
![App demo](demo.gif)

*Upload a photo → the app detects your ingredients → it suggests 3 simple recipes.*

---

## 💡 The problem

People stare into a full fridge and still don't know what to cook, then food goes to waste. **Fridge → Recipes** turns whatever you already have into meal ideas in seconds — no typing, just a photo.

---

## ✨ Features

- 📷 **Photo-to-ingredients** — upload a fridge/pantry photo and AI vision detects what's inside
- 👨‍🍳 **Instant recipes** — get 3 simple recipe suggestions using those ingredients
- ⚡ **Fast & clean UI** — ingredient chips, recipe cards, loading states
- 🛟 **Handles edge cases** — friendly message when no food is detected, plus a "start over" reset

---

## 🛠️ Tech stack

| Layer | Tool |
|---|---|
| Frontend | React (Vite) |
| AI vision | Google Gemini API (multimodal) |
| Deployment | Vercel |
| Version control | Git + GitHub |

---

## 🧠 How it works

1. The user uploads a photo, which is converted to base64.
2. The image + a structured prompt are sent to the Gemini API.
3. The AI returns clean JSON (ingredients + recipes) using a forced JSON response format.
4. React renders the results as ingredient chips and recipe cards.

---

## 🚀 Run it locally

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/fridge-recipes.git
cd fridge-recipes

# 2. Install dependencies
npm install

# 3. Add your API key
# Create a .env file with:
# VITE_GEMINI_API_KEY=your_key_here

# 4. Start the dev server
npm run dev
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com).

---

## 📚 What I learned

- Calling a multimodal (vision) AI API and handling image data in the browser
- Forcing structured JSON output from an LLM for reliable UI rendering
- Real-world debugging: rate limits (429), model versioning (404), and reading live API docs
- Deploying a React app with environment variables on Vercel

---

## 🔮 What I'd build next

- 💾 Save meal history with Firebase
- 🥗 Dietary filters (vegetarian, gluten-free)
- ✏️ Manually add or remove detected ingredients
- 🛒 Auto-generate a shopping list for missing items

---

## 👤 Author

**[Your Name]** — [LinkedIn](https://linkedin.com/in/you) · [GitHub](https://github.com/YOUR_USERNAME)