import os
import json
import re
import requests

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(name)
CORS(app)

============================================================

CONFIGURATION

============================================================

POLLINATIONS_URL = "https://text.pollinations.ai/"
PORT = int(os.environ.get("PORT", 5000))

============================================================

OUTILS

============================================================

def get_mode_label(mode):

modes = {
    "simple": "Poêle / Four",
    "cookeo": "Cookeo",
    "airfryer": "Air Fryer",
    "sans-cuisson": "Sans cuisson"
}

return modes.get(mode, "Poêle / Four")

def extract_recipes(text):

"""
Essaie de récupérer les recettes même si l'IA
ajoute du texte autour.
"""

if not text:
    return []


# --------------------------------------------------------
# 1. Tentative JSON direct
# --------------------------------------------------------

try:

    data = json.loads(text)

    if isinstance(data, list):
        return data

except Exception:
    pass


# --------------------------------------------------------
# 2. Cherche un tableau JSON dans la réponse
# --------------------------------------------------------

start = text.find("[")

if start >= 0:

    decoder = json.JSONDecoder()

    try:

        data, _ = decoder.raw_decode(
            text[start:]
        )

        if isinstance(data, list):
            return data

    except Exception:
        pass


# --------------------------------------------------------
# 3. Si le JSON est entouré de ```json
# --------------------------------------------------------

cleaned = re.sub(
    r"```(?:json)?",
    "",
    text,
    flags=re.IGNORECASE
)

cleaned = cleaned.replace(
    "```",
    ""
).strip()


try:

    data = json.loads(cleaned)

    if isinstance(data, list):
        return data

except Exception:
    pass


return []

def clean_recipe(recipe):

if not isinstance(recipe, dict):
    return None


title = str(
    recipe.get("title", "")
).strip()


prep_time = str(
    recipe.get(
        "prepTime",
        recipe.get(
            "time",
            ""
        )
    )
).strip()


ingredients = recipe.get(
    "ingredients",
    []
)


steps = recipe.get(
    "steps",
    recipe.get(
        "instructions",
        []
    )
)


if not isinstance(
    ingredients,
    list
):

    ingredients = []


if not isinstance(
    steps,
    list
):

    steps = []


ingredients = [
    str(x).strip()
    for x in ingredients
    if str(x).strip()
]


steps = [
    str(x).strip()
    for x in steps
    if str(x).strip()
]


if not title:
    return None


if not ingredients:
    return None


if not steps:
    return None


return {

    "title": title,

    "prepTime":
        prep_time or "Temps non indiqué",

    "ingredients":
        ingredients,

    "steps":
        steps

}

============================================================

API RECETTES

============================================================

@app.route(
"/api/recipes",
methods=["POST"]
)
def generate_recipes():

try:

    # ----------------------------------------------------
    # DONNEES PWA
    # ----------------------------------------------------

    data = request.get_json(
        silent=True
    ) or {}


    ingredients = data.get(
        "ingredients",
        []
    )


    mode = data.get(
        "mode",
        "simple"
    )


    if not isinstance(
        ingredients,
        list
    ):

        ingredients = []


    ingredients = [
        str(x).strip()
        for x in ingredients
        if str(x).strip()
    ]


    if not ingredients:

        return jsonify({
            "error":
            "Aucun ingrédient fourni."
        }), 400


    mode_label = get_mode_label(
        mode
    )


    ingredients_text = ", ".join(
        ingredients
    )


    # ----------------------------------------------------
    # PROMPT
    # ----------------------------------------------------

    prompt = f"""

Tu es un cuisinier français.

L'utilisateur possède :

{ingredients_text}

Mode de cuisson :
{mode_label}

Propose 6 recettes différentes pour 2 personnes.

Utilise en priorité les ingrédients disponibles.
Tu peux ajouter quelques ingrédients basiques comme
huile, beurre, sel, poivre, épices, herbes, crème ou lait.

Respecte impérativement le mode de cuisson.

Pour chaque recette donne :

TITRE:
TEMPS:
INGREDIENTS:
ETAPES:

Utilise exactement ce format pour chaque recette.

Exemple :

TITRE: Poulet crémeux aux courgettes
TEMPS: 25 min
INGREDIENTS:

- 200 g de poulet
- 1 courgette
- 10 cl de crème
- 1 cuillère à soupe d'huile

ETAPES:

1. Couper le poulet.
2. Faire chauffer l'huile.
3. Cuire le poulet.
4. Ajouter la courgette.
5. Ajouter la crème et terminer la cuisson.

Fais exactement 6 recettes réellement différentes.

Ne mets aucune explication avant ou après les recettes.
"""

    # ----------------------------------------------------
    # APPEL POLLINATIONS
    # ----------------------------------------------------

    response = requests.get(

        POLLINATIONS_URL,

        params={
            "prompt": prompt,
            "model": "openai",
            "seed": -1
        },

        headers={
            "Accept": "text/plain",
            "User-Agent": "Mes-Repas/1.0"
        },

        timeout=60

    )


    print(
        "========== POLLINATIONS =========="
    )

    print(
        "HTTP :",
        response.status_code
    )

    print(
        response.text[:10000]
    )

    print(
        "========== FIN POLLINATIONS =========="
    )


    # ----------------------------------------------------
    # ERREUR POLLINATIONS
    # ----------------------------------------------------

    if response.status_code != 200:

        if response.status_code == 402:

            return jsonify({

                "error":
                "Pollinations demande actuellement "
                "une authentification ou du crédit. "
                "Aucune clé API n'est configurée dans "
                "Mes Repas."

            }), 502


        return jsonify({

            "error":
            f"Pollinations HTTP {response.status_code}"

        }), 502


    raw_text = response.text.strip()


    if not raw_text:

        return jsonify({

            "error":
            "Pollinations a retourné une réponse vide."

        }), 502


    # ----------------------------------------------------
    # EXTRACTION
    # ----------------------------------------------------

    recipes = extract_recipes(
        raw_text
    )


    cleaned_recipes = []


    for recipe in recipes:

        cleaned = clean_recipe(
            recipe
        )

        if cleaned:

            cleaned_recipes.append(
                cleaned
            )


    # ----------------------------------------------------
    # RESULTAT
    # ----------------------------------------------------

    if not cleaned_recipes:

        print(
            "Aucune recette exploitable."
        )

        return jsonify({

            "error":
            "L'IA a répondu mais aucune recette "
            "exploitable n'a été trouvée."

        }), 500


    cleaned_recipes = \
        cleaned_recipes[:6]


    print(
        "RECETTES EXPLOITABLES :",
        len(cleaned_recipes)
    )


    return jsonify(
        cleaned_recipes
    )


# ========================================================
# ERREURS
# ========================================================

except requests.exceptions.Timeout:

    print(
        "ERREUR : timeout Pollinations"
    )

    return jsonify({

        "error":
        "L'IA met trop de temps à répondre."

    }), 504


except requests.exceptions.RequestException as error:

    print(
        "ERREUR RESEAU :",
        repr(error)
    )

    return jsonify({

        "error":
        "Impossible de communiquer avec Pollinations."

    }), 502


except Exception as error:

    print(
        "ERREUR SERVEUR :",
        repr(error)
    )

    return jsonify({

        "error":
        str(error)

    }), 500

============================================================

TEST

============================================================

@app.route("/")
def home():

return jsonify({

    "status": "ok",

    "service": "Mes Repas",

    "ai": "Pollinations"

})

============================================================

LANCEMENT

============================================================

if name == "main":

app.run(

    host="0.0.0.0",

    port=PORT

)
