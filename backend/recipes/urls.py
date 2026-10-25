from django.urls import path

from recipes import views

# Las rutas fijas van antes que <recipe_id> para que "featured" no se confunda con un id.
urlpatterns = [
    path("", views.RecipeListView.as_view(), name="recipe-list"),
    path("featured/", views.FeaturedView.as_view(), name="recipe-featured"),
    path("random/", views.RandomView.as_view(), name="recipe-random"),
    path("categories/", views.CategoriesView.as_view(), name="recipe-categories"),
    path("areas/", views.AreasView.as_view(), name="recipe-areas"),
    path("<str:recipe_id>/", views.RecipeDetailView.as_view(), name="recipe-detail"),
]
