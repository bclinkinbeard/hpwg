from django.shortcuts import render
from django.urls import include, path, re_path

from . import views

urlpatterns = [
    re_path(r'^movebank/(?P<table>\w+)/$', views.movebank),
    re_path(r'^movebank/(?P<table>\w+)/(?P<format>\w+)/$', views.movebank),

    path('ny-taxi-tables/', views.ny_taxi_tables, name='ny_taxi_tables'),
]
