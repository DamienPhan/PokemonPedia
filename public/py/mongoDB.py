import json
from pymongo import MongoClient

# Chemin relatif pour remonter de deux niveaux
final_output_path = "/Users/lucaswallner/Desktop/BUT/Semestre5/R505/git/2024_R510/ressources/data_output/gen9vgc2024reghbo3-1760_joined.json"
client = MongoClient("mongodb://localhost:27017/")

# Créer une base de données
db = client['PokemonDB']  # Nom de la base de données
collection = db['PokemonData']  # Nom de la collection

# Lire le fichier JSON et insérer les données dans MongoDB
try:
    with open(final_output_path, 'r') as json_file:
        data = json.load(json_file)  # Charger le contenu du fichier JSON
        collection.insert_many(data)  # Insérer les données dans la collection

    print(f"{len(data)} documents insérés dans la collection {collection.name} de la base de données {db.name}.")

except FileNotFoundError:
    print(f"Erreur : le fichier '{final_output_path}' n'a pas été trouvé.")
except json.JSONDecodeError:
    print("Erreur : le fichier JSON est mal formé.")
finally:
    # Fermer la connexion à MongoDB
    client.close()
