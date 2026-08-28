const GEMINI_API_KEY = "TA_CLE_API_GEMINI"; // Remplace par ta vraie clé

let userIngredients = ["poulet", "riz"];
let selectedMode = "cookeo";
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

  // Ajout ingrédient
  addBtn.addEventListener("click", addIngredient);
  ingredientInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") addIngredient();
  });

  // Bascule Écrans & Appel Gemini
  searchBtn.addEventListener("click", () => {
    fetchRecipesFromGemini();
    showScreen(resultsScreen, mainScreen);
  });

  backBtn.addEventListener("click", () => {
    showScreen(mainScreen, resultsScreen);
  });

  // Mode de cuisson
  document.querySelectorAll(".cooking-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".cooking-btn").forEach((b) => b.classList.remove("active"));
      const target = e.currentTarget;
      target.classList.add("active");
      selectedMode = target.dataset.mode;
    });
  });

  // Modales
  openSemaineBtn.addEventListener("click", () => semaineModal.classList.remove("hidden"));
  closeSemaineBtn.addEventListener("click", () => semaineModal.classList.add("hidden"));
  semaineModal.addEventListener("click", (e) => {
    if (e.target === semaineModal) semaineModal.classList.add("hidden");
  });

  openListeBtn.addEventListener("click", () => listeModal.classList.remove("hidden"));
  closeListeBtn.addEventListener("click", () => listeModal.classList.add("hidden"));
  listeModal.addEventListener("click", (e) => {
    if (e.target === listeModal) listeModal.classList.add("hidden");
  });

  closeModalBtn.addEventListener("click", () => recipeModal.classList.add("hidden"));
  recipeModal.addEventListener("click", (e) => {
    if (e.target === recipeModal) recipeModal.classList.add("hidden");
  });
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
  tagsContainer.innerHTML = userIngredients
    .map(
      (ing, index) => `
    <span class="tag">
      ${ing}
      <button type="button" class="tag-remove" onclick="removeIngredient(${index})">×</button>
    </span>
  `
    )
    .join("");
}

// Appel de l'API Gemini
async function fetchRecipesFromGemini() {
  const recipesTitle = document.getElementById("recipesTitle");
  const recipesList = document.getElementById("recipesList");

  if (userIngredients.length === 0) {
    recipesTitle.textContent = "Recettes (0)";
    recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Veuillez ajouter au moins un ingrédient.</p>";
    return;
  }

  recipesTitle.textContent = "Recherche Gemini...";
  recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Génération des meilleures recettes adaptées...</p>";

  const prompt = `Génère 4 recettes simples et variées en français utilisant au maximum ces ingrédients : ${userIngredients.join(", ")}. 
  Mode de cuisson souhaité : ${selectedMode}. 
  Réponds EXCLUSIVEMENT sous la forme d'un tableau JSON valide, sans balises markdown explicatives ni texte autour.
  Format attendu :
  [
    {
      "id": 1,
      "title": "Nom de la recette",
      "prepTime": "15 min",
      "ingredients": ["ingrédient 1", "ingrédient 2"],
      "steps": ["Étape 1", "Étape 2"]
    }
  ]`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    let rawText = data.candidates[0].content.parts[0].text;
    
    // Nettoyage au cas où Gemini ajoute des balises ```json
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    generatedRecipes = JSON.parse(rawText);

    renderRecipes(generatedRecipes);
  } catch (error) {
    console.error("Erreur Gemini API :", error);
    recipesTitle.textContent = "Erreur";
    recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #d9534f;'>Erreur lors de la génération. Vérifiez votre clé API Gemini.</p>";
  }
}

function renderRecipes(recipes) {
  const recipesTitle = document.getElementById("recipesTitle");
  const recipesList = document.getElementById("recipesList");

  recipesTitle.textContent = `Recettes (${recipes.length})`;

  recipesList.innerHTML = recipes
    .map((r, index) => `
      <div class="recipe-card" onclick="openRecipeModal(${index})">
        <div class="recipe-info">
          <h3 class="recipe-title">${r.title}</h3>
          <div class="recipe-meta">
            <span>Mode : ${selectedMode.toUpperCase()} | Temps : ${r.prepTime}</span>
          </div>
        </div>
      </div>
    `)
    .join("");
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
    `)
    .join("");

  recipeModal.classList.remove("hidden");
                                                                   }
