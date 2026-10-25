import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/recipes";
import { tArea, tCategory, toEnglishQuery } from "../../i18n";
import useAsync from "../../useAsync";
import Combobox from "../../components/Combobox";
import Icon from "../../components/Icon";
import RecipeCard from "../../components/RecipeCard";
import { ErrorState, LoadingState } from "../../components/State";

const byLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label, "es");

export function Explore() {
  // Los filtros viven en la URL: se pueden compartir y el botón "atrás" funciona.
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("categoria") ?? "";
  const area = params.get("pais") ?? "";

  const [text, setText] = useState(q);
  useEffect(() => { setText(q); }, [q]);

  const update = (key: string, value: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    }, { replace: true });

  // Espera a que la persona deje de escribir antes de buscar.
  useEffect(() => {
    const timer = setTimeout(() => { if (text.trim() !== q) update("q", text.trim()); }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const categories = useAsync((signal) => api.categories(signal), []);
  const areas = useAsync((signal) => api.areas(signal), []);
  const results = useAsync(
    (signal) => api.browse({ q: toEnglishQuery(q), category, area }, signal),
    [q, category, area]
  );

  const categoryOptions = useMemo(() => (categories.data ?? []).map((c) => ({ value: c, label: tCategory(c) })).sort(byLabel), [categories.data]);
  const areaOptions = useMemo(() => (areas.data ?? []).map((a) => ({ value: a, label: tArea(a) })).sort(byLabel), [areas.data]);

  const hasFilters = Boolean(q || category || area);
  const clear = () => { setText(""); setParams({}, { replace: true }); };

  return (
    <main className="explore-page">
      <section className="explore-hero">
        <p className="eyebrow">ENCUENTRA TU PRÓXIMO FAVORITO</p>
        <h1>¿Qué cocinamos hoy?</h1>
        <p>Busca por nombre y filtra por categoría o país de origen.</p>
      </section>

      <section className="filter-wrap content-width">
        <label className="wide-search">
          <Icon name="search" />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Busca una receta: pollo, pasta, pastel…" maxLength={60} />
          {text && (
            <button type="button" className="clear-x" aria-label="Borrar búsqueda" title="Borrar búsqueda" onClick={() => { setText(""); update("q", ""); }}>×</button>
          )}
        </label>
        <div className="filters">
          <Combobox label="Categoría" value={category} options={categoryOptions} allLabel="Todas" onChange={(v) => update("categoria", v)} />
          <Combobox label="País de origen" value={area} options={areaOptions} allLabel="Todos" onChange={(v) => update("pais", v)} />
        </div>
      </section>

      <section className="results content-width">
        {results.loading ? <LoadingState text="Buscando recetas…" />
          : results.error ? <ErrorState message={results.error} onRetry={results.reload} />
          : (
            <>
              <div className="results-row">
                <p><b>{results.data?.length ?? 0}</b> {hasFilters ? "recetas encontradas" : "recetas para empezar"}</p>
                {hasFilters && <button onClick={clear}>Limpiar filtros ×</button>}
              </div>
              {results.data?.length ? (
                <div className="recipe-grid">{results.data.map((r) => <RecipeCard key={r.id} recipe={r} />)}</div>
              ) : (
                <div className="empty-state">
                  <span>∅</span>
                  <h2>No encontramos recetas</h2>
                  <p>Prueba con otro nombre o elimina algunos filtros.</p>
                  <button className="pill-button" onClick={clear}>Limpiar filtros</button>
                </div>
              )}
            </>
          )}
      </section>
    </main>
  );
}
