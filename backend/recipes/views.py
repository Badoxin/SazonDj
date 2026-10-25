import re

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from recipes import mealdb

# Validación de entradas: nunca se confía en lo que manda el cliente.
QUERY_RE = re.compile(r"^[\w '.,-]{1,60}$")
LABEL_RE = re.compile(r"^[A-Za-z ]{1,30}$")
ID_RE = re.compile(r"^\d{1,8}$")


def bad_request(message):
    return Response({"error": message}, status=400)


class PublicRecipeView(APIView):
    """Las recetas son públicas: no piden sesión, pero sí tienen límite de peticiones."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "recipes"


class RecipeListView(PublicRecipeView):
    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter("q", openapi.IN_QUERY, description="Nombre de la receta (en inglés)", type=openapi.TYPE_STRING),
            openapi.Parameter("category", openapi.IN_QUERY, description="Categoría, por ejemplo Seafood", type=openapi.TYPE_STRING),
            openapi.Parameter("area", openapi.IN_QUERY, description="País, por ejemplo Mexican", type=openapi.TYPE_STRING),
        ]
    )
    def get(self, request):
        q = request.query_params.get("q", "").strip()
        category = request.query_params.get("category", "")
        area = request.query_params.get("area", "")

        if q and not QUERY_RE.match(q):
            return bad_request("La búsqueda contiene caracteres no válidos o es muy larga.")
        if category and not LABEL_RE.match(category):
            return bad_request("Categoría no válida.")
        if area and not LABEL_RE.match(area):
            return bad_request("País no válido.")

        if q:
            results = mealdb.search_by_name(q)
            if category:
                results = [r for r in results if r.get("category") == category]
            if area:
                results = [r for r in results if r.get("area") == area]
        elif category or area:
            results = mealdb.filter_by(category, area)[:60]
        else:
            results = mealdb.get_featured(12)
        return Response({"results": results})


class FeaturedView(PublicRecipeView):
    def get(self, request):
        try:
            count = min(max(int(request.query_params.get("count", 6)), 1), 12)
        except ValueError:
            count = 6
        return Response({"results": mealdb.get_featured(count)})


class RandomView(PublicRecipeView):
    def get(self, request):
        recipe = mealdb.get_random()
        if not recipe:
            return Response({"error": "No encontramos una receta."}, status=404)
        return Response({"recipe": recipe})


class CategoriesView(PublicRecipeView):
    def get(self, request):
        return Response({"categories": mealdb.get_categories()})


class AreasView(PublicRecipeView):
    def get(self, request):
        return Response({"areas": mealdb.get_areas()})


class RecipeDetailView(PublicRecipeView):
    def get(self, request, recipe_id):
        if not ID_RE.match(recipe_id):
            return bad_request("Identificador de receta no válido.")
        recipe = mealdb.get_by_id(recipe_id)
        if not recipe:
            return Response({"error": "Esa receta no existe."}, status=404)
        return Response({"recipe": recipe})
