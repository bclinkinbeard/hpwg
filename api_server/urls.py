from django.urls import path
from django.shortcuts import render
from django.urls import include, path

from . import views

urlpatterns = [
    path('movebank/wildebeest/', views.movebank_wildebeest,
         name='movebank_wildebeest'),

    path('ny-taxi-tables/', views.ny_taxi_tables, name='ny_taxi_tables'),
    path('nytaxi/trips', views.nytaxi_trips, name='nytaxi_trips'),
    path('nytaxi/<str:table_name>/sample',
         views.ny_taxi_table_sample, name='ny_taxi_table_sample'),
    path('arrow/', views.arrow, name='arrow'),
]
