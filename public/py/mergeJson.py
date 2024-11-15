from pyspark.sql import SparkSession
from pyspark.sql.types import *
import shutil
import os

# Initialiser SparkSession
spark = SparkSession.builder \
    .appName("Fusion Smogon JSON - Fichier Unique") \
    .getOrCreate()

# Configurer Spark pour gérer les clés dupliquées dans les Maps
spark.conf.set("spark.sql.mapKeyDedupPolicy", "LAST_WIN")

# Définir le schéma
schema = StructType([
    StructField("info", StructType([
        StructField("team type", StringType(), True),
        StructField("cutoff", FloatType(), True),
        StructField("cutoff deviation", FloatType(), True),
        StructField("metagame", StringType(), True),
        StructField("number of battles", FloatType(), True)
    ])),
    StructField("data", MapType(StringType(), StructType([
        StructField("Items", MapType(StringType(), FloatType()), True),
        StructField("Raw count", FloatType(), True),
        StructField("Spreads", MapType(StringType(), FloatType()), True),
        StructField("Tera Types", MapType(StringType(), FloatType()), True),
        StructField("Teammates", MapType(StringType(), FloatType()), True),
        StructField("Viability Ceiling", ArrayType(FloatType()), True),
        StructField("Abilities", MapType(StringType(), FloatType()), True),
        StructField("Checks and Counters", MapType(StringType(), FloatType()), True),
        StructField("usage", FloatType(), True),
        StructField("Moves", MapType(StringType(), FloatType()), True),
        StructField("Happiness", MapType(StringType(), FloatType()), True)
    ]), True))
])

# Liste des fichiers JSON
files = [
    "ressources/smogon/gen9ubers-0.json",
    "ressources/smogon/gen9ubers-1500.json",
    "ressources/smogon/gen9ubers-1630.json",
    "ressources/smogon/gen9ubers-1760.json"
]

# Charger les fichiers JSON dans des DataFrames
dataframes = [spark.read.schema(schema).json(file) for file in files]

# Extraire les données du premier fichier
first_df = dataframes[0]

# Extraire et combiner les colonnes "data" des autres fichiers
combined_data = dataframes[1].select("data")
for df in dataframes[2:]:
    combined_data = combined_data.unionByName(df.select("data"))

# Fusionner les données combinées dans le champ "data" du premier fichier
from pyspark.sql.functions import col, map_concat

# Ajouter les nouvelles données à la colonne "data" du premier fichier
first_df = first_df.withColumn(
    "data",
    map_concat(col("data"), *[col("data") for df in combined_data.collect()])
)

# Coalesce pour obtenir un fichier unique et écrire dans un répertoire temporaire
output_temp_dir = "ressources/smogon/updated_gen9ubers_temp"
first_df.coalesce(1).write.mode("overwrite").json(output_temp_dir)

# Déplacer et renommer le fichier généré
output_final_file = "ressources/smogon/gen9ubers.json"
for file in os.listdir(output_temp_dir):
    if file.startswith("part-") and file.endswith(".json"):
        shutil.move(os.path.join(output_temp_dir, file), output_final_file)

# Supprimer le répertoire temporaire
shutil.rmtree(output_temp_dir)

# Arrêter SparkSession
spark.stop()
