# serializers.py
from rest_framework import serializers
from .models import Player

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['player_id',
                  'first_name',
                  'last_name',
                  'position',
                  'team',
                  'date_of_birth',
                  'height',
                  'weight',
                  'is_active'
        ]