let userIngredients = [];
let selectedMode = "simple";
let generatedRecipes = [];


// ============================================================
// SERVEUR RENDER
// ============================================================

const API_URL =
  "https://mes-repas.onrender.com/api/recipes";


// ============================================================
// INITIALISATION
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const mainScreen =
      document.getElementById("mainScreen");

    const resultsScreen =
      document.getElementById("resultsScreen");

    const backBtn =
      document.getElementById("backBtn");

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


    renderTags();


    // ========================================================
    // AJOUT INGREDIENT
    // ========================================================

    if (addBtn) {

      addBtn.addEventListener(
        "click",
        addIngredient
      );

    }


    if (ingredientInput) {

      ingredientInput.addEventListener(
        "keyup",
        (event) => {

          if (
            event.key === "Enter"
          ) {

            addIngredient();

          }

        }
      );

    }


    // ========================================================
    // RECHERCHE
    // ========================================================

    if (searchBtn) {

      searchBtn.addEventListener(
        "click",
        async () => {

          const success =
            await generateRecipes();

          if (success) {

            showScreen(
              resultsScreen,
              mainScreen
            );

          }

        }
      );

    }


    // ========================================================
    // RETOUR
    // ========================================================

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


    // ========================================================
    // MODES DE CUISSON
    // ========================================================

    document
      .querySelectorAll(".cooking-btn")
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            (event) => {

              document
                .querySelectorAll(".cooking-btn")
                .forEach(
                  (btn) => {

                    btn.classList.remove(
                      "active"
                    );

                  }
                );


              const target =
                event.currentTarget;


              target.classList.add(
                "active"
              );


              selectedMode =
                target.dataset.mode;

            }
          );

        }
      );


    // ========================================================
    // MA SEMAINE
    // ========================================================

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


    // ========================================================
    // MA LISTE
    // ========================================================

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


    // ========================================================
    // MODALE RECETTE
    // ========================================================

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

  }
);


// ============================================================
// CHANGEMENT D'ECRAN
// ============================================================

function showScreen(
  screenToShow,
  screenToHide
) {

  if (screenToHide) {

    screenToHide.classList.remove(
      "active-screen"
    );

  }

  if (screenToShow) {

    screenToShow.classList.add(
      "active-screen"
    );

  }

}


// ============================================================
// AJOUT INGREDIENT
// ============================================================

function addIngredient() {

  const input =
    document.getElementById(
      "ingredientInput"
    );


  if (!input) return;


  const value =
    input.value
      .trim()
      .toLowerCase();


  if (
    value &&
    !userIngredients.includes(value)
  ) {

    userIngredients.push(
      value
    );


    input.value =
      "";


    renderTags();

  }

}


// ============================================================
// SUPPRESSION INGREDIENT
// ============================================================

