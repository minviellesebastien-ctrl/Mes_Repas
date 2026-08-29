import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(name)
CORS(app)

PORT = int(os.environ.get("PORT", 5000))

@app.route("/", methods=["GET"])
def home():
return jsonify({"status": "ok", "service": "Mes Repas"})

@app.route("/api/recipes", methods=["POST"])
def recipes():
data = request.get_json(silent=True) or {}

ingredients = data.get("ingredients", [])
mode = data.get("mode", "simple")

if not ingredients:
    return jsonify({"error": "Aucun ingrédient fourni."}), 400

ingredients_text = ", ".join(str(x) for x in ingredients)

prompt = f"""

Tu es un excellent cuisinier français.

Ingrédients disponibles :
{ingredients_text}

Mode de cuisson :
{mode}

Propose exactement 6 recettes différentes pour 2 personnes.

Utilise principalement les ingrédients disponibles.
Tu peux ajouter des ingrédients basiques.

Respecte impérativement le mode de cuisson.

Réponds uniquement avec un tableau JSON.

[
{{
"title": "Nom de la recette",
"prepTime": "25 min",
"ingredients": ["200 g de poulet", "1 courgette"],
"steps": ["Couper les ingrédients.", "Cuire les ingrédients."]
}}
]
"""

try:
    response = requests.get(
        "https://text.pollinations.ai/",
        params={
            "prompt": prompt,
            "model": "openai",
            "seed": -1
        },
        timeout=60
    )

    print("========== POLLINATIONS ==========")
    print("HTTP :", response.status_code)
    print(response.text[:10000])
    print("========== FIN ==========")

    if response.status_code != 200:
        return jsonify({
            "error": "Pollinations HTTP " + str(response.status_code)
        }), 502

    text = response.text.strip()

    start = text.find("[")
    end = text.rfind("]")

    if start == -1 or end == -1:
        return jsonify({
            "error": "Aucun JSON trouvé dans la réponse de l'IA."
        }), 500

    recipes_data = json.loads(text[start:end + 1])

    if not isinstance(recipes_data, list):
        return jsonify({
            "error": "La réponse de l'IA n'est pas une liste."
        }), 500

    result = []

    for recipe in recipes_data:
        if not isinstance(recipe, dict):
            continue

        if not recipe.get("title"):
            continue

        if not recipe.get("ingredients"):
            continue

        if not recipe.get("steps"):
            continue

        result.append({
            "title": str(recipe.get("title")),
            "prepTime": str(recipe.get("prepTime", "Temps non indiqué")),
            "ingredients": recipe.get("ingredients"),
            "steps": recipe.get("steps")
        })

    print("RECETTES EXPLOITABLES :", len(result))

    if not result:
        return jsonify({
            "error": "L'IA a répondu mais aucune recette exploitable n'a été trouvée."
        }), 500

    return jsonify(result[:6])

except Exception as error:
    print("ERREUR :", repr(error))
    return jsonify({
        "error": str(error)
    }), 500

if name == "main":
app.run(host="0.0.0.0", port=PORT)
