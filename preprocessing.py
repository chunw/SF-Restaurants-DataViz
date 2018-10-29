import math
import numpy as np
import matplotlib.pyplot as plt
from collections import Counter
import csv

data_map = {}

with open('data/restaurant_scores.csv') as csvfile:
    reader = csv.DictReader(csvfile, skipinitialspace=True)
    for row in reader:
        business_name = row["business_name"]
        business_location = row["business_location"]
        inspection_date = row["inspection_date"]
        business_name_key = business_name + business_location
        if business_name_key not in data_map:
            data_map[business_name_key] = {}
        if "inspection_date" not in data_map[business_name_key] \
            or inspection_date > data_map[business_name_key]["inspection_date"]:
            data_map[business_name_key]["inspection_date"] = inspection_date
            data_map[business_name_key]["data"] = row

with open('data/restaurant_scores_processed.csv', 'w') as outfile:
    header = "business_id,business_name,business_address,business_postal_code,business_latitude,business_longitude,business_location,business_phone_number,inspection_id,inspection_date,inspection_score,violation_id,violation_description,risk_category"
    outfile.write(header + "\n")
    for business_name_key in data_map:
        data = data_map[business_name_key]["data"]
        row = ""
        for col in header.split(","):
            row += '"' + data[col] + '"' + ","
        outfile.write(row[:-1]+"\n")