function removeIngredient(
  index
) {

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


  tagsContainer.innerHTML =
    "";


  userIngredients.forEach(
    (ingredient, index) => {

      const tag =
        document.createElement(
          "span"
        );


      tag.className =
        "tag";


      tag.textContent =
        ingredient + " ";


      const removeBtn =
        document.createElement(
          "button"
        );


      removeBtn.type =
        "button";


      removeBtn.className =
        "tag-remove";


      removeBtn.textContent =
        "×";


      removeBtn.addEventListener(
        "click",
        () => {

          removeIngredient(
            index
          );

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
// GENERATION DES RECETTES
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


  if (
    userIngredients.length === 0
  ) {

    recipesTitle.textContent =
      "Recettes (0)";


    recipesList.innerHTML =
      "<p style='font-size:0.85rem;color:#62826c;'>Veuillez ajouter au moins un ingrédient.</p>";


    return false;

  }


  recipesList.innerHTML = `
    <p style="
      font-size:0.85rem;
      color:#62826c;
      text-align:center;
      padding:20px;
    ">
      L'IA prépare vos recettes...
    </p>
  `;


  try {

    const response =
      await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            ingredients:
              userIngredients,

            mode:
              selectedMode

          })

        }
      );


    // --------------------------------------------------------
    // LECTURE REPONSE
    // --------------------------------------------------------

    let data = null;

    try {

      data =
        await response.json();

    } catch {

      throw new Error(
        `Réponse serveur invalide (${response.status})`
      );

    }


    // --------------------------------------------------------
    // ERREUR SERVEUR
    // --------------------------------------------------------

    if (!response.ok) {

      throw new Error(
        data?.error ||
        `Erreur serveur ${response.status}`
      );

    }


    // --------------------------------------------------------
    // VERIFICATION RECETTES
    // --------------------------------------------------------

    if (
      !Array.isArray(data)
    ) {

      throw new Error(
        "Le serveur n'a pas retourné une liste de recettes."
      );

    }


    if (
      data.length === 0
    ) {

      throw new Error(
        "Aucune recette n'a été générée."
      );

    }


    // --------------------------------------------------------
    // VERIFICATION DES RECETTES
    // --------------------------------------------------------

    const validRecipes =
      data.filter(
        (recipe) => {

          return (
            recipe &&
            recipe.title &&
            Array.isArray(
              recipe.ingredients
            ) &&
            recipe.ingredients.length > 0 &&
            Array.isArray(
              recipe.steps
            ) &&
            recipe.steps.length > 0
          );

        }
      );


    if (
      validRecipes.length === 0
    ) {

      throw new Error(
        "Les recettes reçues sont incomplètes."
      );

    }


    generatedRecipes =
      validRecipes;


    renderRecipes(
      generatedRecipes
    );


    return true;


  } catch (error) {

    console.error(
      "Erreur génération recettes :",
      error
    );


    recipesTitle.textContent =
      "Recettes";


    recipesList.innerHTML = `

      <div style="
        padding:20px;
        text-align:center;
        font-size:0.85rem;
        color:#62826c;
        line-height:1.5;
      ">

        <strong>
          Impossible de générer les recettes.
        </strong>

        <br><br>

        ${escapeHTML(
          error.message
        )}

      </div>

    `;


    return false;

  }

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


  recipesList.innerHTML =
    "";


  recipes.forEach(
    (recipe, index) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "recipe-card";


      card.innerHTML = `

        <div class="recipe-info">

          <h3 class="recipe-title">
            ${escapeHTML(
              recipe.title
            )}
          </h3>

          <div class="recipe-meta">

            <span>
              Mode :
              ${getModeLabel(
                selectedMode
              )}
            </span>

            <span>
              Temps :
              ${escapeHTML(
                recipe.prepTime ||
                "Non indiqué"
              )}
            </span>

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
// OUVERTURE DE LA RECETTE
// ============================================================

function openRecipeModal(
  index
) {

  const recipe =
    generatedRecipes[index];


  if (!recipe) return;


  const recipeModal =
    document.getElementById(
      "recipeModal"
    );


  document.getElementById(
    "modalTitle"
  ).textContent =
    recipe.title ||
    "Recette";


  document.getElementById(
    "modalMeta"
  ).textContent =
    `${getModeLabel(
      selectedMode
    )} | ${
      recipe.prepTime ||
      "Temps non indiqué"
    }`;


  const ingredients =
    Array.isArray(
      recipe.ingredients
    )
      ? recipe.ingredients
      : [];


  const steps =
    Array.isArray(
      recipe.steps
    )
      ? recipe.steps
      : [];


  document.getElementById(
    "modalIngredients"
  ).innerHTML =

    ingredients
      .map(
        (ingredient) => `

          <li style="
            padding:4px 0;
            font-size:0.85rem;
          ">

            • ${escapeHTML(
              ingredient
            )}

          </li>

        `
      )
      .join("");


  document.getElementById(
    "modalSteps"
  ).innerHTML =

    steps
      .map(
        (step, index) => `

          <li style="
            margin-bottom:8px;
            font-size:0.85rem;
          ">

            <strong style="
              color:var(--primary-green);
            ">

              ${index + 1}.

            </strong>

            ${escapeHTML(
              step
            )}

          </li>

        `
      )
      .join("");


  recipeModal.classList.remove(
    "hidden"
  );

}


// ============================================================
// LIBELLE MODE
// ============================================================

function getModeLabel(
  mode
) {

  switch (mode) {

    case "simple":
      return "🍳 Poêle / Four";

    case "cookeo":
      return "🫕 Cookeo";

    case "airfryer":
      return "🌬️ Air Fryer";

    case "sans-cuisson":
      return "🥗 Sans cuisson";

    default:
      return "🍳 Cuisine";

  }

}


// ============================================================
// SECURITE HTML
// ============================================================

function escapeHTML(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

  }
