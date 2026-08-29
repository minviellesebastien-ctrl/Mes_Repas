import { GoogleGenAI } from "@google/genai";

// Initialisation de l'API Gemini avec ta clé sécurisée
const ai = new GoogleGenAI({ apiKey: "AQ.Ab8RN6I5OFsaEBHCSioswnvlJIaVaW7Yt4JX90teliS1TiaEbA" }); // Remplace par ta vraie clé aq...

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

  // 1. Gestion des modes de cuisson
  document.querySelectorAll(".cooking-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cooking-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedMode = btn.dataset.mode;
    });
  });

  // 2. Gestion de l'ajout d'ingrédients
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
      tag.className = "tag"; // Assure-toi d'avoir le style CSS pour les tags si besoin
      tag.textContent = ing + " ×";
      tag.style.cursor = "pointer";
      tag.style.marginRight = "5px";
      tag.style.padding = "4px 8px";
      tag.style.background = "#e2e8f0";
      tag.style.borderRadius = "4px";
      tag.addEventListener("click", () => {
        ingredients.splice(index, 1);
        renderTags();
      });
      tagsContainer.appendChild(tag);
    });
  }

  // 3. Bouton "C'est Parti !" -> Appel à Gemini
  searchBtn.addEventListener("click", async () => {
    if (ingredients.length === 0) {
      alert("Veuillez ajouter au moins un ingrédient !");
      return;
    }

    // Bascule vers l'écran des résultats avec un message de chargement
    mainScreen.classList.remove("active-screen");
    mainScreen.style.display = "none";
    resultsScreen.classList.add("active-screen");
    resultsScreen.style.display = "block";
    recipesList.innerHTML = "<p style='padding: 20px; text-align: center;'>Génération de vos recettes en cours...</p>";

    const prompt = `Génère 2 ou 3 idées de recettes de cuisine basées sur ces ingrédients : ${ingredients.join(", ")}. 
    Le mode de cuisson principal doit être : ${selectedMode}. 
    Réponds de manière structurée avec le nom de la recette, les ingrédients nécessaires et les étapes de préparation.`;

    try {
      // Appel au modèle flash rapide et efficace
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });

      // Affiche le texte brut ou mis en forme de Gemini
      recipesList.innerHTML = `<div style="padding: 15px; white-space: pre-wrap; font-family: inherit;">${response.text}</div>`;
    } catch (error) {
      console.error("Erreur Gemini:", error);
      recipesList.innerHTML = "<p style='padding: 20px; color: red; text-align: center;'>Erreur lors de la génération des recettes.</p>";
    }
  });

  // 4. Bouton Retour
  backBtn.addEventListener("click", () => {
    resultsScreen.classList.remove("active-screen");
    resultsScreen.style.display = "none";
    mainScreen.classList.add("active-screen");
    mainScreen.style.display = "block";
  });
});
                           
