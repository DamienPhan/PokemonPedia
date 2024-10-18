import os
import shutil
from pyspark.sql import SparkSession
from pyspark.sql.types import *
from pyspark.sql.functions import explode, col, lower, to_json

smogonPath = "smogon.json"
pokedexPath = "pokedex/pokedex.csv"

spark = SparkSession.builder.appName("Pokemon Join").getOrCreate()

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

df_json = spark.read.schema(schema).json("smogon.json")

df_data = df_json.select(
    explode("data").alias("Name", "Details")
)

df_details = df_data.select(
    col("Name").alias("PName"),
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

df_csv = spark.read.csv(pokedexPath, header=True, inferSchema=True)
df_csv = df_csv.withColumn("Name", lower(col("Name")))

df_joined = df_details.join(df_csv, lower(col("PName")) == col("Name"), "inner")
df_joined = df_joined.withColumn("Items", to_json(col("Items")))

# Supprimer la colonne Name
df_joined = df_joined.drop("Name")

input_file_name = os.path.splitext(os.path.basename(smogonPath))[0]
# Chemin temporaire pour sauver le fichier
temp_output_path = "temp_output"
df_joined.coalesce(1).write.json(temp_output_path, mode="overwrite")
temp_file = [f for f in os.listdir(temp_output_path) if f.endswith(".json")][0]
final_output_path = f"{input_file_name}_joined.json"
shutil.move(f"{temp_output_path}/{temp_file}", final_output_path)
shutil.rmtree(temp_output_path)

spark.stop()
