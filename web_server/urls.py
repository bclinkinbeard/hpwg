from django.urls import path
from django.shortcuts import render
from django.urls import include, path

from . import views

def client(request):
    return render(request, 'client/index.html')

urlpatterns = [
    path('', client),
    path('api/', views.index, name='index'),
]
