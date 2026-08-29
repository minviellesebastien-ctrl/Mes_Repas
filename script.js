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

  // Gestion des modes de cuisson
  document.querySelectorAll(".cooking-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cooking-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedMode = btn.dataset.mode;
    });
  });

  // Ajout d'ingrédients
  function ajouterIngredient() {
    const val = ingredientInput.value.trim();
    if (val && !ingredients.includes(val)) {
      ingredients.push(val);
      renderTags();
      ingredientInput.value = "";
    }
  }

  addBtn.addEventListener("click", ajouterIngredient);
  ingredientInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      ajouterIngredient();
    }
  });

  function renderTags() {
    tagsContainer.innerHTML = "";
    ingredients.forEach((ing, index) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = ing + " ×";
      tag.style.display = "inline-block";
      tag.style.margin = "4px";
      tag.style.padding = "6px 10px";
      tag.style.background = "#e2e8f0";
      tag.style.borderRadius = "6px";
      tag.style.cursor = "pointer";
      tag.addEventListener("click", () => {
        ingredients.splice(index, 1);
        renderTags();
      });
      tagsContainer.appendChild(tag);
    });
  }

  // Lancement de la recherche de recettes via l'API REST directe
  searchBtn.addEventListener("click", async () => {
    if (ingredients.length === 0) {
      alert("Veuillez ajouter au moins un ingrédient !");
      return;
    }

    mainScreen.classList.remove("active-screen");
    mainScreen.style.display = "none";
    resultsScreen.classList.add("active-screen");
    resultsScreen.style.display = "block";
    recipesList.innerHTML = "<p style='padding: 20px; text-align: center;'>Génération de vos recettes en cours...</p>";

    const promptText = `Génère 2 ou 3 idées de recettes de cuisine basées sur ces ingrédients : ${ingredients.join(", ")}. Le mode de cuisson principal doit être : ${selectedMode}. Réponds de manière claire et structurée.`;

    // Remplace par ta vraie clé API entre les guillemets
    const apiKey = "AQ.Ab8RN6IVXYz0pp3zGSmBPweKtCthazPKr2ccqf_XBVInDu9MRA";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptText }]
          }]
        })
      });

      const data = await response.json();

      if (data.candidates && data.candidates[0].content) {
        const textResponse = data.candidates[0].content.parts[0].text;
        recipesList.innerHTML = `<div style="padding: 15px; white-space: pre-wrap; font-family: inherit; line-height: 1.5;">${textResponse}</div>`;
      } else {
        console.error("Réponse API inattendue :", data);
        recipesList.innerHTML = "<p style='padding: 20px; color: red; text-align: center;'>Erreur : Vérifie ta clé API ou le quota.</p>";
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
      recipesList.innerHTML = "<p style='padding: 20px; color: red; text-align: center;'>Erreur de communication réseau.</p>";
    }
  });

  // Bouton Retour
  backBtn.addEventListener("click", () => {
    resultsScreen.classList.remove("active-screen");
    resultsScreen.style.display = "none";
    mainScreen.classList.add("active-screen");
    mainScreen.style.display = "block";
  });
});
          
