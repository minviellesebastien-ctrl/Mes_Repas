let userIngredients = ["poulet", "riz"];
let selectedMode = "cookeo";
let generatedRecipes = [];

const COOKING_TECHNIQUES = {
  cookeo: {
    label: "Cookeo",
    time: "12 min",
    verbs: ["Faire dorer", "Cuire sous pression", "Mélanger avec le mode dorage"],
    steps: [
      "Mettre le Cookeo en mode dorer et faire revenir les ingrédients principaux avec un filet d'huile pendant 3 minutes.",
      "Ajouter 150 ml d'eau ou de bouillon ainsi que le reste de la garniture.",
      "Lancer la cuisson sous pression pour 8 minutes.",
      "Mélanger, ajuster l'assaisonnement et servir chaud."
    ]
  },
  airfryer: {
    label: "Air Fryer",
    time: "18 min",
    verbs: ["Rôtir à l'air chaud", "Dorer", "Casseroler à 180°C"],
    steps: [
      "Préchauffer l'Air Fryer à 180°C pendant 3 minutes.",
      "Couper les ingrédients en morceaux homogènes et les mélanger avec une cuillère d'huile et des épices.",
      "Placer dans le panier en une seule couche pour assurer un croustillant optimal.",
      "Cuire pendant 15 minutes en secouant le panier à mi-cuisson."
    ]
  },
  simple: {
    label: "Cuisson simple",
    time: "20 min",
    verbs: ["Faire poêler", "Saisir", "Mijoter"],
    steps: [
      "Faire chauffer une poêle ou une casserole à feu moyen avec un corps gras.",
      "Saisir les éléments principaux pendant 5 minutes jusqu'à ce qu'ils soient bien dorés.",
      "Baisser le feu, ajouter les condiments et laisser mijoter à couvert pendant 12 minutes.",
      "Vérifier la cuisson et servir immédiatement."
    ]
  },
  raw: {
    label: "Sans cuisson",
    time: "10 min",
    verbs: ["Trancher", "Assaisonner", "Assembler"],
    steps: [
      "Laver et découper soigneusement tous les ingrédients en dés ou en fines lanières.",
      "Préparer une vinaigrette ou une sauce d'accompagnement légère.",
      "Mélanger le tout dans un grand saladier.",
      "Laisser reposer 5 minutes au frais avant de déguster."
    ]
  }
};

const RECIPE_STYLES = [
  { prefix: "Poêlée gourmande de", suffix: "façon bistro" },
  { prefix: "Bol complet au", suffix: "et ses condiments" },
  { prefix: "Gratin rapide de", suffix: "aux herbes" },
  { prefix: "Décliné de", suffix: "sauce maison" },
  { prefix: "Sauté express de", suffix: "épices d'Orient" },
  { prefix: "Salade fraîche de", suffix: "et sa touche croquante" }
];

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

  // Changement d'Écran & Génération
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      generateDynamicRecipes();
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

  // Navigation du bas : Ma Semaine & Ma Liste
  if (openSemaineBtn) openSemaineBtn.addEventListener("click", () => semaineModal.classList.remove("hidden"));
  if (closeSemaineBtn) closeSemaineBtn.addEventListener("click", () => semaineModal.classList.add("hidden"));
  if (semaineModal) {
    semaineModal.addEventListener("click", (e) => {
      if (e.target === semaineModal) semaineModal.classList.add("hidden");
    });
  }

  if (openListeBtn) openListeBtn.addEventListener("click", () => listeModal.classList.remove("hidden"));
  if (closeListeBtn) closeListeBtn.addEventListener("click", () => listeModal.classList.add("hidden"));
  if (listeModal) {
    listeModal.addEventListener("click", (e) => {
      if (e.target === listeModal) listeModal.classList.add("hidden");
    });
  }

  // Modale Détail de la Recette
  if (closeModalBtn) closeModalBtn.addEventListener("click", () => recipeModal.classList.add("hidden"));
  if (recipeModal) {
    recipeModal.addEventListener("click", (e) => {
      if (e.target === recipeModal) recipeModal.classList.add("hidden");
    });
  }
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

function generateDynamicRecipes() {
  const recipesTitle = document.getElementById("recipesTitle");
  const recipesList = document.getElementById("recipesList");

  if (userIngredients.length === 0) {
    recipesTitle.textContent = "Recettes (0)";
    recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Veuillez ajouter au moins un ingrédient.</p>";
    return;
  }

  const tech = COOKING_TECHNIQUES[selectedMode] || COOKING_TECHNIQUES.simple;
  generatedRecipes = [];

  for (let i = 0; i < 4; i++) {
    const style = RECIPE_STYLES[(i + userIngredients.length) % RECIPE_STYLES.length];
    const mainIng = userIngredients[i % userIngredients.length];
    const secIng = userIngredients[(i + 1) % userIngredients.length];

    let titleName = userIngredients.length === 1 
      ? `${style.prefix} ${mainIng} ${style.suffix}` 
      : `${style.prefix} ${mainIng} et ${secIng} ${style.suffix}`;

    titleName = titleName.charAt(0).toUpperCase() + titleName.slice(1);

    generatedRecipes.push({
      id: i,
      title: titleName,
      prepTime: tech.time,
      ingredients: [...userIngredients, "Sel, poivre & huile d'olive", "Épices au choix"],
      steps: tech.steps
    });
  }

  renderRecipes(generatedRecipes);
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
