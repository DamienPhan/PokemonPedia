from pyspark.sql import SparkSession

# MongoDB connection details
mongo_uri = "mongodb://localhost:27017"
database = "PokemonDB"
collection = "PokemonData"

# Initialize Spark Session with MongoDB connector
spark = SparkSession.builder \
    .appName("MongoDBIntegration") \
    .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:3.0.1") \
    .getOrCreate()

# Read data from MongoDB
df = spark.read.format("mongo").option("uri", f"{mongo_uri}/{database}.{collection}").load()

# Show the schema and data
df.printSchema()
