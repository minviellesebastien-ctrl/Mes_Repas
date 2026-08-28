// ============================================================
// CONFIGURATION SPOONACULAR
// ============================================================

const SPOONACULAR_API_KEY = "52cccdb1ed664d629040a66d50b5a520";

let userIngredients = [];
let selectedMode = "simple";
let generatedRecipes = [];


// ============================================================
// INITIALISATION
// ============================================================

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

  // Ajouter un ingrédient
  if (addBtn) {
    addBtn.addEventListener("click", addIngredient);
  }

  if (ingredientInput) {
    ingredientInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        addIngredient();
      }
    });
  }

  // Recherche
  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {

      await generateRecipes();

      showScreen(resultsScreen, mainScreen);
    });
  }

  // Retour
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      showScreen(mainScreen, resultsScreen);
    });
  }

  // Modes de cuisson
  document.querySelectorAll(".cooking-btn").forEach((btn) => {

    btn.addEventListener("click", (e) => {

      document
        .querySelectorAll(".cooking-btn")
        .forEach((b) => b.classList.remove("active"));

      const target = e.currentTarget;

      target.classList.add("active");

      selectedMode = target.dataset.mode;
    });

  });

  // Modal semaine
  if (openSemaineBtn) {
    openSemaineBtn.addEventListener("click", () => {
      semaineModal.classList.remove("hidden");
    });
  }

  if (closeSemaineBtn) {
    closeSemaineBtn.addEventListener("click", () => {
      semaineModal.classList.add("hidden");
    });
  }

  // Modal liste
  if (openListeBtn) {
    openListeBtn.addEventListener("click", () => {
      listeModal.classList.remove("hidden");
    });
  }

  if (closeListeBtn) {
    closeListeBtn.addEventListener("click", () => {
      listeModal.classList.add("hidden");
    });
  }

  // Modal recette
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      recipeModal.classList.add("hidden");
    });
  }

});


// ============================================================
// CHANGEMENT D'ÉCRAN
// ============================================================

function showScreen(screenToShow, screenToHide) {

  screenToHide.classList.remove("active-screen");

  screenToShow.classList.add("active-screen");

}


// ============================================================
// INGREDIENTS
// ============================================================

