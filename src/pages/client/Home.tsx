import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/recipes";
import { tArea, tCategory } from "../../i18n";
import useAsync from "../../useAsync";
import Icon from "../../components/Icon";
import RecipeCard from "../../components/RecipeCard";
import SectionHeading from "../../components/SectionHeading";
import { ErrorState, LoadingState } from "../../components/State";

// Categorías reales de TheMealDB (el valor es el nombre que entiende la API).
const featuredCategories: [string, string][] = [
  ["Breakfast", "☼"], ["Chicken", "◒"], ["Seafood", "☾"], ["Dessert", "◇"], ["Vegetarian", "❋"], ["Pasta", "↯"],
];

function DiscoverCard() {
  const navigate = useNavigate();
  const { data: meal, loading, error, reload } = useAsync((signal) => api.random(signal), []);

  return (
    <section className="discover-section">
      <div className="discover-copy">
        <p className="eyebrow light">DESDE THEMEALDB</p>
        <h2>Descubre algo nuevo</h2>
        <p>Deja que el mundo te inspire. Cada clic trae un nuevo sabor a tu mesa.</p>
        <button className="outline-light" onClick={reload}>Sorpréndeme <Icon name="arrow" /></button>
      </div>
      <div className="api-card">
        {loading ? <LoadingState text="Buscando un nuevo sabor…" />
          : error ? <ErrorState message="No pudimos conectar con la cocina." onRetry={reload} />
          : meal && (
            <>
              <img src={meal.image} alt={meal.name} />
              <div>
                <span>{[meal.category && tCategory(meal.category), meal.area && tArea(meal.area)].filter(Boolean).join(" · ")}</span>
                <h3>{meal.name}</h3>
                <button onClick={() => navigate(`/receta/${meal.id}`)}>Ver receta <Icon name="arrow" /></button>
              </div>
            </>
          )}
      </div>
    </section>
  );
}

export function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const featured = useAsync((signal) => api.featured(6, signal), []);

  const search = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/recetas?q=${encodeURIComponent(q)}` : "/recetas");
  };

  const suggested = featured.data?.[0];
  const recipes = featured.data ?? [];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">RECETAS PARA CADA MOMENTO</p>
          <h1>¿Qué se te antoja<br />cocinar <em>hoy?</em></h1>
          <p>Encuentra tu próxima receta favorita y comparte tu sazón.</p>
          <form className="hero-search" onSubmit={search}>
            <Icon name="search" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busca una receta: pollo, pasta, pastel…" aria-label="Buscar receta" maxLength={60} />
            <button>Buscar</button>
          </form>
          <button className="text-link" onClick={() => navigate("/recetas")}>Explorar todas las recetas <Icon name="arrow" /></button>
        </div>
        <div className="hero-visual">
          <img src="https://images.unsplash.com/photo-1706267701248-fbbeeb1f8c7c?auto=format&fit=crop&w=1600&q=90" alt="Mesa llena de platillos frescos para compartir" />
          {suggested && (
            <div className="floating-note">
              <span>RECETA SUGERIDA</span>
              <b>{suggested.name}</b>
              <button onClick={() => navigate(`/receta/${suggested.id}`)} aria-label={`Ver receta: ${suggested.name}`}><Icon name="arrow" /></button>
            </div>
          )}
        </div>
      </section>

      <section className="categories-section content-width">
        <SectionHeading eyebrow="PARA CADA ANTOJO" title="Explora por categoría" />
        <div className="category-grid">
          {featuredCategories.map(([name, symbol]) => (
            <button key={name} onClick={() => navigate(`/recetas?categoria=${name}`)}>
              <span>{symbol}</span>{tCategory(name)}<Icon name="chevron" size={16} />
            </button>
          ))}
        </div>
      </section>

      <section className="featured-section content-width">
        <SectionHeading eyebrow="PARA EMPEZAR" title="Recetas destacadas" action={<button className="text-link" onClick={() => navigate("/recetas")}>Ver todas <Icon name="arrow" /></button>} />
        <div className="recipe-grid">
          {featured.loading ? <LoadingState text="Preparando recetas…" />
            : featured.error ? <ErrorState message={featured.error} onRetry={featured.reload} />
            : recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      </section>

      <DiscoverCard />
    </>
  );
}
