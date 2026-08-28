// ============================================================
// CONFIGURATION SPOONACULAR
// ============================================================

const SPOONACULAR_API_KEY = "52cccdb1ed664d629040a66d50b5a520";

fetch(`https://api.spoonacular.com/recipes/findByIngredients?apiKey=${SPOONACULAR_API_KEY}&ingredients=chicken&number=1`)
  .then(async response => {
    const text = await response.text();

    alert(
      "Spoonacular\n\n" +
      "Code : " + response.status +
      "\n\n" +
      text.substring(0, 500)
    );
  })
  .catch(error => {
    alert(
      "Erreur connexion :\n\n" +
      error.message
    );
  });

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

  const ingredientInput =
    document.getElementById("ingredientInput");

  const addBtn =
    document.getElementById("addBtn");

  const searchBtn =
    document.getElementById("searchBtn");

  const recipeModal =
    document.getElementById("recipeModal");

  const closeModalBtn =
    document.getElementById("closeModalBtn");

  const semaineModal =
    document.getElementById("semaineModal");

  const openSemaineBtn =
    document.getElementById("openSemaineBtn");

  const closeSemaineBtn =
    document.getElementById("closeSemaineBtn");

  const listeModal =
    document.getElementById("listeModal");

  const openListeBtn =
    document.getElementById("openListeBtn");

  const closeListeBtn =
    document.getElementById("closeListeBtn");


  // Affichage initial des ingrédients
  renderTags();


  // ==========================================================
  // AJOUT INGREDIENT
  // ==========================================================

  if (addBtn) {

    addBtn.addEventListener(
      "click",
      addIngredient
    );

  }


  if (ingredientInput) {

    ingredientInput.addEventListener(
      "keyup",
      (e) => {

        if (e.key === "Enter") {
          addIngredient();
        }

      }
    );

  }


  // ==========================================================
  // RECHERCHE
  // ==========================================================

  if (searchBtn) {

    searchBtn.addEventListener(
      "click",
      async () => {

        await generateRecipes();

        showScreen(
          resultsScreen,
          mainScreen
        );

      }
    );

  }


  // ==========================================================
  // RETOUR
  // ==========================================================

  if (backBtn) {

    backBtn.addEventListener(
      "click",
      () => {

        showScreen(
          mainScreen,
          resultsScreen
        );

      }
    );

  }


  // ==========================================================
  // MODES DE CUISSON
  // ==========================================================

  document
    .querySelectorAll(".cooking-btn")
    .forEach((btn) => {

      btn.addEventListener(
        "click",
        (e) => {

          document
            .querySelectorAll(".cooking-btn")
            .forEach((b) => {

              b.classList.remove("active");

            });


          const target =
            e.currentTarget;


          target.classList.add("active");


          selectedMode =
            target.dataset.mode;

        }
      );

    });


  // ==========================================================
  // MODALE MA SEMAINE
  // ==========================================================

  if (openSemaineBtn) {

    openSemaineBtn.addEventListener(
      "click",
      () => {

        semaineModal.classList.remove(
          "hidden"
        );

      }
    );

  }


  if (closeSemaineBtn) {

    closeSemaineBtn.addEventListener(
      "click",
      () => {

        semaineModal.classList.add(
          "hidden"
        );

      }
    );

  }


  // ==========================================================
  // MODALE MA LISTE
  // ==========================================================

  if (openListeBtn) {

    openListeBtn.addEventListener(
      "click",
      () => {

        listeModal.classList.remove(
          "hidden"
        );

      }
    );

  }


  if (closeListeBtn) {

    closeListeBtn.addEventListener(
      "click",
      () => {

        listeModal.classList.add(
          "hidden"
        );

      }
    );

  }


  // ==========================================================
  // MODALE RECETTE
  // ==========================================================

  if (closeModalBtn) {

    closeModalBtn.addEventListener(
      "click",
      () => {

        recipeModal.classList.add(
          "hidden"
        );

      }
    );

  }

});


