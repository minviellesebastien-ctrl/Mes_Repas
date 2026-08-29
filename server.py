import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)  # Permet à ton application mobile de communiquer avec le serveur

@app.route('/api/recipes', methods=['POST'])
def get_recipes():
    data = request.json
    ingredients = data.get('ingredients', [])
    mode = data.get('mode', 'simple')
    api_key = data.get('apiKey', '')

    if not api_key:
        return jsonify({"error": "Clé API manquante"}), 400

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt = f"""
        Propose 4 recettes concrètes et bien détaillées adaptées spécifiquement au mode de cuisson "{mode}".
        Ingrédients principaux à utiliser : {', '.join(ingredients)}.

        Réponds EXCLUSIVEMENT sous la forme d'un tableau JSON avec des objets ayant exactement cette structure :
        [
          {{
            "title": "Nom de la recette",
            "prepTime": "20 min",
            "ingredients": ["ingrédient 1", "ingrédient 2"],
            "steps": ["Étape 1...", "Étape 2..."]
          }}
        ]
        """

        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        recipes = json.loads(text)

        return jsonify(recipes)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
      
