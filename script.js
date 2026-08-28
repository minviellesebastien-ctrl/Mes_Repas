// Utilisation de TheMealDB (API totalement libre et gratuite)
let userIngredients = ["chicken", "rice"];
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

  // Sélecteur de mode de cuisson
  document.querySelectorAll(".cooking-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".cooking-btn").forEach((b) => b.classList.remove("active"));
      const target = e.currentTarget;
      target.classList.add("active");
      selectedMode = target.dataset.mode;
    });
  });

  // Fermeture des modales
  closeModalBtn.addEventListener("click", () => recipeModal.classList.add("hidden"));
  recipeModal.addEventListener("click", (e) => {
    if (e.target === recipeModal) recipeModal.classList.add("hidden");
  });

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

// Recherche via TheMealDB (Recherche par ingrédient principal)
async function fetchRecipesFromAPI() {
  if (userIngredients.length === 0) {
    alert("Veuillez ajouter au moins un ingrédient.");
    return;
  }

  recipesTitle.textContent = "Recherche en cours...";
  recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Recherche des meilleures recettes...</p>";

  const mainIngredient = userIngredients[0];
  const url = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${mainIngredient}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.meals) {
      recipesTitle.textContent = "Recettes disponibles (0)";
      recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Aucune recette trouvée avec cet ingrédient.</p>";
      return;
    }

    renderRecipes(data.meals.slice(0, 10));
  } catch (error) {
    console.error("Erreur API :", error);
    recipesTitle.textContent = "Erreur";
    recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #d9534f;'>Impossible de contacter le service de recettes.</p>";
  }
}

function renderRecipes(meals) {
  recipesTitle.textContent = `Recettes disponibles (${meals.length})`;

  recipesList.innerHTML = meals
    .map((m) => `
      <div class="recipe-card" onclick="fetchRecipeDetails('${m.idMeal}')">
        <img src="${m.strMealThumb}" alt="${m.strMeal}" class="recipe-image" />
        <div class="recipe-info">
          <h3 class="recipe-title">${m.strMeal}</h3>
          <div class="recipe-meta">
            <span>Mode : ${selectedMode.toUpperCase()}</span>
          </div>
        </div>
      </div>
    `)
    .join("");
}

// Récupération des détails (ingrédients + instructions)
async function fetchRecipeDetails(mealId) {
  const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const meal = data.meals[0];

    document.getElementById("modalTitle").textContent = meal.strMeal;
    document.getElementById("modalMeta").textContent = `Origine : ${meal.strArea} | Catégorie : ${meal.strCategory}`;

    // Extrait dynamiquement jusqu'à 20 ingrédients de l'API
    let ingredientsListHTML = "";
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim() !== "") {
        ingredientsListHTML += `<li class="ingredient-item" style="padding: 4px 0; font-size:0.85rem;">• <strong>${ingredient}</strong> ${measure ? `(${measure})` : ""}</li>`;
      }
    }
    document.getElementById("modalIngredients").innerHTML = ingredientsListHTML;

    // Découpage des instructions en étapes
    const steps = meal.strInstructions.split("\r\n").filter((step) => step.trim() !== "");
    document.getElementById("modalSteps").innerHTML = steps
      .map((s, idx) => `
        <li class="step-item" style="margin-bottom: 8px; font-size: 0.85rem;">
          <strong style="color: var(--primary-green);">${idx + 1}.</strong> ${s}
        </li>
      `)
      .join("");

    recipeModal.classList.remove("hidden");
  } catch (error) {
    console.error("Erreur détails :", error);
  }
}
