from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

# Create your models here.
class Season(models.Model):
    season_id = models.AutoField(primary_key=True)
    year = models.PositiveIntegerField(unique=True, validators=[MinValueValidator(1920), MaxValueValidator(2030)])

    class Meta:
        ordering = ["-year"]

    def __str__(self):
        return str(self.year