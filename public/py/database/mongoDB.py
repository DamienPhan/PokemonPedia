import json
from pymongo import MongoClient
from pymongo.errors import BulkWriteError
import logging
from pathlib import Path

# Configuration du logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Chemin relatif pour remonter de deux niveaux
final_output_path = Path("ressources/data_output/gen9ubers.json")

# Vérification si le fichier JSON existe
if not final_output_path.exists():
    logger.error(f"Erreur : le fichier '{final_output_path}' n'a pas été trouvé.")
    exit(1)

# Connexion MongoDB
client = MongoClient("mongodb://localhost:27017/")

# Créer une base de données et une collection
db = client['PokemonDB']  # Nom de la base de données
collection = db['PokemonData']  # Nom de la collection

# Supprimer les documents existants avec confirmation
if collection.count_documents({}) > 0:
    confirm = input(f"La collection {collection.name} contient {collection.count_documents({})} documents. Voulez-vous les supprimer avant de continuer ? (y/n) ")
    if confirm.lower() == 'y':
        collection.delete_many({})
        logger.info(f"Collection {collection.name} vidée.")

# Lire le fichier JSON et insérer les données
try:
    with open(final_output_path, 'r') as json_file:
        data = json.load(json_file)
        if isinstance(data, list):
            try:
                collection.insert_many(data, ordered=False)
                logger.info(f"{len(data)} documents insérés dans la collection {collection.name}.")
            except BulkWriteError as e:
                logger.warning(f"Certains documents n'ont pas pu être insérés en raison de doublons : {e.details}")
        else:
            logger.error("Les données JSON ne sont pas au format attendu (liste).")
except json.JSONDecodeError:
    logger.error("Erreur : le fichier JSON est mal formé.")
finally:
    client.close()
