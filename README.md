# SAZÓN — recetas (Django + React)

- **Backend:** Django + Django REST Framework + JWT (carpeta `backend/`). MySQL (o SQLite).
- **Frontend:** React + Vite + Semantic UI + SASS (carpeta `src/`).
- **API externa:** TheMealDB (la clave vive solo en `backend/.env`).

La documentación de la práctica (adaptaciones y errores del manual corregidos) está en
[`docs/practica-django-react.md`](docs/practica-django-react.md).

## Cómo correrlo

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows   (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env           # Mac/Linux: cp .env.example .env
```
Llena `DJANGO_SECRET_KEY` y `DB_PASSWORD` en `backend/.env`. Para generar la llave:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
En MySQL Workbench crea la base de datos (o pon `DB_ENGINE=sqlite` en el `.env` y sáltate esto):
```sql
CREATE DATABASE sazon_django CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
API en http://localhost:8000 · Swagger en http://localhost:8000/swagger/ · Admin en http://localhost:8000/admin/

### 2. Frontend
```bash
copy .env.example .env           # Mac/Linux: cp .env.example .env
npm install
npm run dev
```
Web en http://localhost:8443

### 3. Pruebas del backend
```bash
cd backend
python manage.py test
```
