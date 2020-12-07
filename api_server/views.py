import datetime
import decimal
import json
import pyarrow as pa
from django.http import HttpResponse
from google.cloud import bigquery

def arrow_table_to_pybytes(arrow_table):
    sink = pa.BufferOutputStream()
    writer = pa.ipc.new_stream(sink, arrow_table.schema)
    for batch in arrow_table.to_batches():
      writer.write_batch(batch)
    writer.close()
    buf = sink.getvalue()
    return buf.to_pybytes()

def query_job_to_json(query_job):
    results = query_job.result()
    rows = []
    for row in results:
      obj = {}
      for key, val in row.items():
        v = val
        if isinstance(val, decimal.Decimal) == True:
          v = float(val)
        if isinstance(val, datetime.datetime) == True:
          v = val.isoformat()
        obj[key] = v
      rows.append(obj)
    return json.dumps(rows)

def get_movebank_query_job(table = 'wildebeest', columns = '*', limit = 1000):
    dataset = "hpwg-297320.movebank"
    # wildebeest columns: individual_local_identifier, timestamp, location_long, location_lat,
    query = f"SELECT {columns} FROM {dataset}.{table} LIMIT {limit}"
    return bigquery.Client().query(query)

def movebank(request, table, format = 'json'):
    query_job = get_movebank_query_job(table)

    if format == 'json':
      return HttpResponse(query_job_to_json(query_job))
    else:
      buf = arrow_table_to_pybytes(query_job.to_arrow())
      return HttpResponse(buf, content_type='application/octet-stream')

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

