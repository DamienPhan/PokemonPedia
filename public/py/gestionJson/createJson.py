import os
import shutil
import json
from pyspark.sql import SparkSession
from pyspark.sql.types import *
from pyspark.sql.functions import explode, col, lower

smogonPath = "ressources/smogon/gen9ubers.json"
pokedexPath = "ressources/pokedex/pokedex.csv"
dataPath = "ressources/data_output"

spark = SparkSession.builder.appName("createJSON").getOrCreate()

# Schéma du fichier JSON
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

df_json = spark.read.schema(schema).json(smogonPath)
df_csv = spark.read.csv(pokedexPath, header=True, inferSchema=True)

# Harmonisation des noms car pb lors de la fusion du csv et du json
df_csv = df_csv.withColumn("Name", lower(col("Name")))
df_data = df_json.select(explode("data").alias("PName", "Details"))

# Extraction des colonnes JSON
df_details = df_data.select(
    col("PName"),
    col("Details").getItem("Items").alias("Items"),
    col("Details").getItem("Raw count").alias("Raw count"),
    col("Details").getItem("Spreads").alias("Spreads"),
    col("Details").getItem("Tera Types").alias("Tera Types"),
    col("Details").getItem("Teammates").alias("Teammates"),
    col("Details").getItem("Viability Ceiling").alias("Viability Ceiling"),
    col("Details").getItem("Abilities").alias("Abilities"),
    col("Details").getItem("Checks and Counters").alias("Checks and Counters"),
    col("Details").getItem("usage").alias("usage"),
    col("Details").getItem("Moves").alias("Moves"),
    col("Details").getItem("Happiness").alias("Happiness")
)

# Join sur Name/PName
df_joined = df_details.join(df_csv, lower(col("PName")) == col("Name"), "inner").drop("Name")

# Créer le nv json sans les fichiers temp dans ressources/data_output 
input_file_name = os.path.splitext(os.path.basename(smogonPath))[0]
temp_output_path = "temp_output"
df_joined.coalesce(1).write.json(temp_output_path, mode="overwrite")
temp_file = [f for f in os.listdir(temp_output_path) if f.endswith(".json")][0]
results = df_joined.collect()
final_output_path = f"{dataPath}/{input_file_name}.json"
with open(final_output_path, 'w') as json_file:
    json_file.write('[') 
    for i, row in enumerate(results):
        json.dump(row.asDict(), json_file)
        if i < len(results) - 1:
            json_file.write(',')
    json_file.write(']')  
shutil.rmtree(temp_output_path)

spark.stop()