// ============================================================
// CHANGEMENT D'ECRAN
// ============================================================

function showScreen(
  screenToShow,
  screenToHide
) {

  screenToHide.classList.remove(
    "active-screen"
  );

  screenToShow.classList.add(
    "active-screen"
  );

}


// ============================================================
// AJOUT D'UN INGREDIENT
// ============================================================

function addIngredient() {

  const input =
    document.getElementById(
      "ingredientInput"
    );


  const value =
    input.value
      .trim()
      .toLowerCase();


  if (!value) return;


  if (!userIngredients.includes(value)) {

    userIngredients.push(value);

    input.value = "";

    renderTags();

  }

}


// ============================================================
// SUPPRESSION D'UN INGREDIENT
// ============================================================

function removeIngredient(index) {

  userIngredients.splice(
    index,
    1
  );

  renderTags();

}


// ============================================================
// AFFICHAGE DES INGREDIENTS
// ============================================================

function renderTags() {

  const tagsContainer =
    document.getElementById(
      "tagsContainer"
    );


  if (!tagsContainer) return;


  tagsContainer.innerHTML = "";


  userIngredients.forEach(
    (ing, index) => {

      const tag =
        document.createElement(
          "span"
        );


      tag.className = "tag";


      tag.textContent =
        ing + " ";


      const removeBtn =
        document.createElement(
          "button"
        );


      removeBtn.type = "button";

      removeBtn.className =
        "tag-remove";

      removeBtn.textContent = "×";


      removeBtn.addEventListener(
        "click",
        () => {

          removeIngredient(index);

        }
      );


      tag.appendChild(
        removeBtn
      );


      tagsContainer.appendChild(
        tag
      );

    }
  );

}


// ============================================================
// RECHERCHE SPOONACULAR
// ============================================================

