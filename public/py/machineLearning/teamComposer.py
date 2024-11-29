from pyspark.sql import SparkSession
from pyspark.sql.functions import col, when, lit, expr
from pyspark.ml.clustering import KMeans
from pyspark.ml.feature import VectorAssembler, MinMaxScaler
from pyspark.ml.evaluation import ClusteringEvaluator
from pymongo import MongoClient
from datetime import datetime
from pyspark.ml.clustering import KMeans
from pyspark.ml.evaluation import ClusteringEvaluator
import math

# Fonction pour sauvegarder l'équipe dans MongoDB
def save_team_to_db(team, mongo_uri, database, collection):
    client = MongoClient(mongo_uri)
    db = client[database]
    teams_collection = db[collection]

    team_data = []
    for p in team:
        team_data.append({
            "PName": p["PName"],
            "Type 1": p["Type 1"],
            "Type 2": p["Type 2"],
            "HP": int(p["HP"]),
            "Attack": int(p["Attack"]),
            "Defense": int(p["Defense"]),
            "SpAtk": int(p["SpAtk"]),
            "SpDef": int(p["SpDef"]),
            "Speed": int(p["Speed"])
        })

    teams_collection.insert_one({"team": team_data, "timestamp": datetime.now()})
    print("Équipe sauvegardée dans la collection MongoDB.")
    print("---------------------------------------------------")



# Fonction pour calculer les faiblesses partagées
def get_type_synergy(team):
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
    return len(set(weaknesses))



# Calcul un score en fonction de la colonne Teammates 
def get_teammate_synergy(team):
    synergy_score = 0
    for member in team:
        if "Teammates" in member:
            synergy_score += sum(member["Teammates"].values())
    return synergy_score



### SPARK Machine Learning Clustering avec evaluator Silhouette pour KMeans

spark = SparkSession.builder \
    .appName("teamComposer") \
    .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:3.0.1") \
    .getOrCreate()

spark.conf.set("spark.sql.debug.maxToStringFields", "100")
spark.sparkContext.setLogLevel("ERROR")

mongo_uri = "mongodb://localhost:27017"
database = "PokemonDB"
collection = "PokemonData"

# Chargement des données Pokémon depuis MongoDB
df = spark.read.format("mongo").option("uri", f"{mongo_uri}/{database}.{collection}").load()

# On choisit les traits qui sont importantes dans notre clustering 
selected_features = ["Raw count", "HP", "Attack", "Defense", "SpAtk", "SpDef", "Speed", "Total"]
# Autres données utilisées
feature_df = df.select(*selected_features, "PName", "Type 1", "Type 2", "Teammates")

# Calcul du score de compatibilité des coéquipiers
if "Teammates" in feature_df.columns:
    feature_df = feature_df.withColumn(
        "TeammateScore",
        when(
            col("Teammates").isNull(), lit(0.0)
        ).otherwise(
            expr("aggregate(map_values(Teammates), 0D, (acc, value) -> acc + value)")  # Somme des valeurs
        )
    )
else:
    feature_df = feature_df.withColumn("TeammateScore", lit(0.0)) 

# Ajout du TeammateScore dans le tableau pour créer des vecteurs plus denses et donc ayant plus de sens pour le clustering
assembler = VectorAssembler(inputCols=selected_features + ["TeammateScore"], outputCol="features")
assembled_df = assembler.transform(feature_df)

# Normalisation des caractéristiques (Mise a l echelle des données pour eviter que RawCount ne pese trop par exemple)
# https://spark.apache.org/docs/latest/api/python/reference/api/pyspark.ml.feature.MinMaxScaler.html
scaler = MinMaxScaler(inputCol="features", outputCol="scaled_features")
scaler_model = scaler.fit(assembled_df)

# Permet d'avoir des valeurs entre 0 et 1
normalized_df = scaler_model.transform(assembled_df)



# Trouve le nombre optimal de clusters en utilisant le Silhouette Score voir https://spark.apache.org/docs/latest/ml-clustering.html premier exemple
def optimal_kclusters(normalized_df, feature_col="scaled_features", min_k=5, max_k=10, seed=1):
    best_k = min_k
    best_silhouette = -1
    evaluator = ClusteringEvaluator(
        featuresCol=feature_col,
        predictionCol="prediction",
        metricName="silhouette",
        distanceMeasure="squaredEuclidean"
    )
    
    print("Évaluation du Silhouette Score pour différents nombres de clusters :")
    for k in range(min_k, max_k + 1):
        kmeans = KMeans(featuresCol=feature_col, predictionCol="prediction", k=k, seed=seed)
        model = kmeans.fit(normalized_df)
        predictions = model.transform(normalized_df)
        
        silhouette = evaluator.evaluate(predictions)
        # print(f"K = {k}, Silhouette Score = {silhouette}")
        
        if silhouette > best_silhouette:
            best_k = k
            best_silhouette = silhouette
    
    print(f"Meilleur nombre de clusters : {best_k}, avec un Silhouette Score de {best_silhouette}")
    return best_k, best_silhouette

