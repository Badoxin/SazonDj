import routesAdmin from "./routes.admin";
import routesClient from "./routes.client";
import routesCommon from "./routes.common";

// El orden importa: la ruta "*" (404) tiene que ir al final.
export const routes = [...routesAdmin, ...routesClient, ...routesCommon];
