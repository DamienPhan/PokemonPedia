import json
import csv

# Function to flatten nested JSON
def flatten_json(nested_json, parent_key='', sep='_'):
    flattened_dict = {}
    for key, value in nested_json.items():
        new_key = parent_key + sep + key if parent_key else key
        if isinstance(value, dict):
            flattened_dict.update(flatten_json(value, new_key, sep=sep))
        else:
            flattened_dict[new_key] = value
    return flattened_dict

# Load the JSON file
with open('gen9vgc2024regh-1760.json', 'r', encoding='utf-8') as json_file:
    data = json.load(json_file)

# Inspect the structure of the data
print("Data type:", type(data))  # Check if data is a dictionary or list
print("Data contents:", data)  # Inspect the contents of data

# Open a CSV file for writing
with open('fichier_converti.csv', 'w', newline='', encoding='utf-8') as csv_file:
    csv_writer = csv.writer(csv_file)

    # Determine if the data is a list or a single dictionary
    if isinstance(data, list) and len(data) > 0:
        # Data is a list of dictionaries
        # Flatten the first entry to get the headers (keys)
        headers = flatten_json(data[0]).keys()
        csv_writer.writerow(headers)

        # Write each entry after flattening it
        for entry in data:
            flattened_entry = flatten_json(entry)
            # Skip the first five items in the flattened entry
            csv_writer.writerow(list(flattened_entry.values())[5:])  # Ignore the first 5 entries
    elif isinstance(data, dict):
        # Data is a single dictionary
        flattened_entry = flatten_json(data)
        headers = flattened_entry.keys()
        csv_writer.writerow(headers)
        # Skip the first five items in the flattened entry
        csv_writer.writerow(list(flattened_entry.values())[5:])  # Ignore the first 5 entries
    else:
        print("Unexpected data structure")

print("Conversion terminée, le fichier CSV a été généré.")
