import re

from django.core.exceptions import ValidationError


class ComplexityValidator:
    """Exige al menos una mayúscula, una minúscula y un número (las mismas reglas del formulario del frontend)."""

    def validate(self, password, user=None):
        if not (re.search(r"[a-z]", password) and re.search(r"[A-Z]", password) and re.search(r"\d", password)):
            raise ValidationError(
                "La contraseña debe incluir una mayúscula, una minúscula y un número.",
                code="password_too_simple",
            )

    def get_help_text(self):
        return "Debe incluir una mayúscula, una minúscula y un número."
