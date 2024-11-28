from pyspark.sql import SparkSession, Row
from pyspark.sql.types import *
from pyspark.sql.functions import explode, col, when, lit, collect_list, sum as F_sum
from pyspark.ml.feature import CountVectorizer, VectorAssembler, StringIndexer
from pyspark.ml.clustering import KMeans
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml.evaluation import ClusteringEvaluator

# Initialisation de la session Spark
spark = SparkSession.builder \
    .appName("PokemonTeamBuilder") \
    .config("spark.sql.debug.maxToStringFields", "100") \
    .getOrCreate()

# Étape 1 : Charger les données depuis MongoDB
def load_data_from_mongodb():
    from pymongo import MongoClient
    try:
        client = MongoClient("mongodb://localhost:27017/")
        db = client['PokemonDB']
        collection = db['PokemonData']
        data = list(collection.find())
        client.close()
        print(f"[INFO] Chargé {len(data)} documents depuis MongoDB.")
        return data
    except Exception as e:
        print(f"[ERREUR] Problème lors de la connexion à MongoDB : {e}")
        exit(1)

# Étape 2 : Charger les données dans PySpark avec un schéma explicite
def load_data_into_spark(data, spark):
    schema = StructType([
        StructField("PName", StringType(), True),
        StructField("Items", MapType(StringType(), FloatType()), True),
        StructField("Raw count", FloatType(), True),
        StructField("Spreads", MapType(StringType(), FloatType()), True),
        StructField("Tera Types", MapType(StringType(), FloatType()), True),
        StructField("Teammates", MapType(StringType(), FloatType()), True),
        StructField("Viability Ceiling", ArrayType(FloatType()), True),
        StructField("Abilities", MapType(StringType(), FloatType()), True),
        StructField("usage", FloatType(), True),
        StructField("Moves", MapType(StringType(), FloatType()), True),
        StructField("Image", StringType(), True),
        StructField("Type 1", StringType(), True),
        StructField("Type 2", StringType(), True),
        StructField("Total", IntegerType(), True),
        StructField("HP", IntegerType(), True),
        StructField("Attack", IntegerType(), True),
        StructField("Defense", IntegerType(), True),
        StructField("SpAtk", IntegerType(), True),
        StructField("SpDef", IntegerType(), True),
        StructField("Speed", IntegerType(), True)
    ])

    try:
        cleaned_data = [Row(**{k: v for k, v in doc.items() if k != "_id"}) for doc in data]
        print("[INFO] Données MongoDB nettoyées.")
        return spark.createDataFrame(cleaned_data, schema=schema)
    except Exception as e:
        print(f"[ERREUR] Problème lors du chargement des données dans PySpark : {e}")
        exit(1)

# Étape 3 : Préparer les caractéristiques pour le machine learning
def prepare_features(data):
    try:
        teammates_df = data.select("PName", explode("Teammates").alias("Teammate", "Count"))
        teammates_df = teammates_df.withColumn(
            "NormalizedCount", col("Count") / F_sum("Count").over(Window.partitionBy("PName"))
        )

        moves_df = data.select("PName", explode("Moves").alias("Move", "Count"))
        tera_types_df = data.select("PName", explode("Tera Types").alias("TeraType", "Count"))

        features_df = teammates_df.groupBy("PName").agg(
            collect_list("Teammate").alias("Teammates"),
            collect_list("NormalizedCount").alias("TeammateCounts")
        ).join(moves_df.groupBy("PName").agg(
            collect_list("Move").alias("Moves")
        ), "PName", "inner").join(tera_types_df.groupBy("PName").agg(
            collect_list("TeraType").alias("TeraTypes")
        ), "PName", "inner")

        print(f"[INFO] Préparé les caractéristiques pour {features_df.count()} Pokémon.")
        return features_df
    except Exception as e:
        print(f"[ERREUR] Problème lors de la préparation des caractéristiques : {e}")
        exit(1)

