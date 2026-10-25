import { getToken } from "./token";

// La URL del backend sale del .env del frontend (VITE_BASE_API_URL).
export const API_URL = (import.meta.env.VITE_BASE_API_URL as string | undefined) ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>; // errores por campo, por ejemplo { email: "Ya existe un usuario con este correo." }
  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

// Cuando el servidor responde 401 con una sesión abierta (token vencido), el AuthProvider cierra la sesión.
let unauthorizedHandler: (() => void) | null = null;
export const onUnauthorized = (handler: (() => void) | null) => { unauthorizedHandler = handler; };

// Django REST Framework responde de varias formas: {detail}, {campo: ["error"]} o nuestro {error}.
function readError(body: unknown): { message: string; fields?: Record<string, string> } {
  const fallback = "Algo salió mal. Intenta de nuevo.";
  if (!body || typeof body !== "object") return { message: fallback };
  const data = body as Record<string, unknown>;
  if (typeof data.error === "string") return { message: data.error };
  if (typeof data.detail === "string") return { message: data.detail };

  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string") fields[key] = first;
  }
  const messages = Object.values(fields);
  return messages.length ? { message: messages[0], fields } : { message: fallback };
}

type Options = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  token?: string | null; // token explícito (por ejemplo, justo después de iniciar sesión)
  auth?: boolean;        // false = endpoint público: no se manda el token
};

export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const token = options.auth === false ? null : options.token ?? getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (err) {
    if (options.signal?.aborted) throw err;
    throw new ApiError(0, "No pudimos conectar con el servidor. Revisa que el backend esté encendido.");
  }

  if (res.status === 401 && token) unauthorizedHandler?.();
  if (!res.ok) {
    const { message, fields } = readError(await res.json().catch(() => null));
    throw new ApiError(res.status, message, fields);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
