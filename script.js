const API_KEY = "VOTRE_CLE_API";

let userIngredients = ["poulet", "riz", "tomate"];
let selectedMode = "cookeo";

// Éléments DOM
const ingredientInput = document.getElementById("ingredientInput");
const addBtn = document.getElementById("addBtn");
const searchBtn = document.getElementById("searchBtn");
const tagsContainer = document.getElementById("tagsContainer");
const recipesList = document.getElementById("recipesList");
const recipesTitle = document.getElementById("recipesTitle");

// Modales
const recipeModal = document.getElementById("recipeModal");
const closeModalBtn = document.getElementById("closeModalBtn");

const semaineModal = document.getElementById("semaineModal");
const openSemaineBtn = document.getElementById("openSemaineBtn");
const closeSemaineBtn = document.getElementById("closeSemaineBtn");

const listeModal = document.getElementById("listeModal");
const openListeBtn = document.getElementById("openListeBtn");
const closeListeBtn = document.getElementById("closeListeBtn");

document.addEventListener("DOMContentLoaded", () => {
  renderTags();

  addBtn.addEventListener("click", addIngredient);
  ingredientInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") addIngredient();
  });

  searchBtn.addEventListener("click", fetchRecipesFromAPI);

  // Sélecteur mode de cuisson
  document.querySelectorAll(".cooking-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".cooking-btn").forEach((b) => b.classList.remove("active"));
      const target = e.currentTarget;
      target.classList.add("active");
      selectedMode = target.dataset.mode;
    });
  });

  // Gestion de la modale Recette
  closeModalBtn.addEventListener("click", () => recipeModal.classList.add("hidden"));
  recipeModal.addEventListener("click", (e) => {
    if (e.target === recipeModal) recipeModal.classList.add("hidden");
  });

  // Gestion des modales du bas (Semaine / Liste)
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
});

function addIngredient() {
  const value = ingredientInput.value.trim().toLowerCase();
  if (value && !userIngredients.includes(value)) {
    userIngredients.push(value);
    ingredientInput.value = "";
    renderTags();
  }
}

function removeIngredient(index) {
  userIngredients.splice(index, 1);
  renderTags();
}

function renderTags() {
  tagsContainer.innerHTML = userIngredients
    .map(
      (ing, index) => `
    <span class="tag">
      ${ing}
      <button class="tag-remove" onclick="removeIngredient(${index})">×</button>
    </span>
  `
    )
    .join("");
}

async function fetchRecipesFromAPI() {
  if (userIngredients.length === 0) {
    alert("Veuillez ajouter au moins un ingrédient.");
    return;
  }

  recipesTitle.textContent = "Recherche en cours...";
  recipesList.innerHTML = "<p>Chargement des recettes...</p>";

  const ingredientsQuery = userIngredients.join(",");
  const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientsQuery}&number=6&apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data || data.length === 0) {
      recipesTitle.textContent = "Recettes disponibles (0)";
      recipesList.innerHTML = "<p>Aucune recette trouvée avec ces ingrédients.</p>";
      return;
    }

    renderRecipes(data);
  } catch (error) {
    console.error("Erreur API :", error);
    recipesTitle.textContent = "Erreur";
    recipesList.innerHTML = "<p>Impossible de charger les recettes. Vérifiez votre clé API.</p>";
  }
}

function renderRecipes(recipes) {
  recipesTitle.textContent = `Recettes disponibles (${recipes.length})`;

  recipesList.innerHTML = recipes
    .map((r) => `
      <div class="recipe-card" onclick="fetchRecipeDetails(${r.id})">
        <img src="${r.image}" alt="${r.title}" class="recipe-image" />
        <div class="recipe-info">
          <h3 class="recipe-title">${r.title}</h3>
          <div class="recipe-meta">
            <span>Ingrédients utilisés : ${r.usedIngredientCount}</span>
            <span>Manquants : ${r.missedIngredientCount}</span>
          </div>
        </div>
      </div>
    `)
    .join("");
}

async function fetchRecipeDetails(recipeId) {
  const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const recipe = await response.json();

    document.getElementById("modalTitle").textContent = recipe.title;
    document.getElementById("modalMeta").innerHTML = `
      <span>⏱️ ${recipe.readyInMinutes} min</span>
      <span>👤 ${recipe.servings} pers.</span>
    `;

    document.getElementById("modalIngredients").innerHTML = recipe.extendedIngredients
      .map((i) => `<li class="ingredient-item"><strong>${i.original}</strong></li>`)
      .join("");

    const steps = recipe.analyzedInstructions[0]?.steps || [];
    document.getElementById("modalSteps").innerHTML = steps.length > 0
      ? steps.map((s, idx) => `
        <li class="step-item">
          <span class="step-number">${idx + 1}</span>
          <span>${s.step}</span>
        </li>
      `).join("")
      : "<li>Aucune étape détaillée disponible.</li>";

    recipeModal.classList.remove("hidden");
  } catch (error) {
    console.error("Erreur lors de la récupération du détail :", error);
  }
      }
