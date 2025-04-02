from django.urls import path
from .solidity_generator import generate_contract

urlpatterns = [
    path('api/generate-contract', generate_contract, name='generate_contract'),
] 