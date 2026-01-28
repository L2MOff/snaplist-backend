import google.generativeai as genai

# ⚠️ COLLE TA CLÉ GOOGLE ICI
genai.configure(api_key="AIzaSyDpU4DC43VEjz2o6Ou6g1UFI3IrsPbM2Is")

print("🔍 Recherche des modèles disponibles pour toi...")

try:
    for m in genai.list_models():
        # On cherche les modèles qui acceptent du contenu (texte + image)
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Erreur d'accès : {e}")