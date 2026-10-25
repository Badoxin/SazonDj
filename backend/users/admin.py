from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from users.forms import CustomUserChangeForm, CustomUserCreationForm
from users.models import User


# El manual usa admin.site.register(User). Eso muestra el hash de la contraseña como un campo de texto
# editable y, al crear usuarios desde el admin, guarda la contraseña SIN cifrar. UserAdmin sí la cifra.
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    ordering = ("email",)
    list_display = ("email", "username", "first_name", "last_name", "telefono", "is_staff", "is_active")
    search_fields = ("email", "username", "first_name", "last_name", "telefono")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Datos personales", {"fields": ("username", "first_name", "last_name", "telefono")}),
        ("Permisos", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Fechas importantes", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "username", "telefono", "password1", "password2")}),
    )
