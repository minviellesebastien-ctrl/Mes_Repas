import os
import json
import requests

from flask import Flask, request, jsonify
from flask_cors import CORS


# ============================================================
# CONFIGURATION
# ============================================================

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("PORT", 5000))
URL = "https://text.pollinations.ai/"


# ============================================================
# PAGE TEST
# ============================================================

@app.route("/")
def home():
    return jsonify({
        "status": "ok",
        "service": "Mes Repas"
    })


# ============================================================
# GENERATION DES RECETTES
# ============================================================

@app.route("/api/recipes", methods=["POST"])
def recipes():

    try:

        # ----------------------------------------------------
        # DONNEES RECUES
        # ----------------------------------------------------

        data = request.get_json(silent=True) or {}

        ingredients = data.get(
            "ingredients",
            []
        )

        mode = data.get(
            "mode",
            "simple"
        )


        # ----------------------------------------------------
        # VERIFICATION
        # ----------------------------------------------------

        if not ingredients:

            return jsonify({
                "error": "Aucun ingrédient fourni."
            }), 400


        # ----------------------------------------------------
        # PROMPT
        # ----------------------------------------------------

        prompt = f"""
Tu es un cuisinier français.

Ingrédients disponibles :
{", ".join(str(x) for x in ingredients)}

Mode de cuisson :
{mode}

Propose 6 recettes différentes pour 2 personnes.

Utilise principalement les ingrédients disponibles.
Tu peux ajouter quelques ingrédients basiques.

Respecte le mode de cuisson choisi.

Réponds uniquement avec un tableau JSON valide.

[
  {{
    "title": "Poulet aux légumes",
    "prepTime": "25 min",
    "ingredients": [
      "200 g de poulet",
      "1 courgette"
    ],
    "steps": [
      "Couper les ingrédients.",
      "Cuire les ingrédients."
    ]
  }}
]

Le tableau doit contenir exactement 6 recettes.
"""


        # ----------------------------------------------------
        # APPEL IA
        # ----------------------------------------------------

        response = requests.get(
            URL,
            params={
                "prompt": prompt,
                "model": "openai",
                "seed": -1
            },
            timeout=60
        )


        # ----------------------------------------------------
        # LOGS RENDER
        # ----------------------------------------------------

        print(
            "HTTP :",
            response.status_code
        )

        print(
            "========== REPONSE IA =========="
        )

        print(
            response.text[:20000]
        )

        print(
            "========== FIN REPONSE IA =========="
        )


        # ----------------------------------------------------
        # ERREUR IA
        # ----------------------------------------------------

        if response.status_code != 200:

            return jsonify({
                "error":
                "Erreur IA HTTP "
                + str(response.status_code)
            }), 502


        # ----------------------------------------------------
        # RECUPERATION REPONSE
        # ----------------------------------------------------

        text = response.text.strip()


        if not text:

            return jsonify({
                "error":
                "L'IA a retourné une réponse vide."
            }), 500


        # ----------------------------------------------------
        # TROUVER LE JSON
        # ----------------------------------------------------

        start = text.find("[")


        if start == -1:

            return jsonify({
                "error":
                "L'IA n'a pas renvoyé de JSON."
            }), 500


        # ----------------------------------------------------
        # EXTRACTION DU PREMIER JSON
        # ----------------------------------------------------

        try:

            decoder = json.JSONDecoder()

            result, end = decoder.raw_decode(
                text[start:]
            )

        except json.JSONDecodeError as error:

            print(
                "ERREUR JSON :",
                repr(error)
            )

            return jsonify({
                "error":
                "Réponse JSON invalide."
            }), 500


        # ----------------------------------------------------
        # VERIFICATION LISTE
        # ----------------------------------------------------

        if not isinstance(
            result,
            list
        ):

            return jsonify({
                "error":
                "Réponse IA invalide."
            }), 500


        # ----------------------------------------------------
        # NETTOYAGE RECETTES
        # ----------------------------------------------------

        recipes_ok = []


        for recipe in result:

            if not isinstance(
                recipe,
                dict
            ):

                continue


            title = recipe.get(
                "title"
            )

            recipe_ingredients = recipe.get(
                "ingredients"
            )

            steps = recipe.get(
                "steps"
            )


            if not title:
                continue


            if not isinstance(
                recipe_ingredients,
                list
            ):
                continue


            if not recipe_ingredients:
                continue


            if not isinstance(
                steps,
                list
            ):
                continue


            if not steps:
                continue


            recipes_ok.append({

                "title":
                str(title),

                "prepTime":
                str(
                    recipe.get(
                        "prepTime",
                        "Non indiqué"
                    )
                ),

                "ingredients":
                recipe_ingredients,

                "steps":
                steps

            })


        # ----------------------------------------------------
        # LOG RESULTAT
        # ----------------------------------------------------

        print(
            "RECETTES EXPLOITABLES :",
            len(recipes_ok)
        )


        # ----------------------------------------------------
        # AUCUNE RECETTE
        # ----------------------------------------------------

        if not recipes_ok:

            return jsonify({
                "error":
                "Aucune recette exploitable."
            }), 500


        # ----------------------------------------------------
        # REPONSE PWA
        # ----------------------------------------------------

        return jsonify(
            recipes_ok[:6]
        )


    # ========================================================
    # ERREUR GENERALE
    # ========================================================

    except Exception as error:

        print(
            "ERREUR :",
            repr(error)
        )

        return jsonify({
            "error":
            str(error)
        }), 500


# ============================================================
# LANCEMENT LOCAL
# ============================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=PORT
      )
