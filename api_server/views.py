import json
import pyarrow as pa
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

def arrow(request):
    dataset = "bigquery-public-data.new_york_taxi_trips"
    query = f"SELECT * FROM {dataset}.INFORMATION_SCHEMA.TABLES"

    bq_client = bigquery.Client()
    query_job = bq_client.query(query)
    arrow_table = query_job.to_arrow()
    sink = pa.BufferOutputStream()
    writer = pa.ipc.new_stream(sink, arrow_table.schema)
    for batch in arrow_table.to_batches():
      writer.write_batch(batch)
    writer.close()
    buf = sink.getvalue()
    return HttpResponse(
        buf.to_pybytes(), content_type="application/octet-stream")
