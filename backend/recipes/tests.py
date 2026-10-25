from unittest import mock

import requests
from django.core.cache import cache
from rest_framework.test import APIClient, APITestCase

MEAL = {
    "idMeal": "52772", "strMeal": "Teriyaki Chicken", "strCategory": "Chicken", "strArea": "Japanese",
    "strMealThumb": "https://img.test/52772.jpg",
    "strInstructions": "STEP 1\r\nBoil the pasta.\r\n2. Fry the mushrooms.\r\n\r\nServe hot.",
    "strTags": "Pasta,Cheap", "strYoutube": "https://youtube.com/watch?v=abc", "strSource": "javascript:alert(1)",
    "strIngredient1": "Pasta", "strMeasure1": "320g", "strIngredient2": "Cream", "strMeasure2": "1 cup",
    "strIngredient3": "", "strMeasure3": " ",
}
OTHER = {**MEAL, "idMeal": "52771", "strMeal": "Spicy Arrabiata", "strCategory": "Vegetarian", "strArea": "Italian"}


def fake_get(url, params=None, timeout=None):
    endpoint = url.rsplit("/", 1)[-1]
    params = params or {}
    payload = {"meals": None}
    if endpoint == "random.php":
        payload = {"meals": [MEAL]}
    elif endpoint == "search.php":
        payload = {"meals": None if "zzz" in params["s"] else [MEAL, OTHER]}
    elif endpoint == "lookup.php":
        payload = {"meals": [MEAL] if params["i"] == "52772" else None}
    elif endpoint == "list.php":
        payload = {"meals": [{"strCategory": "Beef"}] if "c" in params else [{"strArea": "Italian"}, {"strArea": "Unknown"}]}
    elif endpoint == "filter.php":
        pool = {"Chicken": [MEAL], "Japanese": [MEAL], "Italian": [OTHER]}
        payload = {"meals": pool.get(params.get("c") or params.get("a")) or "None Found"}
    response = mock.Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = payload
    return response


class RecipesApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        patcher = mock.patch("recipes.mealdb.requests.get", side_effect=fake_get)
        self.get = patcher.start()
        self.addCleanup(patcher.stop)

    def test_detail_is_normalised_and_unsafe_links_are_dropped(self):
        recipe = self.client.get("/api/v1/recipes/52772/").json()["recipe"]
        self.assertEqual(recipe["steps"], ["Boil the pasta.", "Fry the mushrooms.", "Serve hot."])
        self.assertEqual(recipe["ingredients"], [{"name": "Pasta", "measure": "320g"}, {"name": "Cream", "measure": "1 cup"}])
        self.assertEqual(recipe["tags"], ["Pasta", "Cheap"])
        self.assertIsNone(recipe["source"])  # javascript: no se acepta
        self.assertTrue(recipe["youtube"].startswith("https://"))

    def test_search_filters_and_intersection(self):
        self.assertEqual(len(self.client.get("/api/v1/recipes/?q=chicken").json()["results"]), 2)
        self.assertEqual(self.client.get("/api/v1/recipes/?q=zzz").json()["results"], [])
        self.assertEqual([r["id"] for r in self.client.get("/api/v1/recipes/?category=Chicken").json()["results"]], ["52772"])
        self.assertEqual(self.client.get("/api/v1/recipes/?category=Chicken&area=Italian").json()["results"], [])
        self.assertEqual(len(self.client.get("/api/v1/recipes/?category=Chicken&area=Japanese").json()["results"]), 1)

    def test_lists_and_featured(self):
        self.assertEqual(self.client.get("/api/v1/recipes/categories/").json(), {"categories": ["Beef"]})
        self.assertEqual(self.client.get("/api/v1/recipes/areas/").json(), {"areas": ["Italian"]})  # sin "Unknown"
        featured = self.client.get("/api/v1/recipes/featured/?count=3").json()["results"]
        self.assertEqual([r["id"] for r in featured], ["52772"])  # sin repetidos
        self.assertEqual(self.client.get("/api/v1/recipes/random/").json()["recipe"]["id"], "52772")

    def test_invalid_input_is_rejected_before_calling_the_api(self):
        self.get.reset_mock()
        for url in ["/api/v1/recipes/abc/", "/api/v1/recipes/?q=%3Cscript%3E", "/api/v1/recipes/?category=Beef%3BDROP",
                    "/api/v1/recipes/?area=" + "x" * 40, "/api/v1/recipes/?q=" + "a" * 61]:
            self.assertEqual(self.client.get(url).status_code, 400, url)
        self.assertEqual(self.get.call_count, 0)

    def test_missing_recipe_is_404(self):
        self.assertEqual(self.client.get("/api/v1/recipes/99999999/").status_code, 404)

    def test_upstream_failure_is_a_clean_502_without_the_key(self):
        self.get.side_effect = requests.ConnectionError("https://www.themealdb.com/api/json/v1/1/random.php fallo")
        response = self.client.get("/api/v1/recipes/52772/")
        self.assertEqual(response.status_code, 502)
        self.assertNotIn("themealdb", response.content.decode().lower())

    def test_the_api_key_never_reaches_the_client(self):
        from django.conf import settings
        with mock.patch.object(settings, "THEMEALDB_API_KEY", "CLAVE-SECRETA-123"):
            for url in ["/api/v1/recipes/52772/", "/api/v1/recipes/?q=chicken", "/api/v1/recipes/categories/"]:
                self.assertNotIn("CLAVE-SECRETA-123", self.client.get(url).content.decode())
            self.assertIn("CLAVE-SECRETA-123", self.get.call_args_list[0].args[0])  # sí se usa del lado del servidor

    def test_recipes_are_public_and_swagger_is_available(self):
        self.assertEqual(self.client.get("/api/v1/recipes/categories/").status_code, 200)
        self.assertEqual(self.client.get("/swagger/").status_code, 200)
        schema = self.client.get("/swagger.json").json()
        self.assertIn("/auth/token/", schema["paths"])
        self.assertIn("Bearer", schema["securityDefinitions"])
