// Colle ta clé API Gemini obtenue sur Google AI Studio ou Google Cloud
const GEMINI_API_KEY = "AQ.Ab8RN6JX2uH9K0LaJE7D2z_hWfHbkwF5c7xoAvZwaSOq-YtR1Q";

let userIngredients = [];
let selectedMode = "simple";
let generatedRecipes = [];

document.addEventListener("DOMContentLoaded", () => {
  const mainScreen = document.getElementById("mainScreen");
  const resultsScreen = document.getElementById("resultsScreen");
  const backBtn = document.getElementById("backBtn");

  const ingredientInput = document.getElementById("ingredientInput");
  const addBtn = document.getElementById("addBtn");
  const searchBtn = document.getElementById("searchBtn");

  const recipeModal = document.getElementById("recipeModal");
  const closeModalBtn = document.getElementById("closeModalBtn");

  const semaineModal = document.getElementById("semaineModal");
  const openSemaineBtn = document.getElementById("openSemaineBtn");
  const closeSemaineBtn = document.getElementById("closeSemaineBtn");

  const listeModal = document.getElementById("listeModal");
  const openListeBtn = document.getElementById("openListeBtn");
  const closeListeBtn = document.getElementById("closeListeBtn");

  renderTags();

  if (addBtn) addBtn.addEventListener("click", addIngredient);
  if (ingredientInput) {
    ingredientInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") addIngredient();
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      await generateRecipesWithGemini();
      showScreen(resultsScreen, mainScreen);
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      showScreen(mainScreen, resultsScreen);
    });
  }

  document.querySelectorAll(".cooking-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".cooking-btn").forEach((b) => b.classList.remove("active"));
      const target = e.currentTarget;
      target.classList.add("active");
      selectedMode = target.dataset.mode;
    });
  });

  if (openSemaineBtn) openSemaineBtn.addEventListener("click", () => semaineModal.classList.remove("hidden"));
  if (closeSemaineBtn) closeSemaineBtn.addEventListener("click", () => semaineModal.classList.add("hidden"));

  if (openListeBtn) openListeBtn.addEventListener("click", () => listeModal.classList.remove("hidden"));
  if (closeListeBtn) closeListeBtn.addEventListener("click", () => listeModal.classList.add("hidden"));

  if (closeModalBtn) closeModalBtn.addEventListener("click", () => recipeModal.classList.add("hidden"));
});

function showScreen(screenToShow, screenToHide) {
  screenToHide.classList.remove("active-screen");
  screenToShow.classList.add("active-screen");
}

function addIngredient() {
  const input = document.getElementById("ingredientInput");
  const value = input.value.trim().toLowerCase();
  if (value && !userIngredients.includes(value)) {
    userIngredients.push(value);
    input.value = "";
    renderTags();
  }
}

function removeIngredient(index) {
  userIngredients.splice(index, 1);
  renderTags();
}

function renderTags() {
  const tagsContainer = document.getElementById("tagsContainer");
  if (!tagsContainer) return;

  tagsContainer.innerHTML = "";
  userIngredients.forEach((ing, index) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.innerHTML = `${ing} `;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "tag-remove";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => removeIngredient(index));

    tag.appendChild(removeBtn);
    tagsContainer.appendChild(tag);
  });
}

// Génération de recettes avec le modèle Gemini à jour
async function generateRecipesWithGemini() {
  const recipesTitle = document.getElementById("recipesTitle");
  const recipesList = document.getElementById("recipesList");

  if (userIngredients.length === 0) {
    recipesTitle.textContent = "Recettes (0)";
    recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Veuillez ajouter au moins un ingrédient.</p>";
    return;
  }

  recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Génération des recettes adaptées...</p>";

  const promptText = `Crée 4 recettes en français pour le mode de cuisson "${selectedMode}" avec ces ingrédients : ${userIngredients.join(", ")}.
Adapte précisément les explications et étapes au mode "${selectedMode}".`;

  // Modèle mis à jour (gemini-2.5-flash)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [
      {
        parts: [{ text: promptText }]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            prepTime: { type: "STRING" },
            ingredients: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            steps: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
          required: ["title", "prepTime", "ingredients", "steps"]
        }
      }
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
      recipesList.innerHTML = `<p style='font-size: 0.85rem; color: #d9534f;'>Erreur API : ${data.error.message}</p>`;
      return;
    }

    const rawJsonText = data.candidates[0].content.parts[0].text;
    generatedRecipes = JSON.parse(rawJsonText);
    renderRecipes(generatedRecipes);

  } catch (err) {
    console.error(err);
    recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Erreur lors de la connexion à l'IA.</p>";
  }
}

function renderRecipes(recipes) {
  const recipesTitle = document.getElementById("recipesTitle");
  const recipesList = document.getElementById("recipesList");

  recipesTitle.textContent = `Recettes (${recipes.length})`;
  recipesList.innerHTML = "";

  recipes.forEach((r, index) => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <div class="recipe-info">
        <h3 class="recipe-title">${r.title}</h3>
        <div class="recipe-meta">
          <span>Mode : ${selectedMode.toUpperCase()} | Temps : ${r.prepTime}</span>
        </div>
      </div>
    `;
    card.addEventListener("click", () => openRecipeModal(index));
    recipesList.appendChild(card);
  });
}

function openRecipeModal(index) {
  const recipeModal = document.getElementById("recipeModal");
  const meal = generatedRecipes[index];

  document.getElementById("modalTitle").textContent = meal.title;
  document.getElementById("modalMeta").textContent = `Cuisson : ${selectedMode.toUpperCase()} | Temps : ${meal.prepTime}`;

  document.getElementById("modalIngredients").innerHTML = meal.ingredients
    .map((ing) => `<li style="padding: 4px 0; font-size:0.85rem;">• ${ing}</li>`)
    .join("");

  document.getElementById("modalSteps").innerHTML = meal.steps
    .map((step, idx) => `
      <li style="margin-bottom: 8px; font-size: 0.85rem;">
        <strong style="color: var(--primary-green);">${idx + 1}.</strong> ${step}
      </li>
    `).join("");

  recipeModal.classList.remove("hidden");
}
  
