import os
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


def clean_text(text):

    if not text:
        return ""

    text = str(text)

    text = text.replace(
        "\r\n",
        "\n"
    )

    text = text.replace(
        "\r",
        "\n"
    )

    return text.strip()


# ============================================================
# PARSING DES RECETTES
# ============================================================

def parse_recipes(text):

    """
    Transforme la réponse texte de l'IA en recettes.

    Format attendu :

    RECETTE 1
    TITRE: ...
    TEMPS: ...

    INGREDIENTS:
    - ...
    - ...

    ETAPES:
    1. ...
    2. ...

    FIN RECETTE
    """

    text = clean_text(text)

    if not text:
        return []


    # Suppression éventuelle des balises Markdown
    text = re.sub(
        r"```(?:text)?",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = text.replace(
        "```",
        ""
    ).strip()


    # --------------------------------------------------------
    # Séparation des recettes
    # --------------------------------------------------------

    blocks = re.split(
        r"(?=RECETTE\s*\d+\s*)",
        text,
        flags=re.IGNORECASE
    )


    recipes = []


    for block in blocks:

        block = block.strip()


        if not block:
            continue


        # ----------------------------------------------------
        # TITRE
        # ----------------------------------------------------

        title_match = re.search(
            r"TITRE\s*:\s*(.+)",
            block,
            flags=re.IGNORECASE
        )


        if not title_match:
            continue


        title = title_match.group(
            1
        ).strip()


        # ----------------------------------------------------
        # TEMPS
        # ----------------------------------------------------

        time_match = re.search(
            r"TEMPS\s*:\s*(.+)",
            block,
            flags=re.IGNORECASE
        )


        prep_time = (
            time_match.group(1).strip()
            if time_match
            else "Non indiqué"
        )


        # ----------------------------------------------------
        # INGREDIENTS
        # ----------------------------------------------------

        ingredients_match = re.search(
            r"INGREDIENTS\s*:\s*(.*?)(?=\n\s*ETAPES\s*:)",
            block,
            flags=re.IGNORECASE | re.DOTALL
        )


        ingredients = []


        if ingredients_match:

            ingredients_text = ingredients_match.group(
                1
            ).strip()


            for line in ingredients_text.split("\n"):

                line = line.strip()

                line = re.sub(
                    r"^[-•*]\s*",
                    "",
                    line
                )

                line = re.sub(
                    r"^\d+[\.\)]\s*",
                    "",
                    line
                )

                if line:
                    ingredients.append(
                        line
                    )


        # ----------------------------------------------------
        # ETAPES
        # ----------------------------------------------------

        steps_match = re.search(
            r"ETAPES\s*:\s*(.*?)(?=\n\s*FIN\s+RECETTE|\Z)",
            block,
            flags=re.IGNORECASE | re.DOTALL
        )


        steps = []


        if steps_match:

            steps_text = steps_match.group(
                1
            ).strip()


            for line in steps_text.split("\n"):

                line = line.strip()

                line = re.sub(
                    r"^\d+[\.\)]\s*",
                    "",
                    line
                )

                line = re.sub(
                    r"^[-•*]\s*",
                    "",
                    line
                )

                if line:
                    steps.append(
                        line
                    )


        # ----------------------------------------------------
        # RECETTE VALIDE
        # ----------------------------------------------------

        if (
            title
            and ingredients
            and steps
        ):

            recipes.append({

                "title":
                title,

                "prepTime":
                prep_time,

                "ingredients":
                ingredients,

                "steps":
                steps

            })


    return recipes


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

L'utilisateur possède ces ingrédients :

{ingredients_text}

MODE DE CUISSON :
{mode_label}

Crée exactement 6 recettes différentes pour 2 personnes.

Les recettes doivent être variées, simples et bonnes.

Utilise en priorité les ingrédients disponibles.
Tu peux ajouter quelques ingrédients basiques :
huile, beurre, sel, poivre, épices, herbes, farine,
crème, lait, etc.

Respecte impérativement le mode de cuisson.

POÊLE / FOUR :
Poêle, casserole ou four.

COOKEO :
Recettes adaptées au Cookeo.

AIR FRYER :
Recettes adaptées à l'Air Fryer avec température en °C
et temps de cuisson.

SANS CUISSON :
Aucune cuisson. Préparations froides uniquement.

IMPORTANT :

NE PRODUIS PAS DE JSON.

NE PRODUIS PAS DE MARKDOWN.

Utilise EXACTEMENT le format texte suivant.

RECETTE 1
TITRE: Nom de la recette
TEMPS: 25 min
INGREDIENTS:
- 200 g de poulet
- 1 courgette
- 10 cl de crème
ETAPES:
1. Couper le poulet.
2. Couper la courgette.
3. Faire cuire le poulet.
4. Ajouter la courgette et la crème.
FIN RECETTE

RECETTE 2
TITRE: Nom de la deuxième recette
TEMPS: 30 min
INGREDIENTS:
- ...
- ...
ETAPES:
1. ...
2. ...
3. ...
FIN RECETTE

Continue exactement de la même manière jusqu'à
RECETTE 6.

RÈGLE ABSOLUE :
Chaque recette doit avoir un TITRE, un TEMPS,
au moins 2 INGREDIENTS et au moins 2 ETAPES.

Ne mets absolument aucun texte avant RECETTE 1.
Ne mets absolument aucun texte après FIN RECETTE de la recette 6.
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
        # HTTP
        # ----------------------------------------------------

        if response.status_code not in (
            200,
            206
        ):

            print(
                "POLLINATIONS HTTP:",
                response.status_code
            )

            return jsonify({
                "error":
                "Le service IA a retourné une erreur."
            }), 502


        raw_text = response.text.strip()


        if not raw_text:

            return jsonify({
                "error":
                "Le service IA a retourné une réponse vide."
            }), 502


        # ----------------------------------------------------
        # LOG COURT
        # ----------------------------------------------------

        print(
            "========== IA =========="
        )

        print(
            "Réponse reçue :",
            len(raw_text),
            "caractères"
        )

        print(
            raw_text[:2000]
        )

        print(
            "========== FIN IA =========="
        )


        # ----------------------------------------------------
        # PARSING
        # ----------------------------------------------------

        recipes = parse_recipes(
            raw_text
        )


        print(
            "Recettes exploitables :",
            len(recipes)
        )


        # ----------------------------------------------------
        # VERIFICATION
        # ----------------------------------------------------

        if not recipes:

            return jsonify({
                "error":
                "L'IA a répondu mais le format des recettes "
                "n'a pas pu être reconnu."
            }), 500


        # Maximum 6 recettes
        recipes = recipes[:6]


        return jsonify(
            recipes
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
            "error":
            str(error)
        }), 500


# ============================================================
# TEST DU SERVEUR
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
