import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/recipes";
import { tArea, tCategory } from "../../i18n";
import useAsync from "../../useAsync";
import Icon from "../../components/Icon";
import { ErrorState, LoadingState } from "../../components/State";

export function Detail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: recipe, loading, error, reload } = useAsync((signal) => api.recipe(id, signal), [id]);
  const [checked, setChecked] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* el navegador no permitió copiar */ }
  };

  if (loading) return <main className="detail-page"><div className="content-width" style={{ paddingTop: 120 }}><LoadingState text="Preparando la receta…" /></div></main>;
  if (error || !recipe) {
    return (
      <main className="detail-page">
        <div className="content-width" style={{ paddingTop: 120 }}>
          <ErrorState message={error ?? "No encontramos esa receta."} onRetry={reload} />
          <p style={{ textAlign: "center" }}><button className="text-link" onClick={() => navigate("/recetas")}>Ver todas las recetas</button></p>
        </div>
      </main>
    );
  }

  const toggle = (i: number) => setChecked(checked.includes(i) ? checked.filter((n) => n !== i) : [...checked, i]);

  return (
    <main className="detail-page">
      <section className="detail-hero">
        <p className="eyebrow">{[tCategory(recipe.category), tArea(recipe.area)].filter(Boolean).join(" · ")}</p>
        <h1>{recipe.name}</h1>
        <p>{recipe.ingredients.length} ingredientes · {recipe.steps.length} pasos</p>
        <div className="detail-actions">
          <button onClick={share}><Icon name={copied ? "check" : "share"} />{copied ? "Enlace copiado" : "Compartir"}</button>
          {recipe.youtube && <a href={recipe.youtube} target="_blank" rel="noopener noreferrer"><Icon name="video" />Ver video</a>}
        </div>
      </section>

      <div className="main-food-photo"><img src={recipe.image} alt={recipe.name} /></div>

      <div className="stat-bar">
        {[["list", "CATEGORÍA", tCategory(recipe.category) || "—"], ["pin", "ORIGEN", tArea(recipe.area) || "—"], ["check", "INGREDIENTES", String(recipe.ingredients.length)]].map(([icon, label, value]) => (
          <div key={label}><Icon name={icon} /><span>{label}<b>{value}</b></span></div>
        ))}
      </div>

      <section className="recipe-content content-width">
        <aside className="ingredients">
          <p className="eyebrow">TODO LO QUE NECESITAS</p>
          <h2>Ingredientes</h2>
          <p>Marca lo que ya tienes en casa.</p>
          <div>
            {recipe.ingredients.map((item, i) => (
              <label className={checked.includes(i) ? "checked" : ""} key={`${item.name}-${i}`}>
                <input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)} />
                <span><Icon name="check" size={14} /></span>
                {[item.measure, item.name].filter(Boolean).join(" ")}
              </label>
            ))}
          </div>
        </aside>

        <article className="instructions">
          <h2>Preparación</h2>
          {recipe.steps.map((step, i) => (
            <div className="step" key={i}><span>{i + 1}</span><div><p>{step}</p></div></div>
          ))}
          {recipe.source && (
            <aside className="chef-tip">
              <b>Fuente original</b>
              <p><a href={recipe.source} target="_blank" rel="noopener noreferrer">Ver la receta en su sitio de origen</a></p>
            </aside>
          )}
        </article>
      </section>
    </main>
  );
}