# Étape 4 : Vectoriser les caractéristiques
def vectorize_features(features_df):
    try:
        teammate_vectorizer = CountVectorizer(inputCol="Teammates", outputCol="teammates_vector")
        moves_vectorizer = CountVectorizer(inputCol="Moves", outputCol="moves_vector")
        tera_types_vectorizer = CountVectorizer(inputCol="TeraTypes", outputCol="tera_types_vector")

        vectorized_data = teammate_vectorizer.fit(features_df).transform(features_df)
        vectorized_data = moves_vectorizer.fit(vectorized_data).transform(vectorized_data)
        vectorized_data = tera_types_vectorizer.fit(vectorized_data).transform(vectorized_data)

        assembler = VectorAssembler(
            inputCols=["teammates_vector", "moves_vector", "tera_types_vector"],
            outputCol="features"
        )
        final_data = assembler.transform(vectorized_data)
        print(f"[INFO] Vectorisation terminée.")
        return final_data
    except Exception as e:
        print(f"[ERREUR] Problème lors de la vectorisation : {e}")
        exit(1)

# Étape 5 : Clustering avec K-Means
def cluster_data(final_data, k=6):
    try:
        kmeans = KMeans(k=k, seed=42, featuresCol="features")
        model = kmeans.fit(final_data)
        clustered_data = model.transform(final_data)

        evaluator = ClusteringEvaluator()
        silhouette = evaluator.evaluate(clustered_data)
        print(f"[INFO] Clustering terminé. Silhouette Score : {silhouette}")
        return clustered_data
    except Exception as e:
        print(f"[ERREUR] Problème lors du clustering : {e}")
        exit(1)

# Étape 6 : Classification supervisée avec Random Forest
def classify_data(clustered_data):
    try:
        indexer = StringIndexer(inputCol="prediction", outputCol="label")
        labeled_data = indexer.fit(clustered_data).transform(clustered_data)

        train_data, test_data = labeled_data.randomSplit([0.8, 0.2], seed=42)

        rf = RandomForestClassifier(featuresCol="features", labelCol="label", numTrees=50)
        model = rf.fit(train_data)

        predictions = model.transform(test_data)
        predictions.select("PName", "label", "prediction").show(10, truncate=False)
        print("[INFO] Classification Random Forest terminée.")
        return model
    except Exception as e:
        print(f"[ERREUR] Problème lors de la classification : {e}")
        exit(1)

# Étape 7 : Prédire une équipe
def predict_team(model, final_data, pokemon_name):
    try:
        pokemon_data = final_data.filter(final_data["PName"] == pokemon_name).select("features")
        predicted_team = model.transform(pokemon_data)
        predicted_team.select("PName", "prediction").show(truncate=False)
        print(f"[INFO] Prédiction pour {pokemon_name} terminée.")
    except Exception as e:
        print(f"[ERREUR] Problème lors de la prédiction : {e}")

# Étape 8 : Exporter les résultats
def export_results(clustered_data, output_path="output/teams.csv"):
    try:
        clustered_data.write.csv(output_path, header=True)
        print(f"[INFO] Résultats exportés vers {output_path}.")
    except Exception as e:
        print(f"[ERREUR] Problème lors de l'export : {e}")

# Main Workflow
if __name__ == "__main__":
    try:
        # Charger les données MongoDB
        raw_data = load_data_from_mongodb()
        spark_data = load_data_into_spark(raw_data, spark)
        spark_data.show(5, truncate=False)

        # Préparer les caractéristiques
        features_df = prepare_features(spark_data)

        # Vectoriser les caractéristiques
        final_data = vectorize_features(features_df)

        # Clustering
        clustered_data = cluster_data(final_data, k=6)
        clustered_data.show(10, truncate=False)

        # Classification supervisée
        model = classify_data(clustered_data)

        # Prédire une équipe pour un Pokémon spécifique
        predict_team(model, final_data, "Iron Valiant")

        # Exporter les résultats
        export_results(clustered_data)

    except Exception as e:
        print(f"[ERREUR] Erreur globale : {e}")

    finally:
        spark.stop()
