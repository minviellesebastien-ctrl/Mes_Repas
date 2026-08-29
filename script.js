document.addEventListener("DOMContentLoaded", () => {

  const ingredientInput = document.getElementById("ingredientInput");
  const addBtn = document.getElementById("addBtn");
  const tagsContainer = document.getElementById("tagsContainer");
  const searchBtn = document.getElementById("searchBtn");
  const backBtn = document.getElementById("backBtn");

  const mainScreen = document.getElementById("mainScreen");
  const resultsScreen = document.getElementById("resultsScreen");
  const recipesList = document.getElementById("recipesList");

  let ingredients = [];
  let selectedMode = "simple";

  // Mode de cuisson
  document.querySelectorAll(".cooking-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cooking-btn")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      selectedMode = btn.dataset.mode;
    });
  });

  // Ajouter un ingrédient
  function ajouterIngredient() {

    const val = ingredientInput.value.trim();

    if (val && !ingredients.includes(val)) {

      ingredients.push(val);

      renderTags();

      ingredientInput.value = "";
    }
  }

  addBtn.addEventListener("click", ajouterIngredient);

  ingredientInput.addEventListener("keypress", e => {

    if (e.key === "Enter") {

      e.preventDefault();

      ajouterIngredient();
    }
  });

  // Affichage des ingrédients
  function renderTags() {

    tagsContainer.innerHTML = "";

    ingredients.forEach((ing, index) => {

      const tag = document.createElement("span");

      tag.className = "tag";

      tag.textContent = ing + " ×";

      tag.addEventListener("click", () => {

        ingredients.splice(index, 1);

        renderTags();
      });

      tagsContainer.appendChild(tag);
    });
  }

  // Recherche TEST
  searchBtn.addEventListener("click", async () => {

    if (ingredients.length === 0) {

      alert("Veuillez ajouter au moins un ingrédient !");

      return;
    }

    mainScreen.style.display = "none";

    resultsScreen.style.display = "block";

    recipesList.innerHTML =
      "<p style='padding:20px;text-align:center;'>Recherche...</p>";

    try {

      // Pour le premier test :
      // on recherche uniquement le premier ingrédient.

      const ingredient =
        ingredients[0].toLowerCase();

      const url =
  "https://datasets-server.huggingface.co/search" +
  "?dataset=" + encodeURIComponent("Karo8870/food.com-parsed-dataset") +
  "&config=default" +
  "&split=train" +
  "&query=" + encodeURIComponent(ingredient) +
  "&offset=0" +
  "&length=10";

const response = await fetch(url);

if (!response.ok) {
  throw new Error("Erreur API : " + response.status);
}

const data = await response.json();

console.log("Réponse dataset :", data);

recipesList.innerHTML = "";

if (!data.rows || data.rows.length === 0) {
  recipesList.innerHTML =
    "<p style='padding:20px;text-align:center;'>Aucune recette trouvée.</p>";
  return;
}

data.rows.forEach(item => {

        const recipe = item.row;

        const card =
          document.createElement("div");

        card.style.padding = "15px";
        card.style.margin = "10px";
        card.style.background = "white";
        card.style.borderRadius = "15px";

        card.innerHTML = `
          <h3 style="margin-top:0;">
            ${recipe.name || "Recette sans nom"}
          </h3>

          <p style="font-size:0.85rem;color:#666;">
            ${recipe.ingredients || ""}
          </p>
        `;

        recipesList.appendChild(card);

      });

    } catch (error) {

      console.error(error);

      recipesList.innerHTML = `
        <p style="
          padding:20px;
          text-align:center;
          color:red;
        ">
          Erreur de connexion au dataset.<br><br>
          ${error.message}
        </p>
      `;
    }
  });

  // Retour
  backBtn.addEventListener("click", () => {

    resultsScreen.style.display = "none";

    mainScreen.style.display = "block";
  });

});
