import os
import json
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


def clean_recipe(recipe):

    if not isinstance(recipe, dict):
        return None

    title = str(
        recipe.get("title", "")
    ).strip()

    prep_time = str(
        recipe.get("prepTime", "")
    ).strip()

    ingredients = recipe.get(
        "ingredients",
        []
    )

    steps = recipe.get(
        "steps",
        []
    )

    if not title:
        return None

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

    if not ingredients:
        return None

    if not steps:
        return None

    if not prep_time:
        prep_time = "Non indiqué"

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
        # DONNEES DE LA PWA
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

        system_prompt = """
Tu es un excellent cuisinier français.

Tu dois créer des recettes variées, simples et réalistes
pour 2 personnes.

Tu réponds obligatoirement avec un tableau JSON valide.

Chaque recette doit avoir exactement ces propriétés :

title
prepTime
ingredients
steps

ingredients et steps doivent être des tableaux de textes.

Ne mets aucun texte en dehors du JSON.
"""


        user_prompt = f"""
Voici les ingrédients disponibles :

{ingredients_text}

Mode de cuisson choisi :

{mode_label}

Crée exactement 6 recettes différentes.

Règles :

- Utilise en priorité les ingrédients disponibles.
- Tu peux ajouter quelques ingrédients basiques :
  huile, beurre, sel, poivre, épices, herbes, farine,
  crème ou lait.
- Les 6 recettes doivent être réellement différentes.
- Les recettes sont pour 2 personnes.
- Les recettes doivent être simples.

Mode Poêle / Four :
Utilise poêle, casserole ou four.

Mode Cookeo :
Les recettes doivent être adaptées au Cookeo.

Mode Air Fryer :
Les recettes doivent être adaptées à l'Air Fryer.
Indique la température et le temps dans les étapes.

Mode Sans cuisson :
Aucune cuisson. Préparations froides uniquement.

Retourne exactement 6 recettes.
"""


        # ----------------------------------------------------
        # APPEL POLLINATIONS
        # ----------------------------------------------------

        payload = {

            "messages": [

                {
                    "role": "system",
                    "content": system_prompt
                },

                {
                    "role": "user",
                    "content": user_prompt
                }

            ],

            "model": "openai",

            "seed": -1,

            "jsonMode": True

        }


        response = requests.post(
            POLLINATIONS_URL,
            json=payload,
            timeout=60
        )


        # ----------------------------------------------------
        # VERIFICATION HTTP
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

            return jsonify({
                "error":
                f"Service IA indisponible ({response.status_code})."
            }), 502


        raw_text = response.text.strip()


        print(
            "Réponse Pollinations reçue :",
            len(raw_text),
            "caractères"
        )


        if not raw_text:

            return jsonify({
                "error":
                "Le service IA a retourné une réponse vide."
            }), 502


        # ----------------------------------------------------
        # LECTURE JSON
        # ----------------------------------------------------

        try:

            result = response.json()

        except Exception:

            print(
                "Réponse brute :",
                raw_text[:2000]
            )

            return jsonify({
                "error":
                "La réponse du service IA n'est pas du JSON."
            }), 502


        # ----------------------------------------------------
        # RECUPERATION DU CONTENU
        # ----------------------------------------------------

        if isinstance(
            result,
            list
        ):

            recipes_data = result

        elif isinstance(
            result,
            dict
        ):

            # Certains endpoints peuvent retourner
            # directement un objet contenant le contenu.

            if isinstance(
                result.get("recipes"),
                list
            ):

                recipes_data = result["recipes"]

            elif isinstance(
                result.get("content"),
                list
            ):

                recipes_data = result["content"]

            elif isinstance(
                result.get("choices"),
                list
            ):

                content = result["choices"][0].get(
                    "message",
                    {}
                ).get(
                    "content",
                    ""
                )

                if isinstance(
                    content,
                    str
                ):

                    recipes_data = json.loads(
                        content
                    )

                else:

                    recipes_data = content

            else:

                # Réponse JSON contenant éventuellement
                # une chaîne JSON dans une propriété.

                recipes_data = None

                for value in result.values():

                    if isinstance(
                        value,
                        str
                    ):

                        try:

                            possible = json.loads(
                                value
                            )

                            if isinstance(
                                possible,
                                list
                            ):

                                recipes_data = possible
                                break

                        except Exception:
                            pass

        else:

            recipes_data = None


        # ----------------------------------------------------
        # VERIFICATION
        # ----------------------------------------------------

        if not isinstance(
            recipes_data,
            list
        ):

            print(
                "Structure reçue :",
                repr(result)[:3000]
            )

            return jsonify({
                "error":
                "L'IA a répondu mais aucune liste de recettes "
                "n'a été trouvée."
            }), 500


        # ----------------------------------------------------
        # NETTOYAGE
        # ----------------------------------------------------

        cleaned_recipes = []


        for recipe in recipes_data:

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

            print(
                "Données reçues :",
                repr(recipes_data)[:3000]
            )

            return jsonify({
                "error":
                "L'IA a répondu mais aucune recette exploitable "
                "n'a été trouvée."
            }), 500


        # Maximum 6 recettes
        cleaned_recipes = cleaned_recipes[:6]


        # ----------------------------------------------------
        # REPONSE A LA PWA
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
            "Impossible de communiquer avec Pollinations."
        }), 502


    except Exception as error:

        print(
            "ERREUR GENERATION :",
            repr(error)
        )

        return jsonify({
            "error":
            str(error)
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

        "status":
        "ok",

        "service":
        "Mes Repas",

        "ai":
        "Pollinations"

    })


# ============================================================
# LANCEMENT
# ============================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=PORT
      )
