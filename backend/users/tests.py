import os
from io import StringIO
from unittest import mock

from django.contrib.auth.hashers import check_password
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient, APITestCase
from rest_framework.throttling import ScopedRateThrottle

from users.models import User

STRONG = "Secreta12345"


def make_admin():
    return User.objects.create_user(username="admin", email="admin@correo.com", password="Admin12345x", is_staff=True, is_superuser=True)


def make_user(name="maria", password="MariaSecreta1"):
    return User.objects.create_user(username=name, email=f"{name}@correo.com", password=password)


class NoPasswordInResponsesTests(APITestCase):
    """Corrección 1: la contraseña (hash) no aparece nunca en una respuesta de la API."""

    def setUp(self):
        cache.clear()
        self.admin = make_admin()
        self.maria = make_user()
        self.client = APIClient()

    def assertNoSecrets(self, data):
        text = str(data).lower()
        self.assertNotIn("password", text)
        self.assertNotIn("pbkdf2", text)

    def test_me_has_no_password(self):  # el endpoint de datos personales
        self.client.force_authenticate(self.maria)
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, 200)
        self.assertNoSecrets(response.json())
        self.assertEqual(response.json()["email"], "maria@correo.com")

    def test_user_list_and_detail_have_no_password(self):
        self.client.force_authenticate(self.admin)
        self.assertNoSecrets(self.client.get("/api/v1/users/").json())
        self.assertNoSecrets(self.client.get(f"/api/v1/users/{self.maria.pk}/").json())

    def test_create_update_responses_have_no_password(self):
        self.client.force_authenticate(self.admin)
        created = self.client.post("/api/v1/users/", {"username": "pepe", "email": "pepe@correo.com", "password": STRONG}, format="json")
        self.assertEqual(created.status_code, 201)
        self.assertNoSecrets(created.json())
        for method in (self.client.patch, self.client.put):
            response = method(f"/api/v1/users/{created.json()['id']}/", {"username": "pepe", "email": "pepe@correo.com", "password": "OtraClave99x"}, format="json")
            self.assertEqual(response.status_code, 200)
            self.assertNoSecrets(response.json())

    def test_register_response_has_no_password(self):
        response = self.client.post("/api/v1/auth/register/", {"username": "luis", "email": "luis@correo.com", "password": STRONG, "password_confirm": STRONG}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertNoSecrets(response.json())

    def test_login_response_only_has_tokens(self):
        response = self.client.post("/api/v1/auth/token/", {"email": "maria@correo.com", "password": "MariaSecreta1"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.json()), {"access", "refresh"})


class PasswordUpdateTests(APITestCase):
    """Corrección 2: la contraseña solo cambia cuando viene en la petición (y siempre cifrada)."""

    def setUp(self):
        cache.clear()
        self.admin = make_admin()
        self.maria = make_user()
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        self.url = f"/api/v1/users/{self.maria.pk}/"

    def test_patch_without_password_keeps_the_target_password(self):
        before = User.objects.get(pk=self.maria.pk).password
        response = self.client.patch(self.url, {"first_name": "María"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.maria.refresh_from_db()
        self.assertEqual(self.maria.first_name, "María")
        self.assertEqual(self.maria.password, before)                          # no cambió
        self.assertTrue(check_password("MariaSecreta1", self.maria.password))  # sigue entrando con la suya
        self.assertFalse(check_password("Admin12345x", self.maria.password))   # NO heredó la del admin

    def test_patch_with_password_changes_it_and_hashes_it(self):
        self.client.patch(self.url, {"password": "NuevaClave99x"}, format="json")
        self.maria.refresh_from_db()
        self.assertNotEqual(self.maria.password, "NuevaClave99x")
        self.assertTrue(self.maria.password.startswith("pbkdf2_"))
        self.assertTrue(check_password("NuevaClave99x", self.maria.password))

    def test_put_hashes_the_password(self):  # el manual lo guardaba en texto plano
        body = {"username": "maria", "email": "maria@correo.com", "password": "NuevaClave99x"}
        self.assertEqual(self.client.put(self.url, body, format="json").status_code, 200)
        self.maria.refresh_from_db()
        self.assertNotEqual(self.maria.password, "NuevaClave99x")
        self.assertTrue(check_password("NuevaClave99x", self.maria.password))

    def test_put_without_password_keeps_it(self):
        self.client.put(self.url, {"username": "maria", "email": "maria@correo.com"}, format="json")
        self.maria.refresh_from_db()
        self.assertTrue(check_password("MariaSecreta1", self.maria.password))

    def test_create_with_form_data_works(self):  # el manual lanzaba "QueryDict instance is immutable"
        response = self.client.post("/api/v1/users/", {"username": "pepe", "email": "pepe@correo.com", "password": STRONG}, format="multipart")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(check_password(STRONG, User.objects.get(username="pepe").password))

    def test_weak_password_is_rejected_on_update(self):
        response = self.client.patch(self.url, {"password": "abc"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.json())

    def test_password_is_required_when_creating(self):
        response = self.client.post("/api/v1/users/", {"username": "pepe", "email": "pepe@correo.com"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.json())


class PermissionsTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = make_admin()
        self.maria = make_user()
        self.client = APIClient()

    def test_anonymous_cannot_use_protected_endpoints(self):
        self.assertEqual(self.client.get("/api/v1/users/").status_code, 401)
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 401)

    def test_normal_user_cannot_manage_users(self):
        self.client.force_authenticate(self.maria)
        self.assertEqual(self.client.get("/api/v1/users/").status_code, 403)
        self.assertEqual(self.client.patch(f"/api/v1/users/{self.admin.pk}/", {"first_name": "x"}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(f"/api/v1/users/{self.admin.pk}/").status_code, 403)

    def test_admin_cannot_delete_own_account(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(f"/api/v1/users/{self.admin.pk}/").status_code, 403)
        self.assertTrue(User.objects.filter(pk=self.admin.pk).exists())
        self.assertEqual(self.client.delete(f"/api/v1/users/{self.maria.pk}/").status_code, 204)

    def test_a_bad_token_does_not_block_public_registration(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer token.invalido.xyz")
        body = {"username": "luis", "email": "luis@correo.com", "password": STRONG, "password_confirm": STRONG}
        self.assertEqual(self.client.post("/api/v1/auth/register/", body, format="json").status_code, 201)


class RegisterTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.body = {"username": "luis", "email": "Luis@Correo.com", "password": STRONG, "password_confirm": STRONG}

    def post(self, **changes):
        return self.client.post("/api/v1/auth/register/", {**self.body, **changes}, format="json")

    def test_register_ok_stores_hash_and_lowercase_email(self):
        response = self.post()
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="luis")
        self.assertEqual(user.email, "luis@correo.com")
        self.assertTrue(user.password.startswith("pbkdf2_"))
        self.assertFalse(user.is_staff)

    def test_cannot_register_as_admin(self):  # mass assignment
        self.assertEqual(self.post(is_staff=True, is_superuser=True).status_code, 201)
        user = User.objects.get(username="luis")
        self.assertFalse(user.is_staff or user.is_superuser)

    def test_password_rules(self):
        for bad in ["corta1A", "sinmayusculas123", "SINMINUSCULAS123", "SinNumerosAqui", "12345678", "Password1"]:
            response = self.post(password=bad, password_confirm=bad)
            self.assertEqual(response.status_code, 400, bad)
            self.assertIn("password", response.json(), bad)

    def test_password_must_match(self):
        response = self.post(password_confirm="OtraDistinta1")
        self.assertEqual(response.status_code, 400)
        self.assertIn("password_confirm", response.json())

    def test_duplicate_email_is_case_insensitive(self):
        self.assertEqual(self.post().status_code, 201)
        response = self.post(username="otro", email="LUIS@correo.COM")
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())

    def test_duplicate_username(self):
        self.post()
        self.assertEqual(self.post(email="otro@correo.com").status_code, 400)

    def test_required_fields_and_bad_email(self):
        self.assertEqual(self.client.post("/api/v1/auth/register/", {}, format="json").status_code, 400)
        self.assertEqual(self.post(email="no-es-correo").status_code, 400)

    def test_registered_user_can_login_with_any_email_case(self):
        self.post()
        response = self.client.post("/api/v1/auth/token/", {"email": "LUIS@CORREO.COM", "password": STRONG}, format="json")
        self.assertEqual(response.status_code, 200)
        me = self.client.get("/api/v1/auth/me/", HTTP_AUTHORIZATION=f"Bearer {response.json()['access']}")
        self.assertEqual(me.json()["username"], "luis")
        self.assertFalse(me.json()["is_staff"])


class LoginTests(APITestCase):
    def setUp(self):
        cache.clear()
        make_user()
        self.client = APIClient()

    def test_wrong_password_and_unknown_email_get_the_same_answer(self):
        a = self.client.post("/api/v1/auth/token/", {"email": "maria@correo.com", "password": "Mala12345x"}, format="json")
        b = self.client.post("/api/v1/auth/token/", {"email": "nadie@correo.com", "password": "Mala12345x"}, format="json")
        self.assertEqual((a.status_code, b.status_code), (401, 401))
        self.assertEqual(a.json(), b.json())

    def test_inactive_user_cannot_login(self):
        User.objects.filter(username="maria").update(is_active=False)
        response = self.client.post("/api/v1/auth/token/", {"email": "maria@correo.com", "password": "MariaSecreta1"}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_login_is_rate_limited(self):
        with mock.patch.object(ScopedRateThrottle, "THROTTLE_RATES", {"login": "3/min", "register": "10/hour", "recipes": "120/min"}):
            codes = [self.client.post("/api/v1/auth/token/", {"email": "maria@correo.com", "password": "Mala12345x"}, format="json").status_code for _ in range(5)]
        self.assertEqual(codes, [401, 401, 401, 429, 429])


class ManagementAndAdminTests(TestCase):
    def test_createsuperuser_works(self):  # con el modelo del manual fallaba con TypeError
        with mock.patch.dict(os.environ, {"DJANGO_SUPERUSER_PASSWORD": "Admin12345x"}):
            call_command("createsuperuser", interactive=False, email="root@correo.com", username="root", stdout=StringIO())
        user = User.objects.get(email="root@correo.com")
        self.assertTrue(user.is_superuser and user.is_staff)
        self.assertTrue(user.check_password("Admin12345x"))

    def test_admin_site_hashes_passwords(self):  # con admin.site.register(User) se guardaba en texto plano
        make_admin()
        self.client.force_login(User.objects.get(username="admin"))
        self.assertEqual(self.client.get("/admin/users/user/add/").status_code, 200)
        response = self.client.post("/admin/users/user/add/", {
            "email": "nuevo@correo.com", "username": "nuevo", "password1": "ClaveFuerte123x", "password2": "ClaveFuerte123x",
        })
        self.assertEqual(response.status_code, 302)
        created = User.objects.get(username="nuevo")
        self.assertNotEqual(created.password, "ClaveFuerte123x")
        self.assertTrue(created.check_password("ClaveFuerte123x"))
        self.assertEqual(self.client.get(f"/admin/users/user/{created.pk}/change/").status_code, 200)