best_k, best_silhouette = optimal_kclusters(normalized_df, feature_col="scaled_features", min_k=5, max_k=10, seed=1)


# K-Means : 
# featuresCol -> données utiliser pour créer les clusters
# predictionCol -> résultats du clustering seront stockés
# k -> Nombre de clusters récupéré grace a optimal_kclusters
# seed -> Graine aléatoire
kmeans = KMeans(featuresCol="scaled_features", predictionCol="cluster", k=best_k, seed=1)

# Choisit k clusters et chaque pokemon est affecte a un cluster k dont sa distance euclidienne est minimale.
# On réajuste jusqua que les clusters ne bougent plus
model = kmeans.fit(normalized_df)
clustered_df = model.transform(normalized_df)

clustered_df = clustered_df.select(
    "Raw count", "HP", "Attack", "Defense", "SpAtk", "SpDef", "Speed", "Total",
    "TeammateScore", "PName", "Type 1", "Type 2", "Teammates", "cluster"
)
# clustered_df.show(truncate=True)





# Permet de prédire le suggerer le prochain pokemon en fonction de criteres donnes 
def predict_next_pokemon(clustered_df, current_team, max_suggestions=7):
    # toPandas pcq plus flexible
    pokemon_list = clustered_df.toPandas()
    suggestions = []
    team_clusters = [p["cluster"] for p in current_team]

    for _, candidate in pokemon_list.iterrows():
        if candidate["PName"] in [p["PName"] for p in current_team]:
            continue  

        temp_team = current_team + [candidate]
 
        # Calcul des synergy en fonction des types présents dans l equipe et de la partie teammates
        type_synergy = get_type_synergy(temp_team)
        teammate_synergy = get_teammate_synergy(temp_team)
        normalized_teammate_synergy = teammate_synergy / (max(pokemon_list["TeammateScore"]) or 1)
        normalized_total = candidate["Total"] / (max(pokemon_list["Total"]) or 1)

        # Permet de choisir des pokemons dans des clusters differents (Sweeper/Tank...)
        cluster_penalty = 1 if candidate["cluster"] in team_clusters else 0

        # A CHANGER EN FONCTION DES RESULTATS
        # Calcul du score combiné donnant la meilleure suggestion 
        combined_score = (0.1 * type_synergy) + \
                         (0.5 * normalized_teammate_synergy) + \
                         (0.2 * normalized_total) - \
                         (0.2 * cluster_penalty)

        # Ajouter le Pokémon et ses scores à la liste des suggestions
        suggestions.append({
            "PName": candidate["PName"],
            "Type 1": candidate["Type 1"],
            "Type 2": candidate["Type 2"],
            "Type Synergy": type_synergy,
            "Teammate Synergy": teammate_synergy,
            "Combined Score": combined_score,
            "Stats": candidate[["HP", "Attack", "Defense", "SpAtk", "SpDef", "Speed"]].to_dict(),
        })
    suggestions.sort(key=lambda x: x["Combined Score"], reverse=True)
    return suggestions[:max_suggestions]




# Exemple d'utilisation
starter_pokemons = ["Miraidon"]  

pokemon_list = clustered_df.toPandas()
starters = pokemon_list[pokemon_list["PName"].isin(starter_pokemons)]

if len(starters) < len(starter_pokemons):
    missing_pokemons = [p for p in starter_pokemons if p not in starters["PName"].values]
    raise ValueError(f"Les Pokémon suivants n'existent pas dans la base de données : {', '.join(missing_pokemons)}")

team = starters.to_dict(orient="records") 
print(f"Équipe actuelle : {[p['PName'] for p in team]}")

while len(team) < 6:
    suggestions = predict_next_pokemon(clustered_df, team)
    print("\nSuggestions pour le prochain Pokémon :")
    for i, suggestion in enumerate(suggestions):
        print(f"{i + 1}. Nom : {suggestion['PName']}, "
              f"Type Synergy : {suggestion['Type Synergy']}, "
              f"Teammate Synergy : {suggestion['Teammate Synergy']}, "
              f"Combined Score : {suggestion['Combined Score']:.2f}")
    chosen_pokemon = suggestions[0]
    team.append(next(p for p in pokemon_list.to_dict(orient="records") if p["PName"] == chosen_pokemon["PName"]))
    print(f"\nPokémon ajouté : {chosen_pokemon['PName']}")
    print(f"Équipe actuelle : {[p['PName'] for p in team]}")
save_team_to_db(team, mongo_uri, "PokemonDB", "Teams")


spark.stop()
