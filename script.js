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


        // --------------------------------------------------------
        // INGREDIENTS
        // --------------------------------------------------------

        renderTags();


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

                    if (event.key === "Enter") {

                        addIngredient();

                    }

                }
            );

        }


        // --------------------------------------------------------
        // RECHERCHE
        // --------------------------------------------------------

        if (searchBtn) {

            searchBtn.addEventListener(
                "click",
                async () => {

                    const success =
                        await generateRecipes();

                    if (
                        success &&
                        resultsScreen &&
                        mainScreen
                    ) {

                        showScreen(
                            resultsScreen,
                            mainScreen
                        );

                    }

                }
            );

        }


        // --------------------------------------------------------
        // RETOUR
        // --------------------------------------------------------

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


        // --------------------------------------------------------
        // MODES DE CUISSON
        // --------------------------------------------------------

        document
            .querySelectorAll(".cooking-btn")
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        (event) => {

                            document
                                .querySelectorAll(
                                    ".cooking-btn"
                                )
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
                                target.dataset.mode ||
                                "simple";

                        }
                    );

                }
            );


        // --------------------------------------------------------
        // MA SEMAINE
        // --------------------------------------------------------

        if (openSemaineBtn) {

            openSemaineBtn.addEventListener(
                "click",
                () => {

                    if (semaineModal) {

                        semaineModal.classList.remove(
                            "hidden"
                        );

                    }

                }
            );

        }


        if (closeSemaineBtn) {

            closeSemaineBtn.addEventListener(
                "click",
                () => {

                    if (semaineModal) {

                        semaineModal.classList.add(
                            "hidden"
                        );

                    }

                }
            );

        }


        // --------------------------------------------------------
        // MA LISTE
        // --------------------------------------------------------

        if (openListeBtn) {

            openListeBtn.addEventListener(
                "click",
                () => {

                    if (listeModal) {

                        listeModal.classList.remove(
                            "hidden"
                        );

                    }

                }
            );

        }


        if (closeListeBtn) {

            closeListeBtn.addEventListener(
                "click",
                () => {

                    if (listeModal) {

                        listeModal.classList.add(
                            "hidden"
                        );

                    }

                }
            );

        }


        // --------------------------------------------------------
        // FERMETURE MODALE RECETTE
        // --------------------------------------------------------

        if (closeModalBtn) {

            closeModalBtn.addEventListener(
                "click",
                () => {

                    if (recipeModal) {

                        recipeModal.classList.add(
                            "hidden"
                        );

                    }

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


    if (!recipesList) {

        console.error(
            "recipesList introuvable."
        );

        return false;

    }


    if (
        userIngredients.length === 0
    ) {

        if (recipesTitle) {

            recipesTitle.textContent =
                "Recettes";

        }


        recipesList.innerHTML = `
            <p style="
                text-align:center;
                padding:20px;
                color:#62826c;
            ">
                Veuillez ajouter au moins un ingrédient.
            </p>
        `;


        return false;

    }


    // --------------------------------------------------------
    // MESSAGE D'ATTENTE
    // --------------------------------------------------------

    if (recipesTitle) {

        recipesTitle.textContent =
            "Réponse IA";

    }


    recipesList.innerHTML = `
        <p style="
            text-align:center;
            padding:20px;
            color:#62826c;
        ">
            L'IA prépare vos recettes...
        </p>
    `;


    console.log(
        "========== DEMANDE IA =========="
    );


    console.log(
        "INGREDIENTS :",
        userIngredients
    );


    console.log(
        "MODE :",
        selectedMode
    );


    // --------------------------------------------------------
    // APPEL RENDER
    // --------------------------------------------------------

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


        console.log(
            "HTTP :",
            response.status
        );


        // ----------------------------------------------------
        // ON LIT LA REPONSE COMME DU TEXTE
        // ----------------------------------------------------

        const text =
            await response.text();


        console.log(
            "========== REPONSE RENDER =========="
        );


        console.log(
            text
        );


        console.log(
            "========== FIN REPONSE =========="
        );


        // ----------------------------------------------------
        // ERREUR HTTP
        // ----------------------------------------------------

        if (!response.ok) {

            if (recipesTitle) {

                recipesTitle.textContent =
                    "Erreur serveur";

            }


            recipesList.innerHTML = `

                <div style="
                    padding:20px;
                    text-align:center;
                    color:#b35c5c;
                    line-height:1.5;
                ">

                    <strong>
                        Erreur ${response.status}
                    </strong>

                    <br><br>

                    ${escapeHTML(text)}

                </div>

            `;


            return false;

        }


        // ----------------------------------------------------
        // AFFICHAGE BRUT
        // ----------------------------------------------------

        generatedRecipes = [];


        if (recipesTitle) {

            recipesTitle.textContent =
                "Recettes";

        }


        recipesList.innerHTML = `

            <div
                class="recipe-text"
                style="
                    padding:20px;
                    white-space:pre-wrap;
                    line-height:1.6;
                    font-size:0.9rem;
                "
            >
                ${escapeHTML(text)}
            </div>

        `;


        return true;


    } catch (error) {

        console.error(
            "ERREUR FETCH :",
            error
        );


        if (recipesTitle) {

            recipesTitle.textContent =
                "Erreur";

        }


        recipesList.innerHTML = `

            <div style="
                padding:20px;
                text-align:center;
                color:#b35c5c;
                line-height:1.5;
            ">

                <strong>
                    Impossible de contacter Render.
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
