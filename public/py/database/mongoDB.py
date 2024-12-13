import json
from pymongo import MongoClient
from pymongo.errors import BulkWriteError
import logging
from pathlib import Path

# Permet la création de la BD ainsi que l insertion du JSON contenant les données des pokemon du format.

final_output_path = Path("ressources/data_output/gen9ubers.json")

client = MongoClient("mongodb://localhost:27017/")
db = client['PokemonDB']  
collection = db['PokemonData']  


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

if not final_output_path.exists():
    logger.error(f"Erreur : le fichier '{final_output_path}' n'a pas été trouvé.")
    exit(1)
    
if collection.count_documents({}) > 0:
    confirm = input(f"La collection {collection.name} contient {collection.count_documents({})} documents. Voulez-vous les supprimer avant de continuer ? (y/n) ")
    if confirm.lower() == 'y':
        collection.delete_many({})
        logger.info(f"Collection {collection.name} vidée.")

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
