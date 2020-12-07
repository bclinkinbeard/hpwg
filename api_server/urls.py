from django.shortcuts import render
from django.urls import include, path, re_path

from . import views

urlpatterns = [
    re_path(r'^dataset/(?P<dataset>\w+)/$', views.dataset),

    re_path(r'^movebank/(?P<table>\w+)/$', views.movebank),
    re_path(r'^movebank/(?P<table>\w+)/(?P<format>\w+)/$', views.movebank),
    re_path(r'^movebank/(?P<table>\w+)/(?P<format>\w+)/(?P<limit>\w+)/$', views.movebank),
]
