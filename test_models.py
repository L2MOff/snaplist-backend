import google.generativeai as genai

# Ta clé (ne la partage pas normalement, mais là on teste)
api_key = "AIzaSyDpU4DC43VEjz2o6Ou6g1UFI3IrsPbM2Is"
genai.configure(api_key=api_key)

print("🔍 Recherche des modèles disponibles sur ton PC...")
print("-" * 30)

try:
    cpt = 0
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ TROUVÉ : {m.name}")
            cpt += 1
    
    if cpt == 0:
        print("❌ Aucun modèle trouvé. Problème de connexion ou de clé.")
    else:
        print("-" * 30)
        print("👉 Choisis un des noms ci-dessus (ex: models/gemini-pro) et mets-le dans main.py")

except Exception as e:
    print(f"❌ ERREUR CRITIQUE : {e}")
    print("Ton installation de google-generativeai est peut-être corrompue.")