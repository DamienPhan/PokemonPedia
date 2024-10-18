import json
from pymongo import MongoClient

final_output_path = "ressources\data_output\gen9vgc2024reghbo3-1760_joined.json"
client = MongoClient("mongodb://localhost:27017/")

# Créer une base de données
db = client['PokemonDB']  # Nom de la base de données
collection = db['PokemonData']  # Nom de la collection

# Lire le fichier JSON et insérer les données dans MongoDB
with open(final_output_path, 'r') as json_file:
    data = json.load(json_file)  # Charger le contenu du fichier JSON
    collection.insert_many(data)  # Insérer les données dans la collection

print(f"{len(data)} documents insérés dans la collection {collection.name} de la base de données {db.name}.")

# Fermer la connexion à MongoDB
client.close()