async function generateRecipes() {

  const recipesTitle =
    document.getElementById(
      "recipesTitle"
    );


  const recipesList =
    document.getElementById(
      "recipesList"
    );


  // ----------------------------------------------------------
  // VERIFICATION INGREDIENTS
  // ----------------------------------------------------------

  if (
    userIngredients.length === 0
  ) {

    recipesTitle.textContent =
      "Recettes (0)";


    recipesList.innerHTML =
      "<p style='font-size:0.85rem;color:#62826c;'>Veuillez ajouter au moins un ingrédient.</p>";


    return;

  }


  recipesList.innerHTML =
    "<p style='font-size:0.85rem;color:#62826c;'>Recherche de recettes en cours...</p>";


  try {

    // --------------------------------------------------------
    // RECHERCHE PAR INGREDIENTS
    // --------------------------------------------------------

    const params =
      new URLSearchParams();


    params.set(
      "apiKey",
      SPOONACULAR_API_KEY
    );


    params.set(
      "ingredients",
      userIngredients.join(",")
    );


    params.set(
      "number",
      "9"
    );


    params.set(
      "ranking",
      "1"
    );


    params.set(
      "ignorePantry",
      "true"
    );


    const url =
      `https://api.spoonacular.com/recipes/findByIngredients?${params.toString()}`;


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        `Erreur Spoonacular : ${response.status}`
      );

    }


    const data =
      await response.json();


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      recipesTitle.textContent =
        "Recettes (0)";


      recipesList.innerHTML =
        "<p style='font-size:0.85rem;color:#62826c;'>Aucune recette trouvée avec ces ingrédients.</p>";


      return;

    }


    // --------------------------------------------------------
    // DETAILS DES RECETTES
    // --------------------------------------------------------

    const detailedRecipes = [];


    for (const recipe of data) {

      try {

        const detailParams =
          new URLSearchParams();


        detailParams.set(
          "apiKey",
          SPOONACULAR_API_KEY
        );


        detailParams.set(
          "includeNutrition",
          "false"
        );


        const detailUrl =
          `https://api.spoonacular.com/recipes/${recipe.id}/information?${detailParams.toString()}`;


        const detailResponse =
          await fetch(detailUrl);


        if (!detailResponse.ok) {
          continue;
        }


        const details =
          await detailResponse.json();


        detailedRecipes.push({

          id:
            details.id,


          title:
            details.title ||
            "Recette sans nom",


          image:
            details.image ||
            "",


          prepTime:
            details.readyInMinutes
              ? `${details.readyInMinutes} min`
              : "Temps non indiqué",


          ingredients:
            (
              details.extendedIngredients ||
              []
            ).map(
              ing => {

                const amount =
                  ing.amount
                    ? `${ing.amount} ${ing.unit || ""}`
                    : "";


                return `${amount} ${ing.name}`
                  .trim();

              }
            ),


          steps:
            extractSteps(details),


          usedIngredientCount:
            recipe.usedIngredientCount ||
            0,


          missedIngredientCount:
            recipe.missedIngredientCount ||
            0,


          instructions:
            details.instructions ||
            "",


          equipment:
            getRecipeEquipment(
              details
            )

        });

      } catch (error) {

    console.error("Erreur Spoonacular :", error);

    recipesTitle.textContent = "Erreur Spoonacular";

    recipesList.innerHTML = `
      <div style="
        padding: 15px;
        font-size: 0.85rem;
        color: #62826c;
        line-height: 1.5;
      ">
        <strong>Impossible de récupérer les recettes.</strong>
        <br><br>
        ${escapeHTML(error.message)}
        <br><br>
        Vérifie ta clé API Spoonacular et ton quota.
      </div>
    `;

  }

    }


    // --------------------------------------------------------
    // FILTRE SANS CUISSON
    // --------------------------------------------------------

    let filteredRecipes =
      detailedRecipes;


    if (
      selectedMode ===
      "sans-cuisson"
    ) {

      filteredRecipes =
        detailedRecipes.filter(
          recipe => {

            const text = (

              recipe.instructions +

              " " +

              recipe.equipment.join(
                " "
              )

            ).toLowerCase();


            const cookingWords = [

              "four",
              "poêle",
              "frire",
              "cuire",
              "cuisson",
              "bouillir",
              "mijoter",
              "griller",
              "rôtir",

              "bake",
              "baking",
              "cook",
              "cooking",
              "fry",
              "boil",
              "roast",
              "grill",
              "oven",
              "pan"

            ];


            return !cookingWords.some(
              word =>
                text.includes(word)
            );

          }
        );

    }


    // --------------------------------------------------------
    // TRI
    // --------------------------------------------------------

    filteredRecipes.sort(
      (a, b) => {

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

      }
    );


    // --------------------------------------------------------
    // LIMITATION A 9 RESULTATS
    // --------------------------------------------------------

    generatedRecipes =
      filteredRecipes.slice(
        0,
        9
      );


    // --------------------------------------------------------
    // AUCUN RESULTAT APRES FILTRE
    // --------------------------------------------------------

    if (
      generatedRecipes.length === 0
    ) {

      recipesTitle.textContent =
        "Recettes (0)";


      recipesList.innerHTML =
        "<p style='font-size:0.85rem;color:#62826c;'>Aucune recette compatible avec ce mode de cuisson.</p>";


      return;

    }


    // --------------------------------------------------------
    // AFFICHAGE
    // --------------------------------------------------------

    renderRecipes(
      generatedRecipes
    );


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
// RECUPERATION DU MATERIEL
// ============================================================

function getRecipeEquipment(
  recipe
) {

  const equipment = [];


  if (
    !recipe.analyzedInstructions
  ) {

    return equipment;

  }


  recipe.analyzedInstructions
    .forEach(
      section => {

        if (!section.steps) return;


        section.steps.forEach(
          step => {

            if (!step.equipment)
              return;


            step.equipment.forEach(
              item => {

                if (!item.name)
                  return;


                const name =
                  item.name.toLowerCase();


                if (
                  !equipment.includes(
                    name
                  )
                ) {

                  equipment.push(
                    name
                  );

                }

              }
            );

          }
        );

      }
    );


  return equipment;

}


