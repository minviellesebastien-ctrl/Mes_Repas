import os
import requests

from flask import Flask, request, jsonify
from flask_cors import CORS


app = Flask(__name__)
CORS(app)


PORT = int(os.environ.get("PORT", 5000))

API_KEY = os.environ.get("POLLINATIONS_API_KEY")

API_URL = "https://gen.pollinations.ai/v1/chat/completions"


@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "status": "ok",
        "service": "Mes Repas"
    })


@app.route("/api/recipes", methods=["POST"])
def recipes():

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


        if not ingredients:

            return jsonify({
                "error":
                "Aucun ingrédient fourni."
            }), 400


        if not API_KEY:

            return jsonify({
                "error":
                "Clé Pollinations absente dans Render."
            }), 500


        ingredients_text = ", ".join(
            str(x)
            for x in ingredients
        )


        prompt = f"""
Tu es un excellent cuisinier français.

L'utilisateur possède :

{ingredients_text}

Mode de cuisson :
{mode}

Propose exactement 6 recettes différentes
pour 2 personnes.

Utilise principalement les ingrédients disponibles.
Tu peux ajouter quelques ingrédients basiques.

Respecte le mode de cuisson.

Pour chaque recette, utilise cette structure :

🍽️ Nom de la recette
⏱️ Temps

Ingrédients :
- quantité + ingrédient
- quantité + ingrédient

Préparation :
1. Étape.
2. Étape.
3. Étape.

Sépare clairement les 6 recettes.

Réponds uniquement avec les recettes.
Pas d'introduction.
Pas de conclusion.
"""


        response = requests.post(
            API_URL,

            headers={
                "Authorization":
                f"Bearer {API_KEY}",

                "Content-Type":
                "application/json"
            },

            json={
                "model": "openai",

                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],

                "temperature": 0.9
            },

            timeout=90
        )


        print(
            "HTTP IA :",
            response.status_code
        )


        print(
            "REPONSE IA :",
            response.text[:3000]
        )


        if response.status_code != 200:

            return jsonify({
                "error":
                "Erreur Pollinations HTTP "
                + str(response.status_code)
            }), 502


        result = response.json()


        text = (
            result
            .get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )


        if not text:

            return jsonify({
                "error":
                "L'IA n'a retourné aucun texte."
            }), 500


        return jsonify({
            "recipes": text
        })


    except requests.exceptions.Timeout:

        return jsonify({
            "error":
            "L'IA met trop de temps à répondre."
        }), 504


    except Exception as error:

        print(
            "ERREUR :",
            repr(error)
        )

        return jsonify({
            "error":
            str(error)
        }), 500


if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=PORT
      )
