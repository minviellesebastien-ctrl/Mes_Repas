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
    Extrait le premier tableau JSON trouvé dans
    la réponse de l'IA.

    Cette fonction accepte aussi une réponse contenant
    du texte autour du JSON ou des balises Markdown.
    """

    if not text:
        raise ValueError(
            "Réponse vide de l'IA."
        )

    text = text.strip()

    # Suppression des balises Markdown
    text = re.sub(
        r"```(?:json)?",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = text.replace(
        "```",
        ""
    ).strip()

    # --------------------------------------------------------
    # Première tentative : JSON complet
    # --------------------------------------------------------

    try:

        result = json.loads(text)

        if isinstance(result, list):
            return result

    except json.JSONDecodeError:
        pass


    # --------------------------------------------------------
    # Deuxième tentative : chercher un tableau JSON
    # --------------------------------------------------------

    start = text.find("[")

    if start == -1:

        raise ValueError(
            "Aucun tableau JSON trouvé dans la réponse de l'IA."
        )


    # On cherche le dernier crochet fermant.
    # Plusieurs essais sont effectués car l'IA peut ajouter
    # du texte après le JSON.

    end_positions = [
        position
        for position, character in enumerate(text)
        if character == "]"
    ]

    for end in reversed(end_positions):

        candidate = text[start:end + 1].strip()

        try:

            result = json.loads(
                candidate
            )

            if isinstance(result, list):
                return result

        except json.JSONDecodeError:
            continue


    # --------------------------------------------------------
    # Échec
    # --------------------------------------------------------

    raise ValueError(
        "Impossible d'extraire un tableau JSON valide "
        "de la réponse de l'IA."
    )


def clean_recipe(recipe):

    """
    Vérifie et nettoie une recette individuelle.
    """

    if not isinstance(
        recipe,
        dict
    ):
        return None


    title = str(
        recipe.get(
            "title",
            ""
        )
    ).strip()


    prep_time = str(
        recipe.get(
            "prepTime",
            ""
        )
    ).strip()


    ingredients = recipe.get(
        "ingredients",
        []
    )


    steps = recipe.get(
        "steps",
        []
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
        str(item).strip()
        for item in ingredients
        if str(item).strip()
    ]


    steps = [
        str(item).strip()
        for item in steps
        if str(item).strip()
    ]


    # Une recette sans titre ou sans étapes
    # n'est pas exploitable par la PWA.

    if not title:
        return None


    if not ingredients:
        return None


    if not steps:
        return None


    if not prep_time:
        prep_time = "Temps non indiqué"


    return {

        "title": title,

        "prepTime": prep_time,

        "ingredients": ingredients,

        "steps": steps

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
        # DONNEES RECUES
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


        # ----------------------------------------------------
        # VERIFICATION INGREDIENTS
        # ----------------------------------------------------

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
Tu es un excellent cuisinier français.

L'utilisateur possède les ingrédients suivants :

{ingredients_text}

Mode de cuisson choisi :

{mode_label}

Ta mission est de proposer EXACTEMENT 6 recettes
réellement différentes.

Les recettes doivent être simples, bonnes et réalisables
à la maison pour 2 personnes.

RÈGLES :

- Utilise en priorité les ingrédients disponibles.
- Tu peux ajouter quelques ingrédients basiques :
  huile, beurre, sel, poivre, épices, herbes, farine,
  crème, lait, etc.
- Les 6 recettes doivent être différentes.
- Ne fais pas 6 variantes de la même recette.
- Toutes les recettes doivent respecter le mode de cuisson.

POÊLE / FOUR :
Utilise une poêle, casserole ou four.

COOKEO :
Les recettes doivent être adaptées au Cookeo et les étapes
doivent indiquer les manipulations utiles.

AIR FRYER :
Les recettes doivent être réellement adaptées à l'Air Fryer.
Indique la température en °C et le temps de cuisson.

SANS CUISSON :
Aucune cuisson.
Utilise par exemple salades, wraps, sandwichs, tartares
ou préparations froides.

Chaque recette doit contenir :

- un titre
- un temps de préparation/cuisson
- une liste d'ingrédients avec quantités
- plusieurs étapes détaillées

IMPORTANT :

Réponds UNIQUEMENT avec un tableau JSON.

Aucun texte avant le JSON.
Aucun texte après le JSON.
Aucune balise Markdown.

Format obligatoire :

[
  {{
    "title": "Nom de la recette",
    "prepTime": "25 min",
    "ingredients": [
      "200 g de poulet",
      "1 courgette",
      "1 cuillère à soupe d'huile"
    ],
    "steps": [
      "Découper le poulet et la courgette.",
      "Faire chauffer la poêle avec l'huile.",
      "Cuire le poulet pendant 8 minutes.",
      "Ajouter la courgette et poursuivre la cuisson."
    ]
  }}
]

Le tableau doit contenir exactement 6 recettes.
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
            timeout=60
        )


        # ----------------------------------------------------
        # VERIFICATION REPONSE
        # ----------------------------------------------------

        if response.status_code != 200:

            print(
                "POLLINATIONS HTTP :",
                response.status_code
            )

            print(
                "REPONSE :",
                response.text[:1000]
            )

            raise RuntimeError(
                "Le service IA a retourné une erreur."
            )


        raw_text = response.text.strip()


        if not raw_text:

            raise RuntimeError(
                "Le service IA a retourné une réponse vide."
            )


        # ----------------------------------------------------
        # EXTRACTION JSON
        # ----------------------------------------------------

        recipes = extract_json(
            raw_text
        )


        # ----------------------------------------------------
        # NETTOYAGE DES RECETTES
        # ----------------------------------------------------

        cleaned_recipes = []


        for recipe in recipes:

            cleaned = clean_recipe(
                recipe
            )

            if cleaned is not None:

                cleaned_recipes.append(
                    cleaned
                )


        # ----------------------------------------------------
        # VERIFICATION RESULTAT
        # ----------------------------------------------------

        if not cleaned_recipes:

            raise ValueError(
                "L'IA a répondu mais aucune recette exploitable "
                "n'a été trouvée."
            )


        # Maximum 6 recettes
        cleaned_recipes = cleaned_recipes[:6]


        print(
            f"{len(cleaned_recipes)} recettes générées."
        )


        # ----------------------------------------------------
        # REPONSE PWA
        # ----------------------------------------------------

        return jsonify(
            cleaned_recipes
        )


    # ========================================================
    # ERREURS
    # ========================================================

    except requests.exceptions.Timeout:

        print(
            "ERREUR : délai Pollinations dépassé."
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
# TEST SERVEUR
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
