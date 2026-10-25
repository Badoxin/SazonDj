from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from users.models import User


def _unique_email(value, instance=None):
    """Correo en minúsculas y único sin importar mayúsculas."""
    value = value.strip().lower()
    taken = User.objects.filter(email__iexact=value)
    if instance is not None:
        taken = taken.exclude(pk=instance.pk)
    if taken.exists():
        raise serializers.ValidationError("Ya existe un usuario con este correo.")
    return value


class UserSerializer(serializers.ModelSerializer):
    """
    CRUD de usuarios (solo para administradores).

    CORRECCIÓN 1: la contraseña es write_only. Se puede ENVIAR, pero nunca aparece en una respuesta.
    CORRECCIÓN 2: el cifrado se hace aquí (create/update) y no en la vista. Así funciona igual para
    POST, PUT y PATCH, y la contraseña solo cambia cuando viene en la petición.
    """

    password = serializers.CharField(write_only=True, required=False, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "telefono", "password", "is_active", "is_staff", "date_joined"]
        read_only_fields = ["id", "date_joined"]

    def validate_email(self, value):
        return _unique_email(value, self.instance)

    def validate_password(self, value):
        validate_password(value, self.instance)
        return value

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Este campo es obligatorio."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)  # create_user cifra la contraseña

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if password:  # solo si vino en la petición
            instance.set_password(password)
            instance.save(update_fields=["password"])
        return instance


class MeSerializer(serializers.ModelSerializer):
    """Datos personales del usuario que inició sesión. Todo es de solo lectura y sin contraseña."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "telefono", "is_staff", "date_joined"]
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    """Registro público. Solo acepta estos campos: nadie puede registrarse como administrador."""

    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["username", "email", "telefono", "password", "password_confirm"]

    def validate_email(self, value):
        return _unique_email(value)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Las contraseñas no coinciden."})
        # Se validan las reglas de contraseña de Django (largo, comunes, solo números, complejidad...)
        candidate = User(username=attrs["username"], email=attrs["email"])
        try:
            validate_password(attrs["password"], candidate)
        except Exception as error:  # DjangoValidationError → error de campo
            raise serializers.ValidationError({"password": list(getattr(error, "messages", [str(error)]))})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        return User.objects.create_user(**validated_data)


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Login con correo sin importar mayúsculas ("ANA@correo.com" = "ana@correo.com")."""

    def validate(self, attrs):
        attrs[self.username_field] = str(attrs.get(self.username_field, "")).strip().lower()
        return super().validate(attrs)