function addIngredient() {

  const input = document.getElementById("ingredientInput");

  const value = input.value.trim().toLowerCase();

  if (!value) return;

  if (!userIngredients.includes(value)) {

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

  const tagsContainer =
    document.getElementById("tagsContainer");

  if (!tagsContainer) return;

  tagsContainer.innerHTML = "";

  userIngredients.forEach((ing, index) => {

    const tag = document.createElement("span");

    tag.className = "tag";

    tag.textContent = ing + " ";

    const removeBtn =
      document.createElement("button");

    removeBtn.type = "button";

    removeBtn.className = "tag-remove";

    removeBtn.textContent = "×";

    removeBtn.addEventListener("click", () => {

      removeIngredient(index);

    });

    tag.appendChild(removeBtn);

    tagsContainer.appendChild(tag);

  });

}


// ============================================================
// SPOONACULAR
// ============================================================

async function generateRecipes() {

  const recipesTitle =
    document.getElementById("recipesTitle");

  const recipesList =
    document.getElementById("recipesList");


  // Aucun ingrédient
  if (userIngredients.length === 0) {

    recipesTitle.textContent = "Recettes (0)";

    recipesList.innerHTML =
      "<p style='font-size:0.85rem;color:#62826c;'>Veuillez ajouter au moins un ingrédient.</p>";

    return;

  }


  recipesList.innerHTML =
    "<p style='font-size:0.85rem;color:#62826c;'>Recherche de recettes en cours...</p>";


  try {

    const params = new URLSearchParams();

    params.set("apiKey", SPOONACULAR_API_KEY);

    params.set(
      "includeIngredients",
      userIngredients.join(",")
    );

    params.set("number", "9");

    params.set("language", "fr");

    params.set("addRecipeInformation", "true");

    params.set("fillIngredients", "true");

    params.set("instructionsRequired", "true");


    // --------------------------------------------------------
    // MODE DE CUISSON
    // --------------------------------------------------------

    if (selectedMode === "simple") {

      // Poêle / four
      params.set(
        "equipment",
        "pan,oven"
      );

    }

    else if (selectedMode === "airfryer") {

      params.set(
        "equipment",
        "air fryer"
      );

    }

    /*
      Cookeo :
      Spoonacular ne possède pas de filtre "Cookeo".
      On récupère donc les recettes puis on les filtre
      côté JavaScript grâce aux équipements/instructions.
    */

    else if (selectedMode === "cookeo") {

      params.set(
        "equipment",
        "pressure cooker"
      );

    }

    /*
      Sans cuisson :
      pas de filtre equipment.
      Le filtrage se fera après réception des résultats.
    */


    const url =
      `https://api.spoonacular.com/recipes/complexSearch?${params.toString()}`;


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        `Erreur Spoonacular : ${response.status}`
      );

    }


    const data =
      await response.json();


    let recipes =
      data.results || [];


    // --------------------------------------------------------
    // FILTRE SANS CUISSON
    // --------------------------------------------------------

    if (selectedMode === "sans-cuisson") {

      recipes = recipes.filter(recipe => {

        const text = (
          (recipe.summary || "") +
          " " +
          (recipe.instructions || "")
        ).toLowerCase();


        const cookingWords = [
          "cuire",
          "cuisson",
          "four",
          "poêle",
          "frire",
          "faire chauffer",
          "bouillir",
          "mijoter",
          "griller",
          "rôtir",
          "bake",
          "cook",
          "fry",
          "boil",
          "roast",
          "grill"
        ];


        return !cookingWords.some(word =>
          text.includes(word)
        );

      });

    }


    // --------------------------------------------------------
    // TRANSFORMATION DES RECETTES
    // --------------------------------------------------------

    generatedRecipes = recipes.map(recipe => {

      const ingredients =
        (recipe.extendedIngredients || []).map(
          ing => {

            const amount =
              ing.amount
                ? `${ing.amount} ${ing.unit || ""}`
                : "";

            return `${amount} ${ing.name}`
              .trim();

          }
        );


      const steps =
        extractSteps(recipe);


      return {

        id: recipe.id,

        title:
          recipe.title || "Recette sans nom",

        image:
          recipe.image || "",

        prepTime:
          recipe.readyInMinutes
            ? `${recipe.readyInMinutes} min`
            : "Temps non indiqué",

        ingredients,

        steps,

        usedIngredientCount:
          recipe.usedIngredientCount || 0,

        missedIngredientCount:
          recipe.missedIngredientCount || 0,

        sourceUrl:
          recipe.sourceUrl || ""

      };

    });


    // --------------------------------------------------------
    // TRI
    // --------------------------------------------------------
    // On place en premier les recettes qui utilisent
    // le plus d'ingrédients sélectionnés.

    generatedRecipes.sort((a, b) => {

      if (
        b.usedIngredientCount !==
        a.usedIngredientCount
      ) {

        return (
          b.usedIngredientCount -
          a.usedIngredientCount
        );

      }

      return (
        a.missedIngredientCount -
        b.missedIngredientCount
      );

    });


    // --------------------------------------------------------
    // AFFICHAGE
    // --------------------------------------------------------

    if (generatedRecipes.length === 0) {

      recipesTitle.textContent =
        "Recettes (0)";

      recipesList.innerHTML =
        "<p style='font-size:0.85rem;color:#62826c;'>Aucune recette trouvée pour cette combinaison d'ingrédients et ce mode de cuisson.</p>";

      return;

    }


    renderRecipes(generatedRecipes);


  } catch (error) {

    console.error(
      "Erreur Spoonacular :",
      error
    );


    recipesTitle.textContent =
      "Recettes (0)";


    recipesList.innerHTML =
      "<p style='font-size:0.85rem;color:#62826c;'>Impossible de récupérer les recettes. Vérifiez votre connexion ou votre clé API Spoonacular.</p>";

  }

}


// ============================================================
// EXTRACTION DES ÉTAPES
// ============================================================

