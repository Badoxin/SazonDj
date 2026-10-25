"""
Configuración de Django para SAZÓN.

Adaptaciones respecto al manual:
  - Los secretos (SECRET_KEY, contraseña de la BD, clave de la API externa) salen de un archivo .env.
  - CORS solo permite el frontend (el manual abre CORS a todo el mundo).
  - Seguridad por defecto: toda vista exige sesión salvo que se indique lo contrario.
  - Límite de intentos (throttling) en login y registro.
  - Swagger con autenticación Bearer (el manual activa SessionAuthentication solo para que funcione Swagger).
"""
import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env(name, default=None, required=False):
    value = os.environ.get(name, default)
    if required and not value:
        raise ImproperlyConfigured(
            f"Falta la variable {name} en backend/.env (copia backend/.env.example a backend/.env y llénalo)."
        )
    return value


def env_list(name, default=""):
    return [item.strip() for item in env(name, default).split(",") if item.strip()]


# ---------------------------------------------------------------- Seguridad básica
SECRET_KEY = env("DJANGO_SECRET_KEY", required=True)
DEBUG = env("DJANGO_DEBUG", "False") == "True"
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost")

# ---------------------------------------------------------------- Aplicaciones
BASE_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_APPS = [
    "rest_framework",
    "drf_yasg",
    "corsheaders",
]

# Nota: el manual define "OWN_APP" y después "OWN_APPS"; con ese nombre distinto la app 'users'
# nunca se instalaba. Aquí se usa el mismo nombre en los dos lados.
OWN_APPS = [
    "users",
    "recipes",
]

INSTALLED_APPS = BASE_APPS + THIRD_APPS + OWN_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "sazon.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "sazon.wsgi.application"

# ---------------------------------------------------------------- Base de datos
# sqlite: no requiere configurar nada. mysql: el mismo servidor que usas en MySQL Workbench.
if env("DB_ENGINE", "sqlite") == "mysql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": env("DB_NAME", "sazon_django"),
            "USER": env("DB_USER", "root"),
            "PASSWORD": env("DB_PASSWORD", ""),
            "HOST": env("DB_HOST", "127.0.0.1"),
            "PORT": env("DB_PORT", "3306"),
            "OPTIONS": {"charset": "utf8mb4"},
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# ---------------------------------------------------------------- Usuarios y contraseñas
AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
    {"NAME": "users.validators.ComplexityValidator"},  # mayúscula + minúscula + número
]

# ---------------------------------------------------------------- Django REST Framework y JWT
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # Seguro por defecto: si una vista no declara permisos, exige iniciar sesión.
    # (El valor por defecto de DRF es AllowAny, es decir, abierto a todo el mundo.)
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.ScopedRateThrottle",),
    "DEFAULT_THROTTLE_RATES": {
        "login": "10/min",
        "register": "10/hour",
        "recipes": "120/min",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ---------------------------------------------------------------- Swagger / ReDoc
ENABLE_DOCS = env("DJANGO_ENABLE_DOCS", "True") == "True"

SWAGGER_SETTINGS = {
    # Se autoriza con el token JWT (botón "Authorize": Bearer <access>), no con la sesión de Django.
    "USE_SESSION_AUTH": False,
    "SECURITY_DEFINITIONS": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Escribe: Bearer <tu token access>",
        }
    },
}

# ---------------------------------------------------------------- CORS
# El manual usa CORS_ORIGIN_ALLOW_ALL = True (cualquier sitio web podría llamar a la API desde un navegador).
# Aquí solo se permite el frontend. No hacen falta cookies, porque el token va en el encabezado Authorization.
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:8443,http://127.0.0.1:8443")
CORS_ALLOW_CREDENTIALS = False

# ---------------------------------------------------------------- API externa de recetas (TheMealDB)
THEMEALDB_API_KEY = env("THEMEALDB_API_KEY", "1")
THEMEALDB_BASE_URL = env("THEMEALDB_BASE_URL", "https://www.themealdb.com/api/json/v1")

# ---------------------------------------------------------------- Varios
LANGUAGE_CODE = "es-mx"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
