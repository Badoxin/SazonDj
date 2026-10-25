# Práctica: Desarrollo full stack con Django y React — SAZÓN

Proyecto: página de recetas **SAZÓN**. Se siguió el manual de Django REST Framework + React y, como piden las
instrucciones, **se adaptó y se corrigió**. Este documento resume lo que se hizo, lo que se encontró mal en el manual y cómo
se comprobó cada cosa.

## 1. Qué se construyó

| Parte | Tecnología | Carpeta |
|---|---|---|
| API de usuarios (registro, login, perfil, CRUD de administrador) | Django + DRF + SimpleJWT | `backend/users/` |
| Documentación de la API | drf-yasg (Swagger y ReDoc) | `/swagger/`, `/redoc/` |
| API de recetas (consume TheMealDB, la clave queda en el servidor) | `requests` + caché | `backend/recipes/` |
| Base de datos | MySQL (o SQLite con `DB_ENGINE=sqlite`) | `backend/sazon/settings.py` |
| Interfaz | React + Vite + TypeScript | `src/` |
| Estilos | Semantic UI + SASS | `src/styles/`, `src/App.scss` |
| Rutas y layouts | React Router v6 (Admin, Client, Common) | `src/routes/`, `src/layouts/` |
| Sesión | Context + custom hook, token JWT en `localStorage` | `src/context/`, `src/hooks/` |
| Formularios y avisos | Formik + Yup, react-toastify | `src/pages/common/` |

