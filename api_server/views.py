import datetime
import decimal
import json
import pyarrow as pa
from django.http import HttpResponse
from google.cloud import bigquery

def ny_taxi_tables(request):
    dataset = "bigquery-public-data.new_york_taxi_trips"
    query = f"SELECT * FROM {dataset}.INFORMATION_SCHEMA.TABLES"

    bq_client = bigquery.Client()
    query_job = bq_client.query(query)
    results = query_job.result()
    tables = []
    for row in results:
      for key, val in row.items():
        if key == "table_name":
          tables.append(f"{val}")
    tables.sort()
    return HttpResponse(json.dumps(tables))

def ny_taxi_table_sample(request, table_name):
    dataset = "bigquery-public-data.new_york_taxi_trips"
    query = f"SELECT * FROM {dataset}.{table_name} LIMIT 1000"

    bq_client = bigquery.Client()
    query_job = bq_client.query(query)
    results = query_job.result()
    tables = []
    for row in results:
      obj = {}
      for key, val in row.items():
        if isinstance(val, datetime.datetime) == False:
          if isinstance(val, decimal.Decimal) == True:
            obj[key] = float(val)
          else:
            obj[key] = val
      tables.append(obj)
    return HttpResponse(json.dumps(tables))

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