function extractSteps(recipe) {

  if (
    recipe.analyzedInstructions &&
    recipe.analyzedInstructions.length > 0
  ) {

    const steps = [];

    recipe.analyzedInstructions.forEach(section => {

      if (!section.steps) return;

      section.steps.forEach(step => {

        if (step.step) {

          steps.push(step.step);

        }

      });

    });

    if (steps.length > 0) {

      return steps;

    }

  }


  // Secours si Spoonacular renvoie seulement
  // les instructions sous forme de texte.

  if (recipe.instructions) {

    const clean =
      recipe.instructions
        .replace(/<[^>]*>/g, "")
        .trim();


    if (clean) {

      return clean
        .split(/\.(?=\s|$)/)
        .map(step => step.trim())
        .filter(step => step.length > 0)
        .map(step => step.endsWith(".")
          ? step
          : step + "."
        );

    }

  }


  return [
    "Les instructions détaillées ne sont pas disponibles."
  ];

}


// ============================================================
// AFFICHAGE DES RECETTES
// ============================================================

function renderRecipes(recipes) {

  const recipesTitle =
    document.getElementById("recipesTitle");

  const recipesList =
    document.getElementById("recipesList");


  recipesTitle.textContent =
    `Recettes (${recipes.length})`;


  recipesList.innerHTML = "";


  recipes.forEach((r, index) => {

    const card =
      document.createElement("div");


    card.className =
      "recipe-card";


    const available =
      r.usedIngredientCount || 0;

    const missing =
      r.missedIngredientCount || 0;


    card.innerHTML = `

      ${r.image ? `
        <img
          src="${r.image}"
          alt=""
          class="recipe-image"
        >
      ` : ""}

      <div class="recipe-info">

        <h3 class="recipe-title">
          ${escapeHTML(r.title)}
        </h3>

        <div class="recipe-meta">

          <span>
            ${getModeLabel(selectedMode)}
          </span>

          <span>
            ${r.prepTime}
          </span>

        </div>

        <div class="recipe-ingredients-status">

          <span>
            ✓ ${available} disponible${available > 1 ? "s" : ""}
          </span>

          ${
            missing > 0
              ? `<span>• ${missing} manquant${missing > 1 ? "s" : ""}</span>`
              : `<span>• Tout est disponible</span>`
          }

        </div>

      </div>

    `;


    card.addEventListener(
      "click",
      () => openRecipeModal(index)
    );


    recipesList.appendChild(card);

  });

}


// ============================================================
// FICHE RECETTE
// ============================================================

function openRecipeModal(index) {

  const recipeModal =
    document.getElementById("recipeModal");

  const meal =
    generatedRecipes[index];


  if (!meal) return;


  document.getElementById(
    "modalTitle"
  ).textContent = meal.title;


  document.getElementById(
    "modalMeta"
  ).textContent =
    `${getModeLabel(selectedMode)} | ${meal.prepTime}`;


  document.getElementById(
    "modalIngredients"
  ).innerHTML = meal.ingredients

    .map(
      ing => `
        <li style="padding:4px 0;font-size:0.85rem;">
          • ${escapeHTML(ing)}
        </li>
      `
    )

    .join("");


  document.getElementById(
    "modalSteps"
  ).innerHTML = meal.steps

    .map(
      (step, idx) => `

        <li
          style="
            margin-bottom:8px;
            font-size:0.85rem;
          "
        >

          <strong
            style="color:var(--primary-green);"
          >
            ${idx + 1}.
          </strong>

          ${escapeHTML(step)}

        </li>

      `
    )

    .join("");


  recipeModal.classList.remove("hidden");

}


// ============================================================
// LIBELLÉS DES MODES
// ============================================================

function getModeLabel(mode) {

  switch (mode) {

    case "simple":
      return "🍳 Poêle / Four";

    case "cookeo":
      return "🫕 Cookeo";

    case "airfryer":
      return "🌬️ Airfryer";

    case "sans-cuisson":
      return "🥗 Sans cuisson";

    default:
      return "🍳 Cuisine";

  }

}


// ============================================================
// SÉCURITÉ AFFICHAGE HTML
// ============================================================

function escapeHTML(value) {

  if (!value) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
