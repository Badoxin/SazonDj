// El token JWT se guarda en localStorage con el nombre definido en el .env (como pide el manual).
const TOKEN = (import.meta.env.VITE_LOCAL_STORAGE_ITEM_NAME as string | undefined) ?? "sazon_token";

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN, token);
}

export function getToken() {
  return window.localStorage.getItem(TOKEN);
}

export function removeToken() {
  window.localStorage.removeItem(TOKEN);
}
