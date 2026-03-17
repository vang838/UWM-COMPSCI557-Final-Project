from django.db import models

# Create your models here.
class Season(models.Model):
    season_id = models.AutoField(primary_key=True)
    year = models.IntegerField(unique=True)

    def __str__(self):
        return str(self.year)