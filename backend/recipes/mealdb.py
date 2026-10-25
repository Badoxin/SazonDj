"""
Cliente de TheMealDB (API externa de recetas).

La clave de la API vive en el .env del servidor: el navegador solo habla con NUESTRA API
y nunca ve la clave. Aquí también se normalizan las respuestas y se guardan en caché.
"""
import logging
import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

import requests
from django.conf import settings
from django.core.cache import cache
from rest_framework.exceptions import APIException

logger = logging.getLogger(__name__)

TIMEOUT = 8  # segundos
MINUTE = 60


class UpstreamError(APIException):
    status_code = 502
    default_detail = "No pudimos conectar con el servicio de recetas. Intenta de nuevo en un momento."
    default_code = "upstream_error"


def _call(endpoint, **params):
    url = f"{settings.THEMEALDB_BASE_URL}/{settings.THEMEALDB_API_KEY}/{endpoint}"
    try:
        response = requests.get(url, params=params, timeout=TIMEOUT)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError):
        # No se registra el error original porque su mensaje incluye la URL (y con ella la clave).
        logger.error("TheMealDB: falló la llamada a %s", endpoint)
        raise UpstreamError()


def _meals(data):
    """TheMealDB devuelve null (o un texto) cuando no hay resultados."""
    meals = data.get("meals") if isinstance(data, dict) else None
    return meals if isinstance(meals, list) else []


def _safe_url(value):
    """Solo enlaces http(s): evita esquemas peligrosos como javascript:"""
    if not value:
        return None
    try:
        parsed = urlparse(value)
    except ValueError:
        return None
    return value if parsed.scheme in ("http", "https") and parsed.netloc else None


def to_summary(meal):
    item = {"id": meal["idMeal"], "name": meal["strMeal"], "image": meal["strMealThumb"]}
    if meal.get("strCategory"):
        item["category"] = meal["strCategory"]
    if meal.get("strArea"):
        item["area"] = meal["strArea"]
    return item


def to_recipe(meal):
    ingredients = []
    for i in range(1, 21):
        name = (meal.get(f"strIngredient{i}") or "").strip()
        if name:
            ingredients.append({"name": name, "measure": (meal.get(f"strMeasure{i}") or "").strip()})

    steps = []
    for line in (meal.get("strInstructions") or "").splitlines():
        line = re.sub(r"^\d+[.)]\s+", "", line.strip())
        if line and not re.match(r"^(step\s*)?\d+[.)]?$", line, re.IGNORECASE):
            steps.append(line)

    return {
        **to_summary(meal),
        "category": meal.get("strCategory") or "",
        "area": meal.get("strArea") or "",
        "tags": [t.strip() for t in (meal.get("strTags") or "").split(",") if t.strip()],
        "youtube": _safe_url(meal.get("strYoutube")),
        "source": _safe_url(meal.get("strSource")),
        "ingredients": ingredients,
        "steps": steps,
    }


def search_by_name(query):
    return [to_summary(m) for m in _meals(_call("search.php", s=query))]


def get_by_id(recipe_id):
    meals = _meals(_call("lookup.php", i=recipe_id))
    return to_recipe(meals[0]) if meals else None


def get_random():
    meals = _meals(_call("random.php"))
    return to_summary(meals[0]) if meals else None


def _safe_random():
    try:
        return _meals(_call("random.php"))
    except UpstreamError:
        return []


def get_featured(count=6):
    """La clave gratuita solo da 1 receta al azar por llamada: se piden varias en paralelo y se guardan 10 min."""

    def load():
        with ThreadPoolExecutor(max_workers=8) as pool:
            batches = list(pool.map(lambda _: _safe_random(), range(count + 4)))
        unique = {}
        for meals in batches:
            for meal in meals:
                unique[meal["idMeal"]] = to_summary(meal)
        if not unique:
            raise UpstreamError()
        return list(unique.values())[:count]

    return cache.get_or_set(f"featured:{count}", load, 10 * MINUTE)


def get_categories():
    return cache.get_or_set(
        "categories",
        lambda: [m["strCategory"] for m in _meals(_call("list.php", c="list")) if m.get("strCategory")],
        24 * 60 * MINUTE,
    )


def get_areas():
    return cache.get_or_set(
        "areas",
        lambda: [
            m["strArea"] for m in _meals(_call("list.php", a="list")) if m.get("strArea") and m["strArea"] != "Unknown"
        ],
        24 * 60 * MINUTE,
    )


def filter_by(category="", area=""):
    """Filtra por categoría y/o país. Si vienen los dos, se intersectan los resultados."""
    by_category = _meals(_call("filter.php", c=category)) if category else None
    by_area = _meals(_call("filter.php", a=area)) if area else None

    meals = by_category if by_category is not None else (by_area or [])
    if by_category is not None and by_area is not None:
        ids = {m["idMeal"] for m in by_area}
        meals = [m for m in by_category if m["idMeal"] in ids]

    results = []
    for meal in meals:
        item = to_summary(meal)
        if category:
            item["category"] = category
        if area:
            item["area"] = area
        results.append(item)
    return results
