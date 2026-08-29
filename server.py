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

def clean_json_text(text):
    """
    Nettoie la réponse de l'IA pour récupérer uniquement
    le tableau JSON.
    """

    text = text.strip()

    # Supprime les éventuelles balises Markdown
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

    # Cherche le premier [ et le dernier ]
    first = text.find("[")
    last = text.rfind("]")

    if first == -1 or last == -1 or last <= first:
        raise ValueError(
            "La réponse de l'IA ne contient pas de JSON valide."
        )

    return text[first:last + 1]


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


# ============================================================
# ROUTE PRINCIPALE
# ============================================================

@app.route("/api/recipes", methods=["POST"])
def generate_recipes():

    try:

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
        # VERIFICATION
        # ----------------------------------------------------

        if not ingredients:

            return jsonify({
                "error": "Aucun ingrédient fourni."
            }), 400


        # Nettoyage des ingrédients
        ingredients = [
            str(item).strip()
            for item in ingredients
            if str(item).strip()
        ]


        if not ingredients:

            return jsonify({
                "error": "Aucun ingrédient valide."
            }), 400


        mode_label = get_mode_label(
            mode
        )


        ingredients_text = ", ".join(
            ingredients
        )


        # ----------------------------------------------------
        # PROMPT IA
        # ----------------------------------------------------

        prompt = f"""
Tu es un excellent cuisinier français.

Tu dois proposer des recettes variées à partir des ingrédients
disponibles chez l'utilisateur.

INGRÉDIENTS DISPONIBLES :
{ingredients_text}

MODE DE CUISSON CHOISI :
{mode_label}

Crée exactement 6 recettes différentes.

IMPORTANT :

1. Utilise en priorité les ingrédients disponibles.

2. Tu peux ajouter quelques ingrédients basiques nécessaires
   à la recette, par exemple :
   huile, beurre, sel, poivre, épices, herbes, farine,
   crème, lait, etc.

3. Ne propose pas six variantes de la même recette.
   Les recettes doivent être réellement différentes.

4. Respecte IMPÉRATIVEMENT le mode de cuisson choisi.

5. Si le mode est "Poêle / Four" :
   les recettes peuvent utiliser une poêle, une casserole
   ou le four.

6. Si le mode est "Cookeo" :
   les recettes doivent être adaptées à une cuisson au Cookeo.
   Indique les temps et manipulations adaptés.

7. Si le mode est "Air Fryer" :
   les recettes doivent réellement être réalisables
   à l'Air Fryer.
   Indique la température en °C et le temps de cuisson.

8. Si le mode est "Sans cuisson" :
   aucune étape ne doit nécessiter de cuisson.
   Propose plutôt des salades, tartares, wraps, sandwichs,
   préparations froides, etc.

9. Donne des quantités réalistes pour 2 personnes.

10. Les recettes doivent être simples et réalisables
    à la maison.

11. Les recettes doivent être en français.

12. Donne un temps réaliste de préparation et cuisson.

13. Ne donne aucune explication en dehors du JSON.

Retourne UNIQUEMENT un tableau JSON valide.

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
      "Découper le poulet et les légumes.",
      "Faire chauffer la poêle.",
      "Cuire le poulet pendant 8 minutes.",
      "Ajouter les légumes et poursuivre la cuisson."
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
            timeout=45
        )


        # Vérification HTTP
        if response.status_code != 200:

            raise RuntimeError(
                f"Pollinations HTTP {response.status_code} : "
                f"{response.text[:300]}"
            )


        raw_text = response.text.strip()


        if not raw_text:

            raise RuntimeError(
                "Pollinations a retourné une réponse vide."
            )


        # ----------------------------------------------------
        # PARSE JSON
        # ----------------------------------------------------

        json_text = clean_json_text(
            raw_text
        )

        recipes = json.loads(
            json_text
        )


        if not isinstance(
            recipes,
            list
        ):

            raise ValueError(
                "Le résultat n'est pas une liste de recettes."
            )


        # ----------------------------------------------------
        # NETTOYAGE
        # ----------------------------------------------------

        cleaned_recipes = []


        for recipe in recipes:

            if not isinstance(
                recipe,
                dict
            ):
                continue


            title = str(
                recipe.get(
                    "title",
                    "Recette sans nom"
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


            cleaned_recipes.append({

                "title": title,

                "prepTime": prep_time,

                "ingredients": [
                    str(item).strip()
                    for item in recipe_ingredients
                    if str(item).strip()
                ],

                "steps": [
                    str(item).strip()
                    for item in recipe_steps
                    if str(item).strip()
                ]

            })


        if not cleaned_recipes:

            raise ValueError(
                "Aucune recette valide n'a été générée."
            )


        # ----------------------------------------------------
        # REPONSE
        # ----------------------------------------------------

        return jsonify(
            cleaned_recipes
        )


    except requests.exceptions.Timeout:

        return jsonify({
            "error":
            "L'IA met trop de temps à répondre."
        }), 504


    except requests.exceptions.RequestException as error:

        print(
            "ERREUR RESEAU POLLINATIONS :",
            repr(error)
        )

        return jsonify({
            "error":
            "Impossible de communiquer avec Pollinations."
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
# TEST DU SERVEUR
# ============================================================

@app.route("/", methods=["GET"])
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
