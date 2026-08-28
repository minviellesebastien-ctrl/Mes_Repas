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
      await generateRecipesWithIA();
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

async function generateRecipesWithIA() {
  const recipesTitle = document.getElementById("recipesTitle");
  const recipesList = document.getElementById("recipesList");

  if (userIngredients.length === 0) {
    recipesTitle.textContent = "Recettes (0)";
    recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Veuillez ajouter au moins un ingrédient.</p>";
    return;
  }

  recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Génération rapide des recettes en cours...</p>";

  const prompt = `Crée 3 recettes en français pour cuisson "${selectedMode}" avec : ${userIngredients.join(", ")}.
Format JSON attendu :
[{"title":"Nom de la recette","prepTime":"15 min","ingredients":["ingrédient 1","ingrédient 2"],"steps":["étape 1","étape 2"]}]`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // Seuil de 4 secondes

    const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    let rawText = await response.text();
    const firstBracket = rawText.indexOf("[");
    const lastBracket = rawText.lastIndexOf("]");

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const jsonString = rawText.substring(firstBracket, lastBracket + 1);
      generatedRecipes = JSON.parse(jsonString);
      renderRecipes(generatedRecipes);
    } else {
      throw new Error("Format invalide");
    }
  } catch (err) {
    // Si l'IA met trop de temps ou échoue, création dynamique immédiate
    createDynamicRecipes();
  }
}

// Génération dynamique immédiate sans délai
function createDynamicRecipes() {
  const ings = userIngredients.join(", ");
  const modeLabel = selectedMode.toUpperCase();

  generatedRecipes = [
    {
      title: `Poêlée / Plat maison au ${userIngredients[0] || 'légumes'}`,
      prepTime: "15 min",
      ingredients: userIngredients.concat(["Huile d'olive", "Assaisonnement au choix"]),
      steps: [
        `Préparer et découper les ingrédients (${ings}).`,
        `Faire chauffer votre équipement adapté à la cuisson ${modeLabel}.`,
        `Cuire l'ensemble pendant 10 à 15 minutes à feu moyen.`,
        "Assaisonner à votre convenance et servir bien chaud."
      ]
    },
    {
      title: `Mijoté gourmand aux ${userIngredients[1] || userIngredients[0] || 'épices'}`,
      prepTime: "20 min",
      ingredients: userIngredients.concat(["Fond de bouillon", "Herbes aromatiques"]),
      steps: [
        `Disposer l'ensemble des éléments (${ings}) dans votre récipient.`,
        "Ajouter le bouillon et les herbes aromatiques.",
        `Lancer la cuisson adaptée au mode ${modeLabel}.`,
        "Déguster dès que la sauce est bien réduite."
      ]
    },
    {
      title: `Composition express (${modeLabel})`,
      prepTime: "10 min",
      ingredients: userIngredients.concat(["Sauce ou marinade"]),
      steps: [
        "Émincer finement tous vos ingrédients.",
        "Mélanger avec votre marinade ou sauce préférée.",
        `Effectuer une cuisson rapide selon le mode ${modeLabel}.`
      ]
    }
  ];

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
