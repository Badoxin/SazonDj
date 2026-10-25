from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Usuario que inicia sesión con su correo en lugar del username."""

    email = models.EmailField(unique=True, error_messages={"unique": "Ya existe un usuario con este correo."})
    telefono = models.CharField("Teléfono", max_length=30, blank=True)

    USERNAME_FIELD = "email"
    # Corrección al manual: con REQUIRED_FIELDS = [] el comando "createsuperuser" falla con
    #   TypeError: create_superuser() missing 1 required positional argument: 'username'
    # porque el manager de AbstractUser necesita el username.
    REQUIRED_FIELDS = ["username"]

    def save(self, *args, **kwargs):
        # Un solo formato para el correo: así "Ana@Correo.com" y "ana@correo.com" son la misma cuenta.
        self.email = (self.email or "").strip().lower()
        self.telefono = (self.telefono or "").strip()
        super().save(*args, **kwargs)