### Endpoints
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/v1/auth/register/` | Público |
| POST | `/api/v1/auth/token/` | Público (email + contraseña → `access` y `refresh`) |
| POST | `/api/v1/auth/token/refresh/` | Público |
| GET | `/api/v1/auth/me/` | Usuario con sesión (sin contraseña) |
| GET/POST | `/api/v1/users/` | Solo administradores |
| GET/PUT/PATCH/DELETE | `/api/v1/users/{id}/` | Solo administradores |
| GET | `/api/v1/recipes/`, `/featured/`, `/random/`, `/categories/`, `/areas/`, `/{id}/` | Público (con límite de peticiones) |

## 2. Errores del manual encontrados y corregidos

Cada falla se **reprodujo** con el código del manual tal cual (proyecto de prueba) antes de corregirla.

### Fallas de seguridad pedidas en la práctica

**1. El hash de la contraseña aparece en las respuestas de la API (incluido `/auth/me/`).**
- *Causa:* `UserSerializer` incluye `password` en `fields`, y lo usan tanto el listado/detalle de usuarios como el endpoint de datos personales.
- *Evidencia:* `GET /api/v1/auth/me/` devolvía `"password": "pbkdf2_sha256$..."`, y `GET /api/v1/users/` el hash de **todos** los usuarios.
- *Corrección:* `password` es `write_only` (se puede enviar, nunca se devuelve) y `/auth/me/` usa un `MeSerializer` aparte, de solo lectura y sin contraseña.
  Archivos: `backend/users/serializers.py`, `backend/users/views.py`.

**2. Al actualizar un usuario sin enviar contraseña se le asigna la contraseña de quien hace la petición.**
- *Causa:* `partial_update` hacía `request.data["password"] = request.user.password` en el `else`.
- *Evidencia:* el administrador hacía `PATCH` a María solo con `first_name`; después María **entraba con la contraseña del administrador** y dejaba de entrar con la suya.
- *Corrección:* la vista ya no toca la contraseña. El serializer solo la cambia **si viene en la petición** (`update()` → `set_password`).
  Prueba: `PasswordUpdateTests.test_patch_without_password_keeps_the_target_password`.

### Otras fallas encontradas

| # | Falla en el manual | Evidencia | Corrección |
|---|---|---|---|
| 3 | `PUT` (update completo) no se sobreescribe: la contraseña se guarda **en texto plano**. | `PUT` con `"password": "NuevaClave99"` → en la BD quedó `NuevaClave99`. | El cifrado vive en el serializer (`create` y `update`), así que POST, PUT y PATCH cifran. |
| 4 | `request.data[...] = ...` falla con formularios (`QueryDict` inmutable). | `POST /users/` como formulario → `AttributeError: This QueryDict instance is immutable`. | Ya no se modifica `request.data`. |
| 5 | `REQUIRED_FIELDS = []` hace que `createsuperuser` falle. | `TypeError: create_superuser() missing 1 required positional argument: 'username'`. | `REQUIRED_FIELDS = ["username"]`. |
| 6 | `OWN_APP` y `OWN_APPS` (nombres distintos): la app `users` nunca se instalaba. | — | Un solo nombre, `OWN_APPS`. |
| 7 | `admin.site.register(User)`: el admin muestra el hash como texto editable y guarda contraseñas sin cifrar al crear usuarios. | — | `UserAdmin` con formularios propios (`users/forms.py`, `users/admin.py`). |
| 8 | `CORS_ORIGIN_ALLOW_ALL = True`: cualquier sitio puede llamar a la API desde un navegador. | — | `CORS_ALLOWED_ORIGINS` con una lista blanca (solo el frontend). |
| 9 | DRF deja `AllowAny` por defecto: una vista sin permisos queda abierta. | — | `DEFAULT_PERMISSION_CLASSES = IsAuthenticated`; lo público se declara a propósito. |
| 10 | El registro no valida la contraseña en el servidor (solo el largo en el formulario). | — | Validadores de Django + complejidad (mayúscula, minúscula, número) + confirmación; correo único sin importar mayúsculas; el usuario nunca puede registrarse como administrador. |
| 11 | El "fix" de Swagger agrega `SessionAuthentication` (sesiones + CSRF) a toda la API. | — | Swagger usa el token JWT (botón *Authorize*: `Bearer <token>`), sin sesiones. |
| 12 | `SECRET_KEY` y `DEBUG=True` escritos en `settings.py` (y se suben a GitHub). | — | Variables en `backend/.env` (ignorado por Git); el servidor no arranca sin `DJANGO_SECRET_KEY`. |
| 13 | Sin límite de intentos en login y registro (fuerza bruta). | — | `ScopedRateThrottle`: 10/min en login, 10/hora en registro. |
| 14 | El panel (`AdminLayout`) solo revisa que haya sesión: cualquier usuario podía abrirlo. | — | También exige `is_staff` (y el servidor lo vuelve a exigir con `IsAdminUser`). |
| 15 | Si `/auth/me/` falla justo después del login, el token queda guardado y la sesión queda a medias. | — | `login()` borra el token si falla. |
| 16 | No se maneja un token vencido. | — | Si el servidor responde 401 con sesión abierta, se cierra la sesión y se avisa con un toast. |
| 17 | `autoComplete="false"` no es un valor válido. | — | `email`, `current-password`, `new-password`. |
| 18 | Etiquetas de los formularios sin `id`: no quedan ligadas a su campo (accesibilidad). | Las pruebas no podían localizar los campos por su etiqueta. | Cada `Form.Input` lleva su `id`; el modal lleva `role="dialog"`. |

## 3. Adaptaciones (decisiones propias)

- **Tema:** SAZÓN (recetas) en lugar de "restaurante". Además de usuarios, Django expone una API de recetas que consume
  TheMealDB: la clave de la API está en `backend/.env` y el navegador nunca la ve.
- **Base de datos:** MySQL (la del curso de la unidad anterior) con opción de SQLite.
- **Semantic UI por componentes:** `semantic.min.css` trae reglas globales (`html { font-size: 14px }`, estilos de `h1`, `a`, `p`, `body`…)
  que cambiarían todo el sitio, así que se importan solo los CSS de los componentes usados, sin `reset` ni `site`.
- **React 18:** `semantic-ui-react` 2.x no es compatible con React 19.
- **React Router v6**, como indica el manual.
- **TypeScript** en el frontend (el manual usa JavaScript).
- **Estructura de carpetas** del manual: `api/`, `context/`, `hooks/`, `layouts/`, `routes/`, `pages/{admin,client,common}`.
- **Dashboard** con CRUD real: lista usuarios, crea (modal), activa/desactiva con `PATCH` y elimina. Un administrador no puede eliminarse ni desactivarse a sí mismo.

### Riesgo aceptado
El token JWT va en `localStorage` porque así lo pide el manual. Es más expuesto a XSS que una cookie `httpOnly`
(que es lo que se usó en la práctica anterior). Mitigaciones: token `access` de 60 minutos, React escapa todo el texto que muestra,
y CORS restringido.

## 4. Pruebas

**Backend (37 pruebas, pasan en SQLite y en MySQL):** `cd backend && python manage.py test`
- Ninguna respuesta (`/auth/me/`, `/users/`, crear, editar, registro, login) contiene la contraseña ni su hash.
- `PATCH` sin contraseña conserva la del usuario; `PATCH` y `PUT` con contraseña la cambian y la cifran.
- Permisos (anónimo 401, cliente 403, admin 200), registro (reglas de contraseña, duplicados, sin escalar a admin), límite de intentos de login,
  `createsuperuser`, admin de Django, API de recetas (normalización, validación de entradas, errores 502, la clave nunca llega al cliente) y Swagger.

**Frontend (11 pruebas contra el backend real):** validación del registro, límites de caracteres, registro y login reales con Django,
error de correo repetido, token en `localStorage`, perfil sin hash, panel prohibido para clientes, cierre de sesión, 404 y CRUD del dashboard.
