from pyspark.sql import SparkSession
from pyspark.sql.functions import col, lit
from pyspark.ml.clustering import KMeans
from pyspark.ml.feature import VectorAssembler, MinMaxScaler
import random

# Initialisation de la session Spark
spark = SparkSession.builder \
    .appName("Pokemon Team Generation") \
    .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:3.0.1") \
    .getOrCreate()

# Connexion MongoDB
mongo_uri = "mongodb://localhost:27017"
database = "PokemonDB"
collection = "PokemonData"

spark.conf.set("spark.sql.debug.maxToStringFields", "100")
spark.sparkContext.setLogLevel("ERROR")
# Chargement des données Pokémon depuis MongoDB
df = spark.read.format("mongo").option("uri", f"{mongo_uri}/{database}.{collection}").load()

# Vérification des colonnes disponibles
print("Colonnes dans le DataFrame d'origine :", df.columns)

# Sélection des colonnes clés pour le clustering
selected_features = ["Raw count", "HP", "Attack", "Defense", "SpAtk", "SpDef", "Speed"]
feature_df = df.select(*selected_features, "PName", "Type 1", "Type 2", "Teammates")

# Assemblage des caractéristiques en un vecteur unique
assembler = VectorAssembler(inputCols=selected_features, outputCol="features")
assembled_df = assembler.transform(feature_df)

# Normalisation des caractéristiques
scaler = MinMaxScaler(inputCol="features", outputCol="scaled_features")
scaler_model = scaler.fit(assembled_df)
normalized_df = scaler_model.transform(assembled_df)

# Application de l'algorithme de clustering K-Means
kmeans = KMeans(featuresCol="scaled_features", predictionCol="cluster", k=6)  # 6 clusters (modifiable)
model = kmeans.fit(normalized_df)
clustered_df = model.transform(normalized_df)

# Sélection des colonnes nécessaires après clustering
clustered_df = clustered_df.select("Raw count", "HP", "Attack", "Defense", "SpAtk", "SpDef", "Speed", "PName", "Type 1", "Type 2", "Teammates", "cluster")
clustered_df.show(truncate=True)

# Fonction pour calculer les faiblesses partagées
def calculate_type_synergy(team):
    type_chart = {
        "Fire": ["Water", "Rock"],
        "Water": ["Electric", "Grass"],
        "Grass": ["Fire", "Flying"],
        # Ajouter d'autres types et leurs faiblesses ici
    }
    weaknesses = []
    for member in team:
        weaknesses.extend(type_chart.get(member["Type 1"], []))
        if member["Type 2"]:
            weaknesses.extend(type_chart.get(member["Type 2"], []))
    return len(set(weaknesses))  # Plus c'est faible, mieux c'est

# Fonction pour évaluer les synergies (teammates)
def calculate_teammate_synergy(team):
    synergy_score = 0
    for member in team:
        if "Teammates" in member:
            synergy_score += sum(member["Teammates"].values())
    return synergy_score

# Fonction pour générer une équipe optimisée
def generate_team(clustered_df, team_size=6):
    pokemon_list = clustered_df.toPandas()
    team = []
    
    # Sélectionner un Pokémon par cluster pour la diversité
    clusters = pokemon_list['cluster'].unique()
    for cluster in clusters:
        candidates = pokemon_list[pokemon_list['cluster'] == cluster]
        if not candidates.empty:
            # Trier par usage pour prioriser les Pokémon populaires
            candidates = candidates.sort_values(by="Raw count", ascending=False)
            team.append(candidates.iloc[0])  # Prend le premier Pokémon après tri
        if len(team) == team_size:
            break
    
    # Évaluation de la synergie des types et des teammates
    type_synergy = calculate_type_synergy(team)
    teammate_synergy = calculate_teammate_synergy(team)
    print(f"Synergie des types : {type_synergy}, Score de teammates : {teammate_synergy}")
    
    return team

# Générer une équipe optimisée et afficher les résultats
team = generate_team(clustered_df)
print("\nÉquipe générée :")
for member in team:
    print(f"Nom : {member['PName']}, Cluster : {member['cluster']}, Types : {member['Type 1']} / {member['Type 2']}, Stats : {member[['HP', 'Attack', 'Defense', 'SpAtk', 'SpDef', 'Speed']].to_dict()}")

# Fermeture de la session Spark
spark.stop()
