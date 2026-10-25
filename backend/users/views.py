from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView

from users.models import User
from users.serializers import EmailTokenObtainPairSerializer, MeSerializer, RegisterSerializer, UserSerializer


class UserApiViewSet(ModelViewSet):
    """CRUD de usuarios. Solo administradores."""

    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by("id")

    # Ya no se sobreescriben create() ni partial_update():
    # el serializer cifra la contraseña solo cuando viene en la petición (ver UserSerializer).

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise PermissionDenied("No puedes eliminar tu propia cuenta.")
        instance.delete()


class UserView(RetrieveAPIView):
    """Datos personales del usuario con sesión iniciada (sin contraseña)."""

    permission_classes = [IsAuthenticated]
    serializer_class = MeSerializer

    def get_object(self):
        return self.request.user


class RegisterUserView(CreateAPIView):
    """Registro público de usuarios."""

    permission_classes = [AllowAny]
    authentication_classes = []  # un token vencido o inválido no debe bloquear un registro
    serializer_class = RegisterSerializer
    throttle_scope = "register"

    @swagger_auto_schema(responses={201: "Usuario registrado exitosamente", 400: "Datos no válidos"})
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"message": "Usuario registrado exitosamente", "user": {"username": user.username, "email": user.email}},
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """Login: recibe email y password; devuelve los tokens access y refresh."""

    serializer_class = EmailTokenObtainPairSerializer
    throttle_scope = "login"
