import json
from django.http import HttpResponse
from google.cloud import bigquery

def index(request):
    dataset = "bigquery-public-data.new_york_taxi_trips"
    query = f"SELECT * FROM {dataset}.INFORMATION_SCHEMA.TABLES"

    bq_client = bigquery.Client()
    query_job = bq_client.query(query)
    results = query_job.result()
    rows = []
    for row in results:
      for key, val in row.items():
        rows.append(f"{key}: {val}")
    return HttpResponse(json.dumps(rows))
