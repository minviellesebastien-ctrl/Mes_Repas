let userIngredients = [];
let selectedMode = "cookeo";
let generatedRecipes = [];

// Remplace par ta clé API OpenAI (platform.openai.com)
const OPENAI_API_KEY = "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";

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

  // Gestion des Ingrédients
  if (addBtn) addBtn.addEventListener("click", addIngredient);
  if (ingredientInput) {
    ingredientInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") addIngredient();
    });
  }

  // Lancement de la génération via ChatGPT
  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      await fetchRecipesFromChatGPT();
      showScreen(resultsScreen, mainScreen);
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      showScreen(mainScreen, resultsScreen);
    });
  }

  // Sélection du mode de cuisson
  document.querySelectorAll(".cooking-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".cooking-btn").forEach((b) => b.classList.remove("active"));
      const target = e.currentTarget;
      target.classList.add("active");
      selectedMode = target.dataset.mode;
    });
  });

  // Navigation du bas
  if (openSemaineBtn) openSemaineBtn.addEventListener("click", () => semaineModal.classList.remove("hidden"));
  if (closeSemaineBtn) closeSemaineBtn.addEventListener("click", () => semaineModal.classList.add("hidden"));

  if (openListeBtn) openListeBtn.addEventListener("click", () => listeModal.classList.remove("hidden"));
  if (closeListeBtn) closeListeBtn.addEventListener("click", () => listeModal.classList.add("hidden"));

  // Modale Détail
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

// Appel à l'API OpenAI
async function fetchRecipesFromChatGPT() {
  const recipesTitle = document.getElementById("recipesTitle");
  const recipesList = document.getElementById("recipesList");

  if (userIngredients.length === 0) {
    recipesTitle.textContent = "Recettes (0)";
    recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Veuillez ajouter au moins un ingrédient.</p>";
    return;
  }

  recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Génération des recettes par l'IA en cours...</p>";

  const prompt = `Génère 3 idées de recettes en français adaptées au mode de cuisson "${selectedMode}" en utilisant principalement ces ingrédients : ${userIngredients.join(", ")}.
Réponds STRICTEMENT avec un tableau JSON valide au format suivant (sans texte d'introduction ni markdown) :
[
  {
    "title": "Nom de la recette",
    "prepTime": "20 min",
    "ingredients": ["Ingrédient 1", "Ingrédient 2"],
    "steps": ["Étape 1", "Étape 2"]
  }
]`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
      recipesList.innerHTML = `<p style='font-size: 0.85rem; color: #62826c;'>Erreur API : ${data.error.message}</p>`;
      return;
    }

    const content = data.choices[0].message.content.trim();
    // Nettoyage au cas où l'IA renvoie du balisage markdown ```json
    const cleanedJson = content.replace(/^```json/, '').replace(/```$/, '').trim();
    
    generatedRecipes = JSON.parse(cleanedJson);
    renderRecipes(generatedRecipes);

  } catch (error) {
    console.error("Erreur ChatGPT :", error);
    recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Erreur de connexion. Vérifiez votre clé API OpenAI.</p>";
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
