let userIngredients = [];
let selectedMode = "simple";
let generatedRecipes = [];

// Base de données locale complète pour garantir de la diversité sur mobile
const localRecipesDB = {
  simple: [
    {
      title: "Poêlée sautée aux légumes et protéines",
      prepTime: "15 min",
      getIngredients: (ings) => ings.concat(["Huile d'olive", "Ail", "Sel", "Poivre"]),
      steps: [
        "Émincer finement tous les ingrédients.",
        "Faire chauffer une poêle avec de l'huile d'olive et l'ail.",
        "Saisir les ingrédients principaux à feu vif pendant 8 à 10 minutes.",
        "Assaisonner avec le sel et le poivre puis servir chaud."
      ]
    },
    {
      title: "Gratin rapide au four",
      prepTime: "30 min",
      getIngredients: (ings) => ings.concat(["Crème fraîche", "Fromage râpé", "Herbes de Provence"]),
      steps: [
        "Préchauffer le four à 200°C.",
        "Couper les ingrédients en morceaux et les disposer dans un plat à gratin.",
        "Napper de crème fraîche et recouvrir de fromage râpé.",
        "Enfourner pendant 20 minutes jusqu'à ce que le dessus soit bien doré."
      ]
    },
    {
      title: "Omelette paysanne garnie",
      prepTime: "10 min",
      getIngredients: (ings) => ings.concat(["Œufs", "Beurre", "Ciboulette"]),
      steps: [
        "Battre les œufs dans un bol avec du sel et du poivre.",
        "Faire revenir vos ingrédients dans une poêle beurrée pendant 5 minutes.",
        "Verser les œufs battus par-dessus et cuire à feu doux selon votre goût."
      ]
    }
  ],
  cookeo: [
    {
      title: "Mijoté express au Cookeo",
      prepTime: "15 min",
      getIngredients: (ings) => ings.concat(["Bouillon de volaille", "Oignon", "Huile"]),
      steps: [
        "Activer le mode 'Dorer' du Cookeo.",
        "Faire revenir l'oignon et vos ingrédients dans un filet d'huile pendant 4 minutes.",
        "Ajouter 200ml de bouillon de volaille.",
        "Lancer la cuisson sous pression (ou cuisson rapide) pendant 10 minutes."
      ]
    },
    {
      title: "Risotto crémeux Cookeo",
      prepTime: "18 min",
      getIngredients: (ings) => ings.concat(["Riz à risotto", "Bouillon de légumes", "Parmesan"]),
      steps: [
        "En mode 'Dorer', faire revenir les ingrédients avec le riz jusqu'à ce qu'il devienne translucide.",
        "Verser le bouillon à hauteur.",
        "Passer en cuisson sous pression pendant 12 minutes.",
        "Incorporer le parmesan avant de servir."
      ]
    },
    {
      title: "Curry fondant Cookeo",
      prepTime: "12 min",
      getIngredients: (ings) => ings.concat(["Lait de coco", "Pâte de curry", "Oignon"]),
      steps: [
        "Faire dorer les ingrédients avec la pâte de curry pendant 3 minutes.",
        "Ajouter le lait de coco et bien mélanger.",
        "Cuire sous pression pendant 8 minutes."
      ]
    }
  ],
  airfryer: [
    {
      title: "Croustillant maison Air Fryer",
      prepTime: "12 min",
      getIngredients: (ings) => ings.concat(["Épices au choix", "1 c.à.s d'huile"]),
      steps: [
        "Mélanger vos ingrédients dans un saladier avec une cuillère d'huile et les épices.",
        "Placer le tout dans le panier du Air Fryer.",
        "Cuire à 180°C pendant 12 à 15 minutes en secouant le panier à mi-cuisson."
      ]
    },
    {
      title: "Rôti gourmand Air Fryer",
      prepTime: "20 min",
      getIngredients: (ings) => ings.concat(["Herbes de Provence", "Ail en poudre"]),
      steps: [
        "Badigeonner les ingrédients d'un filet d'huile et d'assaisonnement.",
        "Préchauffer le Air Fryer à 190°C.",
        "Disposer les ingrédients dans la cuve sans les chevaucher.",
        "Laisser cuire 18 à 20 minutes jusqu'à obtenir une texture dorée."
      ]
    },
    {
      title: "Bouchées dorées au Air Fryer",
      prepTime: "10 min",
      getIngredients: (ings) => ings.concat(["Chapelure", "Œuf"]),
      steps: [
        "Enrober les morceaux d'ingrédients dans l'œuf battu puis dans la chapelure.",
        "Disposer dans le tiroir du Air Fryer.",
        "Lancer la cuisson à 200°C pendant 8 à 10 minutes."
      ]
    }
  ],
  raw: [
    {
      title: "Salade fraîcheur croquante",
      prepTime: "10 min",
      getIngredients: (ings) => ings.concat(["Vinaigrette", "Graines de tournesol"]),
      steps: [
        "Laver et couper soigneusement tous les ingrédients.",
        "Les mélanger dans un grand saladier.",
        "Ajouter la vinaigrette et parsemer de graines avant de servir bien frais."
      ]
    },
    {
      title: "Tartare / Bowl composé",
      prepTime: "12 min",
      getIngredients: (ings) => ings.concat(["Jus de citron", "Huile de sésame", "Sauce soja"]),
      steps: [
        "Tailler les ingrédients en très petits dés régulièrement.",
        "Assaisonner avec le jus de citron, l'huile de sésame et la sauce soja.",
        "Mettre au frais 15 minutes avant de déguster."
      ]
    },
    {
      title: "Wrap fraîcheur sans cuisson",
      prepTime: "8 min",
      getIngredients: (ings) => ings.concat(["Galettes de tortilla", "Fromage frais"]),
      steps: [
        "Tartiner les galettes de fromage frais.",
        "Répartir vos ingrédients émincés sur toute la surface.",
        "Rouler serré et couper en tronçons."
      ]
    }
  ]
};

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
      await generateRecipes();
      showScreen(resultsScreen, mainScreen);
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      showScreen(mainScreen, resultsScreen);
    });
  }

  // Changement dynamique du mode de cuisson
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

// Génération de recettes sur-mesure selon le mode et les ingrédients
async function generateRecipes() {
  const recipesTitle = document.getElementById("recipesTitle");
  const recipesList = document.getElementById("recipesList");

  if (userIngredients.length === 0) {
    recipesTitle.textContent = "Recettes (0)";
    recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Veuillez ajouter au moins un ingrédient.</p>";
    return;
  }

  recipesList.innerHTML = "<p style='font-size: 0.85rem; color: #62826c;'>Recherche de recettes...</p>";

  // Récupère la liste spécifique au mode de cuisson sélectionné
  const modeTemplates = localRecipesDB[selectedMode] || localRecipesDB.simple;
  const mainIngList = userIngredients.join(", ");

  generatedRecipes = modeTemplates.map((template) => {
    return {
      title: `${template.title} (${userIngredients[0] || ''})`,
      prepTime: template.prepTime,
      ingredients: template.getIngredients(userIngredients),
      steps: template.steps
    };
  });

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
