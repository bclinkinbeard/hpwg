import datetime
import decimal
import json
import pyarrow as pa
from django.http import HttpResponse
from google.cloud import bigquery

GCP_PROJECT = "hpwg-297320"
TESTING = False
lastBuf = None

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


def dataset(request, dataset):
    query = f"SELECT * FROM {GCP_PROJECT}.{dataset}.INFORMATION_SCHEMA.TABLES"
    bq_client = bigquery.Client()
    query_job = bq_client.query(query)
    buf = arrow_table_to_pybytes(query_job.to_arrow())
    return HttpResponse(buf, content_type='application/octet-stream')


def get_query_job(dataset='movebank', table='wildebeest', columns='*', limit=1000):
    query = f"SELECT {columns} FROM {GCP_PROJECT}.{dataset}.{table} LIMIT {limit}"
    return bigquery.Client().query(query)

def movebank(request, table, format='json', limit=1000):
    global lastBuf
    if (TESTING and lastBuf != None):
        return HttpResponse(lastBuf, content_type='application/octet-stream')

    query_job = get_query_job('movebank', table, '*', limit)

    if format == 'json':
        return HttpResponse(query_job_to_json(query_job))
    else:
        lastBuf = buf = arrow_table_to_pybytes(query_job.to_arrow())
        return HttpResponse(buf, content_type='application/octet-stream')
