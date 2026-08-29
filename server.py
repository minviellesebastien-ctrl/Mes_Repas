import os
import requests

from flask import Flask, request, jsonify
from flask_cors import CORS


app = Flask(__name__)
CORS(app)


PORT = int(os.environ.get("PORT", 5000))

POLLINATIONS_URL = "https://text.pollinations.ai/"


@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "status": "ok",
        "service": "Mes Repas",
        "ai": "Pollinations"
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
                "error": "Aucun ingrédient fourni."
            }), 400


        ingredients_text = ", ".join(
            str(x)
            for x in ingredients
        )


        prompt = f"""
Tu es un excellent cuisinier français.

L'utilisateur possède ces ingrédients :

{ingredients_text}

Mode de cuisson choisi :
{mode}

Propose exactement 6 recettes réellement différentes
pour 2 personnes.

Utilise en priorité les ingrédients disponibles.
Tu peux ajouter quelques ingrédients basiques si nécessaire.

Respecte le mode de cuisson choisi.

Pour chaque recette, utilise exactement cette petite structure :

🍽️ NOM DE LA RECETTE
⏱️ TEMPS

Ingrédients :
- quantité + ingrédient
- quantité + ingrédient
- quantité + ingrédient

Préparation :
1. Première étape.
2. Deuxième étape.
3. Troisième étape.

Sépare clairement chaque recette.

Les recettes doivent être simples, variées,
réalistes et appétissantes.

Ne donne aucune introduction.
Ne donne aucune conclusion.
Réponds uniquement avec les 6 recettes.
"""


        response = requests.get(
            POLLINATIONS_URL,
            params={
                "prompt": prompt,
                "model": "openai",
                "seed": -1
            },
            timeout=60
        )


        print(
            "HTTP IA :",
            response.status_code
        )


        if response.status_code != 200:

            print(
                "ERREUR IA :",
                response.text[:1000]
            )

            return jsonify({
                "error":
                "Le service IA a retourné une erreur HTTP "
                + str(response.status_code)
            }), 502


        text = response.text.strip()


        print(
            "REPONSE IA :",
            text[:3000]
        )


        if not text:

            return jsonify({
                "error":
                "L'IA a retourné une réponse vide."
            }), 500


        return jsonify({
            "recipes": text
        })


    except requests.exceptions.Timeout:

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
            "ERREUR SERVEUR :",
            repr(error)
        )

        return jsonify({
            "error": str(error)
        }), 500


if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=PORT
      )
