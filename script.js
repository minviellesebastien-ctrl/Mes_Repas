// Récupération de la clé stockée dans le navigateur
let GEMINI_API_KEY = localStorage.getItem("GEMINI_API_KEY");

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
  if (screenToHide) screenToHide.classList.remove("active-screen");
  if (screenToShow) screenToShow.classList.add("active-screen");
}

function addIngredient() {
  const input = document.getElementById("ingredientInput");
  if (!input) return;
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

// Demande la clé si elle n'est pas encore enregistrée
function getApiKey() {
  if (!GEMINI_API_KEY) {
    const inputKey = prompt("Veuillez saisir votre clé API Gemini :");
    if (inputKey && inputKey.trim() !== "") {
      GEMINI_API_KEY = inputKey.trim();
      localStorage.setItem("GEMINI_API_KEY", GEMINI_API_KEY);
    }
  }
  return GEMINI_API_KEY;
}

// Génération de recettes via Gemini avec le modèle gemini-3.6-flash
async function generateRecipesWithGemini() {
  const recipesTitle = document.getElementById("recipesTitle");
  const recipesList = document.getElementById("recipesList");

  if (userIngredients.length === 0) {
    if (recipesTitle) recipesTitle.textContent = "Recettes (0)";
    if (recipesList) recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Veuillez ajouter au moins un ingrédient.</p>";
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    if (recipesTitle) recipesTitle.textContent = "Recettes (0)";
    if (recipesList) recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #d9534f;'>Clé API manquante. Veuillez réessayer et entrer une clé valide.</p>";
    return;
  }

  if (recipesList) recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Génération des recettes adaptées...</p>";

  const promptText = `Crée 4 recettes en français pour le mode de cuisson "${selectedMode}" avec ces ingrédients : ${userIngredients.join(", ")}.
Adapte précisément les explications et étapes au mode "${selectedMode}".`;

  // Endpoint mis à jour vers gemini-3.6-flash
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

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
      if (data.error.code === 400 || data.error.status === "INVALID_ARGUMENT") {
        localStorage.removeItem("GEMINI_API_KEY");
        GEMINI_API_KEY = null;
      }
      if (recipesList) recipesList.innerHTML = `<p style='font-size: 0.85rem; color: #d9534f;'>Erreur API : ${data.error.message}</p>`;
      return;
    }

    const rawJsonText = data.candidates[0].content.parts[0].text;
    generatedRecipes = JSON.parse(rawJsonText);
    renderRecipes(generatedRecipes);

  } catch (err) {
    console.error(err);
    if (recipesList) recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Erreur lors de la connexion à l'IA.</p>";
  }
}

function renderRecipes(recipes) {
  const recipesTitle = document.getElementById("recipesTitle");
  const recipesList = document.getElementById("recipesList");

  if (recipesTitle) recipesTitle.textContent = `Recettes (${recipes.length})`;
  if (!recipesList) return;

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
  if (!meal || !recipeModal) return;

  const modalTitle = document.getElementById("modalTitle");
  const modalMeta = document.getElementById("modalMeta");
  const modalIngredients = document.getElementById("modalIngredients");
  const modalSteps = document.getElementById("modalSteps");

  if (modalTitle) modalTitle.textContent = meal.title;
  if (modalMeta) modalMeta.textContent = `Cuisson : ${selectedMode.toUpperCase()} | Temps : ${meal.prepTime}`;

  if (modalIngredients) {
    modalIngredients.innerHTML = meal.ingredients
      .map((ing) => `<li style="padding: 4px 0; font-size:0.85rem;">• ${ing}</li>`)
      .join("");
  }

  if (modalSteps) {
    modalSteps.innerHTML = meal.steps
      .map((step, idx) => `
        <li style="margin-bottom: 8px; font-size: 0.85rem;">
          <strong style="color: var(--primary-green, #2e7d32);">${idx + 1}.</strong> ${step}
        </li>
      `).join("");
  }

  recipeModal.classList.remove("hidden");
}
