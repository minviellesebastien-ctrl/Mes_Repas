import os
import json
import re
import requests

from flask import Flask, request, jsonify
from flask_cors import CORS


app = Flask(__name__)
CORS(app)


# ============================================================
# CONFIGURATION
# ============================================================

POLLINATIONS_URL = "https://text.pollinations.ai/"
PORT = int(os.environ.get("PORT", 5000))


# ============================================================
# OUTILS
# ============================================================

def get_mode_label(mode):

    modes = {
        "simple": "Poêle / Four",
        "cookeo": "Cookeo",
        "airfryer": "Air Fryer",
        "sans-cuisson": "Sans cuisson"
    }

    return modes.get(
        mode,
        "Poêle / Four"
    )


def extract_json(text):

    """
    Essaie de récupérer un tableau JSON dans la réponse
    de Pollinations.
    """

    if not text:
        raise ValueError(
            "Réponse vide de l'IA."
        )

    text = text.strip()

    # Retire les éventuelles balises Markdown
    text = re.sub(
        r"```json",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = text.replace(
        "```",
        ""
    ).strip()


    # --------------------------------------------------------
    # Tentative 1 : toute la réponse est du JSON
    # --------------------------------------------------------

    try:

        result = json.loads(text)

        if isinstance(result, list):

            return result

    except Exception:

        pass


    # --------------------------------------------------------
    # Tentative 2 : rechercher le premier [
    # --------------------------------------------------------

    start = text.find("[")

    if start == -1:

        raise ValueError(
            "La réponse de l'IA ne contient pas de tableau."
        )


    # --------------------------------------------------------
    # Tentative 3 : rechercher un tableau valide
    # --------------------------------------------------------

    decoder = json.JSONDecoder()

    try:

        result, end = decoder.raw_decode(
            text[start:]
        )

        if isinstance(result, list):

            return result

    except Exception:

        pass


    # --------------------------------------------------------
    # Tentative 4 : essayer différents ]
    # --------------------------------------------------------

    positions = [
        i
        for i, character in enumerate(text[start:], start)
        if character == "]"
    ]


    for end in reversed(positions):

        candidate = text[
            start:end + 1
        ].strip()

        try:

            result = json.loads(
                candidate
            )

            if isinstance(result, list):

                return result

        except Exception:

            continue


    raise ValueError(
        "Impossible de lire les recettes retournées "
        "par l'IA."
    )


def clean_recipe(recipe):

    """
    Transforme une recette IA en format compatible avec
    la PWA.
    """

    if not isinstance(
        recipe,
        dict
    ):

        return None


    # --------------------------------------------------------
    # TITRE
    # --------------------------------------------------------

    title = recipe.get(
        "title"
    )

    if not title:

        title = recipe.get(
            "name"
        )


    if not title:

        title = "Recette"


    title = str(
        title
    ).strip()


    # --------------------------------------------------------
    # TEMPS
    # --------------------------------------------------------

    prep_time = recipe.get(
        "prepTime"
    )

    if not prep_time:

        prep_time = recipe.get(
            "time"
        )


    if not prep_time:

        prep_time = "Non indiqué"


    prep_time = str(
        prep_time
    ).strip()


    # --------------------------------------------------------
    # INGREDIENTS
    # --------------------------------------------------------

    ingredients = recipe.get(
        "ingredients",
        []
    )


    if isinstance(
        ingredients,
        str
    ):

        ingredients = [
            ingredients
        ]


    if not isinstance(
        ingredients,
        list
    ):

        ingredients = []


    cleaned_ingredients = []


    for item in ingredients:

        if isinstance(
            item,
            dict
        ):

            name = item.get(
                "name",
                ""
            )

            quantity = item.get(
                "quantity",
                ""
            )

            value = f"{quantity} {name}".strip()

        else:

            value = str(
                item
            ).strip()


        if value:

            cleaned_ingredients.append(
                value
            )


    # --------------------------------------------------------
    # ETAPES
    # --------------------------------------------------------

    steps = recipe.get(
        "steps",
        []
    )


    if isinstance(
        steps,
        str
    ):

        steps = [
            steps
        ]


    if not isinstance(
        steps,
        list
    ):

        steps = []


    cleaned_steps = []


    for item in steps:

        if isinstance(
            item,
            dict
        ):

            value = (
                item.get("text")
                or
                item.get("description")
                or
                ""
            )

        else:

            value = str(
                item
            ).strip()


        if value:

            cleaned_steps.append(
                value
            )


    # --------------------------------------------------------
    # VERIFICATION
    # --------------------------------------------------------

    if not cleaned_ingredients:

        return None


    if not cleaned_steps:

        return None


    return {

        "title":
        title,

        "prepTime":
        prep_time,

        "ingredients":
        cleaned_ingredients,

        "steps":
        cleaned_steps

    }


# ============================================================
# ROUTE RECETTES
# ============================================================

@app.route(
    "/api/recipes",
    methods=["POST"]
)
def generate_recipes():

    try:

        # ----------------------------------------------------
        # DONNEES
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
            str(item).strip()
            for item in ingredients
            if str(item).strip()
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

INGRÉDIENTS DISPONIBLES :
{ingredients_text}

MODE :
{mode_label}

Propose exactement 6 recettes différentes pour 2 personnes.

Les recettes doivent être variées, simples et réellement
réalisables avec les ingrédients disponibles.

Tu peux ajouter quelques ingrédients basiques comme huile,
beurre, sel, poivre, épices, herbes, farine, crème ou lait.

Respecte impérativement le mode de cuisson choisi.

Pour chaque recette donne :

- title : nom de la recette
- prepTime : temps total
- ingredients : liste avec quantités
- steps : étapes détaillées

IMPORTANT :

Réponds uniquement avec un tableau JSON.

N'utilise aucune balise Markdown.
N'ajoute aucun texte avant ou après le JSON.

Format :

[
  {{
    "title": "Pâtes crémeuses au poulet",
    "prepTime": "25 min",
    "ingredients": [
      "200 g de poulet",
      "200 g de pâtes",
      "10 cl de crème"
    ],
    "steps": [
      "Couper le poulet.",
      "Faire cuire les pâtes.",
      "Faire revenir le poulet.",
      "Ajouter la crème et mélanger."
    ]
  }}
]

Le tableau doit contenir exactement 6 recettes.
"""


        # ----------------------------------------------------
        # APPEL IA
        # ----------------------------------------------------

        response = requests.get(
            POLLINATIONS_URL,
            params={
                "prompt": prompt,
                "model": "openai",
                "seed": -1
            },
            timeout=60
        )


        # ----------------------------------------------------
        # 200 OU 206 ACCEPTES
        # ----------------------------------------------------

        if response.status_code not in (
            200,
            206
        ):

            print(
                "POLLINATIONS HTTP :",
                response.status_code
            )

            print(
                response.text[:500]
            )

            raise RuntimeError(
                "Le service IA a retourné une erreur."
            )


        raw_text = response.text.strip()


        if not raw_text:

            raise RuntimeError(
                "Le service IA a retourné une réponse vide."
            )


        print(
            "Réponse IA reçue :",
            len(raw_text),
            "caractères"
        )


        # ----------------------------------------------------
        # EXTRACTION
        # ----------------------------------------------------

        recipes = extract_json(
            raw_text
        )


        print(
            "Recettes trouvées :",
            len(recipes)
        )


        # ----------------------------------------------------
        # NETTOYAGE
        # ----------------------------------------------------

        cleaned_recipes = []


        for recipe in recipes:

            cleaned = clean_recipe(
                recipe
            )

            if cleaned:

                cleaned_recipes.append(
                    cleaned
                )


        print(
            "Recettes exploitables :",
            len(cleaned_recipes)
        )


        if not cleaned_recipes:

            raise ValueError(
                "L'IA a répondu mais aucune recette exploitable "
                "n'a été trouvée."
            )


        # Maximum 6
        cleaned_recipes = cleaned_recipes[:6]


        return jsonify(
            cleaned_recipes
        )


    # ========================================================
    # ERREURS
    # ========================================================

    except requests.exceptions.Timeout:

        print(
            "ERREUR : délai dépassé."
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
            "Impossible de communiquer avec le service IA."
        }), 502


    except Exception as error:

        print(
            "ERREUR GENERATION :",
            repr(error)
        )

        return jsonify({
            "error": str(error)
        }), 500


# ============================================================
# TEST
# ============================================================

@app.route(
    "/",
    methods=["GET"]
)
def home():

    return jsonify({
        "status": "ok",
        "service": "Mes Repas",
        "ai": "Pollinations"
    })


# ============================================================
# LANCEMENT
# ============================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=PORT
  )
