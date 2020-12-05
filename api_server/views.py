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

def get_wildebeest_query_job():
    dataset = "hpwg-297320.movebank"
    table = "wildebeest"
    query = f"""
      SELECT
      individual_local_identifier, timestamp, location_long, location_lat,
      FROM {dataset}.{table}
      LIMIT 10000
    """

    bq_client = bigquery.Client()
    return bq_client.query(query)

def movebank_wildebeest(request):
    query_job = get_wildebeest_query_job()
    results = query_job.result()
    tables = []
    for row in results:
      obj = {}
      for key, val in row.items():
        v = val
        if isinstance(val, decimal.Decimal) == True:
          v = float(val)
        if isinstance(val, datetime.datetime) == True:
          v = val.isoformat()
        obj[key] = v
      tables.append(obj)
    return HttpResponse(json.dumps(tables))

def movebank_wildebeest_arrow(request):
    query_job = get_wildebeest_query_job()
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

def nytaxi_trips(request):
    dataset = "bigquery-public-data.new_york_taxi_trips"
    query = f"""
      SELECT
      pickup_datetime, dropoff_datetime,
      pickup_longitude, pickup_latitude,
      dropoff_longitude, dropoff_latitude,
      FROM `bigquery-public-data.new_york_taxi_trips.tlc_yellow_trips_2016`
      WHERE pickup_latitude > 0
      LIMIT 1000
    """

    bq_client = bigquery.Client()
    query_job = bq_client.query(query)
    results = query_job.result()
    tables = []
    for row in results:
      obj = {}
      for key, val in row.items():
        v = val
        if isinstance(val, decimal.Decimal) == True:
          v = float(val)
        if isinstance(val, datetime.datetime) == True:
          v = val.isoformat()
        obj[key] = v
      tables.append(obj)
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
        v = val
        if isinstance(val, decimal.Decimal) == True:
          v = float(val)
        if isinstance(val, datetime.datetime) == True:
          v = val.isoformat()
        obj[key] = v
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
