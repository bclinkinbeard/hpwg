from django.urls import path
from django.shortcuts import render
from django.urls import include, path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('arrow/', views.arrow, name='arrow'),
]