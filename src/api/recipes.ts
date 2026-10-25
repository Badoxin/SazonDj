import { request } from "./http";

export type RecipeSummary = { id: string; name: string; image: string; category?: string; area?: string };

export type Recipe = RecipeSummary & {
  category: string;
  area: string;
  tags: string[];
  youtube: string | null;
  source: string | null;
  ingredients: { name: string; measure: string }[];
  steps: string[];
};

// Las recetas son públicas (Django consulta TheMealDB con la clave guardada en su .env).
const get = <T>(path: string, signal?: AbortSignal) => request<T>(`/api/v1/recipes/${path}`, { signal, auth: false });

export const api = {
  browse: (filters: { q?: string; category?: string; area?: string }, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    if (filters.area) params.set("area", filters.area);
    const query = params.toString();
    return get<{ results: RecipeSummary[] }>(query ? `?${query}` : "", signal).then((d) => d.results);
  },
  featured: (count: number, signal?: AbortSignal) => get<{ results: RecipeSummary[] }>(`featured/?count=${count}`, signal).then((d) => d.results),
  random: (signal?: AbortSignal) => get<{ recipe: RecipeSummary }>("random/", signal).then((d) => d.recipe),
  recipe: (id: string, signal?: AbortSignal) => get<{ recipe: Recipe }>(`${encodeURIComponent(id)}/`, signal).then((d) => d.recipe),
  categories: (signal?: AbortSignal) => get<{ categories: string[] }>("categories/", signal).then((d) => d.categories),
  areas: (signal?: AbortSignal) => get<{ areas: string[] }>("areas/", signal).then((d) => d.areas),
};