// ============================================================
// EXTRACTION DES ETAPES
// ============================================================

function extractSteps(
  recipe
) {

  if (
    recipe.analyzedInstructions &&
    recipe.analyzedInstructions
      .length > 0
  ) {

    const steps = [];


    recipe.analyzedInstructions
      .forEach(
        section => {

          if (!section.steps)
            return;


          section.steps.forEach(
            step => {

              if (step.step) {

                steps.push(
                  step.step
                );

              }

            }
          );

        }
      );


    if (steps.length > 0) {

      return steps;

    }

  }


  // ----------------------------------------------------------
  // INSTRUCTIONS CLASSIQUES
  // ----------------------------------------------------------

  if (recipe.instructions) {

    const clean =
      recipe.instructions
        .replace(
          /<[^>]*>/g,
          ""
        )
        .trim();


    if (clean) {

      return clean
        .split(
          /\.(?=\s|$)/
        )
        .map(
          step =>
            step.trim()
        )
        .filter(
          step =>
            step.length > 0
        )
        .map(
          step =>
            step.endsWith(".")
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

function renderRecipes(
  recipes
) {

  const recipesTitle =
    document.getElementById(
      "recipesTitle"
    );


  const recipesList =
    document.getElementById(
      "recipesList"
    );


  recipesTitle.textContent =
    `Recettes (${recipes.length})`;


  recipesList.innerHTML = "";


  recipes.forEach(
    (r, index) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "recipe-card";


      const available =
        r.usedIngredientCount ||
        0;


      const missing =
        r.missedIngredientCount ||
        0;


      card.innerHTML = `

        ${
          r.image
            ? `
              <img
                src="${r.image}"
                alt=""
                class="recipe-image"
              >
            `
            : ""
        }

        <div class="recipe-info">

          <h3 class="recipe-title">
            ${escapeHTML(r.title)}
          </h3>

          <div class="recipe-meta">

            <span>
              ${getModeLabel(
                selectedMode
              )}
            </span>

            <span>
              ${r.prepTime}
            </span>

          </div>

          <div class="recipe-ingredients-status">

            <span>
              ✓ ${available}
              ${
                available > 1
                  ? "disponibles"
                  : "disponible"
              }
            </span>

            ${
              missing > 0

                ? `
                  <span>
                    • ${missing}
                    ${
                      missing > 1
                        ? "manquants"
                        : "manquant"
                    }
                  </span>
                `

                : `
                  <span>
                    • Tout est disponible
                  </span>
                `
            }

          </div>

        </div>

      `;


      card.addEventListener(
        "click",
        () => {

          openRecipeModal(
            index
          );

        }
      );


      recipesList.appendChild(
        card
      );

    }
  );

}


// ============================================================
// MODALE RECETTE
// ============================================================

function openRecipeModal(
  index
) {

  const recipeModal =
    document.getElementById(
      "recipeModal"
    );


  const meal =
    generatedRecipes[index];


  if (!meal) return;


  document.getElementById(
    "modalTitle"
  ).textContent =
    meal.title;


  document.getElementById(
    "modalMeta"
  ).textContent =
    `${getModeLabel(
      selectedMode
    )} | ${meal.prepTime}`;


  document.getElementById(
    "modalIngredients"
  ).innerHTML =
    meal.ingredients

      .map(
        ing => `

          <li
            style="
              padding:4px 0;
              font-size:0.85rem;
            "
          >
            • ${escapeHTML(ing)}
          </li>

        `
      )

      .join("");


  document.getElementById(
    "modalSteps"
  ).innerHTML =
    meal.steps

      .map(
        (step, idx) => `

          <li
            style="
              margin-bottom:8px;
              font-size:0.85rem;
            "
          >

            <strong
              style="
                color:var(--primary-green);
              "
            >
              ${idx + 1}.
            </strong>

            ${escapeHTML(step)}

          </li>

        `
      )

      .join("");


  recipeModal.classList.remove(
    "hidden"
  );

}


// ===
