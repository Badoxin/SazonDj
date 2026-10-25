from django.urls import include, path
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView

from users import views

router = routers.DefaultRouter()
router.register(r"users", views.UserApiViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("auth/me/", views.UserView.as_view(), name="me"),
    path("auth/register/", views.RegisterUserView.as_view(), name="register"),
    # Aquí se puede usar el nombre auth/token/ o auth/login/ (el frontend usa auth/token/)
    path("auth/token/", views.LoginView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
