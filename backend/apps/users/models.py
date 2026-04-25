from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        USER = 'user', 'User'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER,
    )

    def save(self, *args, **kwargs):
        if self.is_superuser: # Django built-in superuser automatically gets staff status
            self.is_staff = True
            self.role = self.Role.ADMIN
        else:
            self.is_staff = self.role == self.Role.ADMIN # Grant staff status to custom admin model we have

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username}: {self.get_role_display()}"