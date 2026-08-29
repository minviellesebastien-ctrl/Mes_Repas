import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(name)
CORS(app)

PORT = int(os.environ.get("PORT", 5000))
URL = "https://text.pollinations.ai/"

@app.route("/")
def home():
    return jsonify({"status": "ok"})

@app.route("/api/recipes", methods=["POST"])
    def recipes():
data = request.get_json(silent=True) or {}
    ingredients = data.get("ingredients", [])
mode = data.get("mode", "simple")

if not ingredients:
    return jsonify({"error": "Aucun ingrédient fourni."}), 400

prompt = f"""

Tu es un cuisinier français.

Ingrédients disponibles :
{", ".join(str(x) for x in ingredients)}

Mode :
{mode}

Propose 6 recettes différentes pour 2 personnes.

Réponds uniquement avec un tableau JSON.
Chaque recette doit contenir :
title
prepTime
ingredients
steps

Exemple :
[
{{
"title": "Poulet aux légumes",
"prepTime": "25 min",
"ingredients": ["200 g de poulet", "1 courgette"],
"steps": ["Couper les ingrédients", "Cuire les ingrédients"]
}}
]
"""

try:
    response = requests.get(
        URL,
        params={
            "prompt": prompt,
            "model": "openai",
            "seed": -1
        },
        timeout=60
    )

    print("HTTP :", response.status_code)
    print("REPONSE IA :", response.text[:10000])

    if response.status_code != 200:
        return jsonify({
            "error": "Erreur IA HTTP " + str(response.status_code)
        }), 502

    text = response.text.strip()
    start = text.find("[")
    end = text.rfind("]")

    if start == -1 or end == -1:
        return jsonify({
            "error": "L'IA n'a pas renvoyé de JSON."
        }), 500

    result = json.loads(text[start:end + 1])

    if not isinstance(result, list):
        return jsonify({
            "error": "Réponse IA invalide."
        }), 500

    recipes_ok = []

    for recipe in result:
        if not isinstance(recipe, dict):
            continue

        if not recipe.get("title"):
            continue

        if not recipe.get("ingredients"):
            continue

        if not recipe.get("steps"):
            continue

        recipes_ok.append({
            "title": recipe.get("title"),
            "prepTime": recipe.get("prepTime", "Non indiqué"),
            "ingredients": recipe.get("ingredients"),
            "steps": recipe.get("steps")
        })

    print("RECETTES :", len(recipes_ok))

    if not recipes_ok:
        return jsonify({
            "error": "Aucune recette exploitable."
        }), 500

    return jsonify(recipes_ok[:6])

except Exception as error:
    print("ERREUR :", repr(error))
    return jsonify({"error": str(error)}), 500

if name == "main":
app.run(host="0.0.0.0", port=PORT)
