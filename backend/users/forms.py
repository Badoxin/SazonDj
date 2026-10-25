from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from users.models import User


# El admin de Django trae formularios hechos para el User original (auth.User).
# Con un usuario personalizado hay que indicarle los campos propios.
class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("email", "username", "telefono")


class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = "__all__"
