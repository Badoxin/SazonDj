import { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { RecipeSummary } from "../api/recipes";
import { tArea, tCategory } from "../i18n";
import Icon from "./Icon";

export default function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const navigate = useNavigate();
  const open = () => navigate(`/receta/${recipe.id}`);
  const onKey = (e: KeyboardEvent) => { if (e.target === e.currentTarget && e.key === "Enter") open(); };

  return (
    <article className="recipe-card" onClick={open} onKeyDown={onKey} role="link" tabIndex={0} aria-label={`Ver receta: ${recipe.name}`}>
      <div className="recipe-image-wrap">
        <img src={recipe.image} alt={recipe.name} loading="lazy" />
        {recipe.category && <span className="category-tag">{tCategory(recipe.category)}</span>}
      </div>
      <div className="recipe-card-body">
        <h3>{recipe.name}</h3>
        {recipe.area && <div className="recipe-meta"><span><Icon name="pin" size={15} />{tArea(recipe.area)}</span></div>}
      </div>
    </article>
  );
}
