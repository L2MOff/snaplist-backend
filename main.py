from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import uvicorn
import io
from PIL import Image
import google.generativeai as genai 
import os
import json 
from datetime import datetime
import urllib.parse 
import time # 👇 On a besoin de ça pour le "Cache Buster"

# Ta clé API
API_KEY = "AIzaSyDpU4DC43VEjz2o6Ou6g1UFI3IrsPbM2Is"
genai.configure(api_key=API_KEY)

# Modèle
model = genai.GenerativeModel("gemini-flash-latest")

app = FastAPI()

def sauvegarder_historique(titre_court, texte_complet, url_vinted):
    fichier_json = "historique_db.json"
    
    maintenant = datetime.now()
    nouvel_element = {
        "id": int(maintenant.timestamp()), 
        "date": maintenant.strftime("%d/%m/%Y"),
        "heure": maintenant.strftime("%H:%M"),
        "titre": titre_court,
        "texte": texte_complet,
        "url": url_vinted
    }
    
    donnees = []
    if os.path.exists(fichier_json):
        try:
            with open(fichier_json, "r", encoding="utf-8") as f:
                donnees = json.load(f)
        except:
            donnees = [] 

    donnees.insert(0, nouvel_element)
    
    with open(fichier_json, "w", encoding="utf-8") as f:
        json.dump(donnees, f, ensure_ascii=False, indent=4)

@app.get("/")
def home():
    return {"status": "SnapList Server V6 (Force Refresh) est en ligne 🟢"}

@app.get("/history")
def get_history():
    fichier_json = "historique_db.json"
    if os.path.exists(fichier_json):
        with open(fichier_json, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        prompt = """
        Tu es un expert Vinted.
        
        Règles pour SEARCH :
        1. IDENTIFIE la Marque et le MODÈLE PRÉCIS.
           - Ex: "Nike Air Force 1"
        2. INTERDIT : Ne mets JAMAIS la couleur, l'état, ou la taille dans SEARCH.
        
        Format de réponse :
        SEARCH : [Marque + Modèle]
        TITRE : [Titre complet vendeur]
        PRIX : [Estimation]
        ETAT : [État]
        DESCRIPTION : [Description]
        
        Règle : PAS de gras, PAS d'étoiles.
        """

        response = model.generate_content([prompt, image])
        resultat_brut = response.text.replace("*", "").strip()
        
        # --- TRAITEMENT ---
        lignes = resultat_brut.split('\n')
        mots_cles_pour_url = "Vêtement"
        lignes_propres = [] 
        
        for ligne in lignes:
            if "SEARCH" in ligne.upper():
                brut = ligne.split(":")[-1].strip()
                mots_cles_pour_url = brut
            else:
                if ligne.strip() != "":
                    lignes_propres.append(ligne)
        
        resultat_final = "\n".join(lignes_propres)
        
        # --- FABRICATION DU LIEN "FORCE REFRESH" ---
        titre_encode = urllib.parse.quote(mots_cles_pour_url)
        
        # On ajoute un timestamp (l'heure en secondes) pour que Vinted croit que c'est une nouvelle demande
        timestamp = int(time.time())
        
        # On garde le tri par prix, et on ajoute le timestamp à la fin
        url_vinted = f"https://www.vinted.fr/catalog?search_text={titre_encode}&order=price_low_to_high&time={timestamp}"

        sauvegarder_historique(mots_cles_pour_url, resultat_final, url_vinted)

        return {
            "resultat": resultat_final,
            "url_vinted": url_vinted 
        }

    except Exception as e:
        print(f"Erreur : {e}")
        return {"resultat": f"Erreur : {str(e)}", "url_vinted": ""}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)