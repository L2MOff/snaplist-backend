from fastapi import FastAPI, UploadFile, File
import google.generativeai as genai
import os
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json

# Charger les variables d'environnement (si en local)
load_dotenv()

app = FastAPI()

# Autoriser l'app mobile à nous parler
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration de l'IA
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise ValueError("La clé API Google est introuvable !")

genai.configure(api_key=API_KEY)

# On configure le modèle pour répondre en JSON (Format de données strict)
model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})

@app.get("/")
def home():
    return {"message": "SnapList AI Server V2 (JSON Mode) is running!"}

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        # Lire l'image
        image_bytes = await file.read()
        
        # Le Prompt Vente Multi-Plateforme 🛍️
        prompt = """
        Tu es un expert en vente en ligne (Vinted, Leboncoin, eBay).
        Analyse cette photo et génère une annonce de vente optimisée.
        
        Tu dois répondre UNIQUEMENT au format JSON avec exactement ces champs :
        {
            "titre_vinted": "Un titre court et percutant pour Vinted (Max 5 mots, inclure Marque et Type)",
            "titre_leboncoin": "Un titre descriptif pour Leboncoin (plus formel)",
            "description": "Une description complète, vendeuse, précisant l'état, la couleur, la matière si visible. Utilise des emojis.",
            "prix_estime": "Juste le chiffre (ex: 25)",
            "couleur": "La couleur dominante",
            "marque": "La marque devinée ou 'Inconnue'",
            "etat": "L'état supposé (ex: Très bon état, Neuf avec étiquette)",
            "hashtags": "Une liste de 5 hashtags pertinents (ex: #nike #vintage)"
        }
        """

        # Interroger Gemini
        response = model.generate_content([
            {"mime_type": "image/jpeg", "data": image_bytes},
            prompt
        ])

        # Convertir la réponse texte en vrai objet JSON
        resultat_json = json.loads(response.text)

        # On renvoie le tout proprement
        return resultat_json

    except Exception as e:
        return {"erreur": str(e)}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)