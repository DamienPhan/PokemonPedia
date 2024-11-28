from pyspark.sql import SparkSession
from pyspark.sql.functions import col, when, coalesce, lit, expr
from pyspark.ml.clustering import KMeans
from pyspark.ml.feature import VectorAssembler, MinMaxScaler

# Initialisation de la session Spark
spark = SparkSession.builder \
    .appName("Pokemon Team Generation") \
    .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:3.0.1") \
    .getOrCreate()

# Réglages de la session Spark
spark.conf.set("spark.sql.debug.maxToStringFields", "100")
spark.sparkContext.setLogLevel("ERROR")

# Connexion MongoDB
mongo_uri = "mongodb://localhost:27017"
database = "PokemonDB"
collection = "PokemonData"

# Chargement des données Pokémon depuis MongoDB
df = spark.read.format("mongo").option("uri", f"{mongo_uri}/{database}.{collection}").load()

# Mise à jour des colonnes clés pour le clustering
selected_features = ["Raw count", "HP", "Attack", "Defense", "SpAtk", "SpDef", "Speed", "Total"]
feature_df = df.select(*selected_features, "PName", "Type 1", "Type 2", "Teammates")

# Calculate TeammateScore from the Teammates map column
if "Teammates" in feature_df.columns:
    feature_df = feature_df.withColumn(
        "TeammateScore",
        when(
            col("Teammates").isNull(), lit(0.0)  # Ensure default is FLOAT/DOUBLE
        ).otherwise(
            expr("aggregate(map_values(Teammates), 0D, (acc, value) -> acc + value)")  # Ensure DOUBLE type aggregation
        )
    )
else:
    feature_df = feature_df.withColumn("TeammateScore", lit(0.0))  # Default as FLOAT/DOUBLE

# Assemblage des caractéristiques en un vecteur unique
assembler = VectorAssembler(inputCols=selected_features, outputCol="features")
assembled_df = assembler.transform(feature_df)

# Normalisation des caractéristiques
scaler = MinMaxScaler(inputCol="features", outputCol="scaled_features")
scaler_model = scaler.fit(assembled_df)
normalized_df = scaler_model.transform(assembled_df)

# Application de l'algorithme de clustering K-Means
kmeans = KMeans(featuresCol="scaled_features", predictionCol="cluster", k=6)  # 6 clusters
model = kmeans.fit(normalized_df)
clustered_df = model.transform(normalized_df)

# Sélection des colonnes nécessaires après clustering
clustered_df = clustered_df.select(
    "Raw count", "HP", "Attack", "Defense", "SpAtk", "SpDef", "Speed", "Total",
    "TeammateScore", "PName", "Type 1", "Type 2", "Teammates", "cluster"
)
clustered_df.show(truncate=True)

# Fonction pour calculer les faiblesses partagées
def calculate_type_synergy(team):
    type_chart = {
        "Normal": ["Fighting"],
        "Fire": ["Water", "Rock", "Ground"],
        "Water": ["Electric", "Grass"],
        "Electric": ["Ground"],
        "Grass": ["Fire", "Flying", "Poison", "Bug", "Ice"],
        "Ice": ["Fire", "Fighting", "Rock", "Steel"],
        "Fighting": ["Flying", "Psychic", "Fairy"],
        "Poison": ["Ground", "Psychic"],
        "Ground": ["Water", "Grass", "Ice"],
        "Flying": ["Electric", "Ice", "Rock"],
        "Psychic": ["Bug", "Ghost", "Dark"],
        "Bug": ["Fire", "Flying", "Rock"],
        "Rock": ["Water", "Grass", "Fighting", "Ground", "Steel"],
        "Ghost": ["Ghost", "Dark"],
        "Dragon": ["Ice", "Dragon", "Fairy"],
        "Dark": ["Fighting", "Bug", "Fairy"],
        "Steel": ["Fire", "Fighting", "Ground"],
        "Fairy": ["Poison", "Steel"],
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

def generate_team_with_starter(clustered_df, starter_name, team_size=6):
    """
    Génère une équipe en commençant par un Pokémon de départ.
    """
    pokemon_list = clustered_df.toPandas()
    starter = pokemon_list[pokemon_list["PName"] == starter_name]

    if starter.empty:
        raise ValueError(f"Le Pokémon '{starter_name}' n'existe pas dans la base de données.")

    team = [starter.iloc[0]]  # Ajouter le Pokémon de départ
    clusters = pokemon_list['cluster'].unique()

    for cluster in clusters:
        if len(team) == team_size:
            break
        # Exclure les Pokémon déjà dans l'équipe
        candidates = pokemon_list[(pokemon_list['cluster'] == cluster) & (~pokemon_list['PName'].isin([p['PName'] for p in team]))]
        if not candidates.empty:
            candidates = candidates.sort_values(by="Raw count", ascending=False)
            team.append(candidates.iloc[0])  # Ajouter un Pokémon du cluster

    # Évaluer la synergie
    type_synergy = calculate_type_synergy(team)
    teammate_synergy = calculate_teammate_synergy(team)
    print(f"Synergie des types : {type_synergy}, Score de teammates : {teammate_synergy}")

    return team


# Générer une équipe optimisée et afficher les résultats
# team = generate_team(clustered_df)
# print("\nÉquipe générée :")
# for member in team:
#     print(f"Nom : {member['PName']}, Cluster : {member['cluster']}, Types : {member['Type 1']} / {member['Type 2']}, Stats : {member[['HP', 'Attack', 'Defense', 'SpAtk', 'SpDef', 'Speed']].to_dict()}")

# Fermeture de la session Spark
spark.stop()
