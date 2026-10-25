import { ApiError, request } from "./http";

// Datos personales (el servidor NUNCA manda la contraseña ni su hash).
export type Me = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  date_joined: string;
};

export type UserRecord = Me & { is_active: boolean };

export type RegisterData = { username: string; email: string; password: string; password_confirm: string };

export async function loginApi(formData: { email: string; password: string }) {
  try {
    return await request<{ access: string; refresh: string }>("/api/v1/auth/token/", { method: "POST", body: formData, auth: false });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw new ApiError(401, "Correo o contraseña incorrectos");
    if (error instanceof ApiError && error.status === 429) throw new ApiError(429, "Demasiados intentos. Espera un momento e inténtalo de nuevo.");
    throw error;
  }
}

export function registerApi(formData: RegisterData) {
  return request<{ message: string; user: { username: string; email: string } }>("/api/v1/auth/register/", {
    method: "POST",
    body: formData,
    auth: false,
  });
}

export function getMeApi(token?: string) {
  return request<Me>("/api/v1/auth/me/", { token });
}

// ---- Administración de usuarios (solo para administradores) ----
export const getUsersApi = () => request<UserRecord[]>("/api/v1/users/");

export const createUserApi = (data: { username: string; email: string; password: string; first_name?: string; last_name?: string; is_staff?: boolean }) =>
  request<UserRecord>("/api/v1/users/", { method: "POST", body: data });

// PATCH: solo se mandan los campos que cambian (si no viene password, la contraseña no se toca).
export const updateUserApi = (id: number, data: Partial<Pick<UserRecord, "first_name" | "last_name" | "is_active" | "is_staff">>) =>
  request<UserRecord>(`/api/v1/users/${id}/`, { method: "PATCH", body: data });

export const deleteUserApi = (id: number) => request<void>(`/api/v1/users/${id}/`, { method: "DELETE" });
