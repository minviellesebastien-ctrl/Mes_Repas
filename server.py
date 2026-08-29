import os
import json
import re

from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai

app = Flask(__name__)
CORS(app)


# ============================================================
# CONFIGURATION
# ============================================================

API_KEY = os.environ.get("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY est absente des variables d'environnement.")

client = genai.Client(api_key=API_KEY)

MODEL = "gemini-2.5-flash"


# ============================================================
# ROUTE PRINCIPALE
# ============================================================

@app.route("/api/recipes", methods=["POST"])
def recipes():

    try:

        data = request.get_json(silent=True) or {}

        ingredients = data.get("ingredients", [])
        mode = data.get("mode", "simple")


        if not ingredients:

            return jsonify({
                "error": "Aucun ingrédient fourni."
            }), 400


        # ----------------------------------------------------
        # LIBELLE DU MODE
        # ----------------------------------------------------

        modes = {
            "simple": "Poêle / Four",
            "cookeo": "Cookeo",
            "airfryer": "Air Fryer",
            "sans-cuisson": "Sans cuisson"
        }

        mode_label = modes.get(
            mode,
            "Poêle / Four"
        )


        ingredients_text = ", ".join(
            str(i).strip()
            for i in ingredients
            if str(i).strip()
        )


        # ----------------------------------------------------
        # PROMPT
        # ----------------------------------------------------

        prompt = f"""
Tu es un excellent cuisinier français et un assistant spécialisé
dans la création de recettes du quotidien.

L'utilisateur possède les ingrédients suivants :

{ingredients_text}

Il souhaite cuisiner avec le mode suivant :

{mode_label}

Crée exactement 6 recettes DIFFÉRENTES.

IMPORTANT :

- Utilise en priorité les ingrédients fournis.
- Tu peux ajouter quelques ingrédients basiques ou courants
  si nécessaire : huile, beurre, sel, poivre, épices, herbes,
  farine, crème, lait, etc.
- Ne demande pas à l'utilisateur d'acheter une longue liste
  d'ingrédients.
- Les recettes doivent être réellement réalisables.
- Les recettes doivent être variées : évite de proposer
  six variantes presque identiques.
- Respecte impérativement le mode de cuisson demandé.
- Pour "Poêle / Four", tu peux utiliser la poêle ou le four.
- Pour "Cookeo", adapte réellement la recette au Cookeo.
- Pour "Air Fryer", adapte réellement les températures,
  temps et étapes à l'Air Fryer.
- Pour "Sans cuisson", aucune étape ne doit nécessiter
  de cuisson.
- Donne des quantités réalistes.
- Les recettes doivent être en français.
- Utilise des températures en °C.
- Donne des temps réalistes.

Retourne UNIQUEMENT un JSON valide.
Aucun texte avant ou après le JSON.

Format obligatoire :

[
  {{
    "title": "Nom de la recette",
    "prepTime": "15 min",
    "ingredients": [
      "200 g de poulet",
      "1 courgette",
      "1 cuillère à soupe d'huile"
    ],
    "steps": [
      "Étape 1.",
      "Étape 2.",
      "Étape 3."
    ]
  }}
]

Le tableau doit contenir exactement 6 recettes.
"""


        # ----------------------------------------------------
        # APPEL GEMINI
        # ----------------------------------------------------

        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )


        text = response.text.strip()


        # ----------------------------------------------------
        # NETTOYAGE DU JSON
        # ----------------------------------------------------

        text = re.sub(
            r"^```json\s*",
            "",
            text,
            flags=re.IGNORECASE
        )

        text = re.sub(
            r"^```\s*",
            "",
            text
        )

        text = re.sub(
            r"\s*```$",
            "",
            text
        )

        text = text.strip()


        # Recherche du tableau JSON
        first = text.find("[")
        last = text.rfind("]")


        if first == -1 or last == -1:

            raise ValueError(
                "Gemini n'a pas retourné un tableau JSON valide."
            )


        json_text = text[
            first:last + 1
        ]


        recipes = json.loads(
            json_text
        )


        if not isinstance(
            recipes,
            list
        ):

            raise ValueError(
                "Le résultat Gemini n'est pas une liste."
            )


        # ----------------------------------------------------
        # NETTOYAGE DES RECETTES
        # ----------------------------------------------------

        cleaned = []


        for recipe in recipes:

            if not isinstance(
                recipe,
                dict
            ):
                continue


            title = str(
                recipe.get(
                    "title",
                    "Recette"
                )
            ).strip()


            prep_time = str(
                recipe.get(
                    "prepTime",
                    "Temps non indiqué"
                )
            ).strip()


            recipe_ingredients = recipe.get(
                "ingredients",
                []
            )


            recipe_steps = recipe.get(
                "steps",
                []
            )


            if not isinstance(
                recipe_ingredients,
                list
            ):
                recipe_ingredients = []


            if not isinstance(
                recipe_steps,
                list
            ):
                recipe_steps = []


            cleaned.append({

                "title": title,

                "prepTime": prep_time,

                "ingredients": [
                    str(x).strip()
                    for x in recipe_ingredients
                    if str(x).strip()
                ],

                "steps": [
                    str(x).strip()
                    for x in recipe_steps
                    if str(x).strip()
                ]

            })


        if not cleaned:

            raise ValueError(
                "Aucune recette valide retournée."
            )


        return jsonify(
            cleaned
        )


    except Exception as error:

        print(
            "ERREUR RECETTES :",
            repr(error)
        )

        return jsonify({
            "error": str(error)
        }), 500


# ============================================================
# TEST
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "status": "ok",
        "service": "Mes Repas API"
    })


# ============================================================
# LANCEMENT
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    app.run(
        host="0.0.0.0",
        port=port
    )
