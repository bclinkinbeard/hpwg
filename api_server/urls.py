from django.urls import path
from django.shortcuts import render
from django.urls import include, path

from . import views

urlpatterns = [
    path('ny-taxi-tables/', views.ny_taxi_tables, name='ny_taxi_tables'),
    path('arrow/', views.arrow, name='arrow'),
]
