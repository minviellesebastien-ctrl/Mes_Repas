import os
import json
import requests

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(name)
CORS(app)

POLLINATIONS_URL = "https://text.pollinations.ai/"
PORT = int(os.environ.get("PORT", 5000))

def get_mode_label(mode):
modes = {
"simple": "Poêle / Four",
"cookeo": "Cookeo",
"airfryer": "Air Fryer",
"sans-cuisson": "Sans cuisson"
}
return modes.get(mode, "Poêle / Four")

def clean_recipe(recipe):
if not isinstance(recipe, dict):
return None

title = str(recipe.get("title", "")).strip()
prep_time = str(recipe.get("prepTime", "")).strip()

ingredients = recipe.get("ingredients", [])
steps = recipe.get("steps", [])

if not isinstance(ingredients, list):
    ingredients = []

if not isinstance(steps, list):
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

if not title or not ingredients or not steps:
    return None

return {
    "title": title,
    "prepTime": prep_time or "Temps non indiqué",
    "ingredients": ingredients,
    "steps": steps
}

def extract_json(text):
if not text:
return []

text = text.strip()

start = text.find("[")
end = text.rfind("]")

if start == -1 or end == -1 or end <= start:
    return []

json_text = text[start:end + 1]

try:
    data = json.loads(json_text)

    if isinstance(data, list):
        return data

except Exception as error:
    print("ERREUR JSON :", error)

return []

@app.route("/api/recipes", methods=["POST"])
def generate_recipes():

try:
    data = request.get_json(silent=True) or {}

    ingredients = data.get("ingredients", [])
    mode = data.get("mode", "simple")

    if not isinstance(ingredients, list):
        ingredients = []

    ingredients = [
        str(x).strip()
        for x in ingredients
        if str(x).strip()
    ]

    if not ingredients:
        return jsonify({
            "error": "Aucun ingrédient fourni."
        }), 400

    mode_label = get_mode_label(mode)

    ingredients_text = ", ".join(ingredients)

    prompt = f"""

Tu es un excellent cuisinier français.

Ingrédients disponibles :
{ingredients_text}

Mode de cuisson :
{mode_label}

Propose exactement 6 recettes différentes pour 2 personnes.

Utilise principalement les ingrédients disponibles.
Tu peux ajouter des ingrédients basiques comme huile,
beurre, sel, poivre, épices, herbes, crème ou lait.

Respecte impérativement le mode de cuisson.

Pour chaque recette, donne :

- title
- prepTime
- ingredients
- steps

Réponds uniquement avec un tableau JSON valide.

Format :

[
{{
"title": "Poulet aux courgettes",
"prepTime": "25 min",
"ingredients": [
"200 g de poulet",
"1 courgette",
"1 cuillère à soupe d'huile"
],
"steps": [
"Couper le poulet et la courgette.",
"Faire chauffer l'huile.",
"Cuire le poulet.",
"Ajouter la courgette et terminer la cuisson."
]
}}
]

Aucun texte avant le JSON.
Aucun texte après le JSON.
"""

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

    print("========== REPONSE POLLINATIONS ==========")
    print("HTTP :", response.status_code)
    print(response.text[:10000])
    print("========== FIN REPONSE ==========")

    if response.status_code != 200:

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

    recipes = extract_json(raw_text)

    cleaned_recipes = []

    for recipe in recipes:

        cleaned = clean_recipe(recipe)

        if cleaned:
            cleaned_recipes.append(cleaned)

    print(
        "RECETTES EXPLOITABLES :",
        len(cleaned_recipes)
    )

    if not cleaned_recipes:

        return jsonify({
            "error":
            "L'IA a répondu mais aucune recette exploitable n'a été trouvée."
        }), 500

    return jsonify(
        cleaned_recipes[:6]
    )

except requests.exceptions.Timeout:

    print("ERREUR : timeout Pollinations")

    return jsonify({
        "error":
        "L'IA met trop de temps à répondre."
    }), 504

except requests.exceptions.RequestException as error:

    print("ERREUR RESEAU :", repr(error))

    return jsonify({
        "error":
        "Impossible de communiquer avec Pollinations."
    }), 502

except Exception as error:

    print("ERREUR SERVEUR :", repr(error))

    return jsonify({
        "error": str(error)
    }), 500

@app.route("/")
def home():

return jsonify({
    "status": "ok",
    "service": "Mes Repas",
    "ai": "Pollinations"
})

if name == "main":

app.run(
    host="0.0.0.0",
    port=PORT
)
