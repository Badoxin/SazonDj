import { ClientLayout } from "../layouts";
import { Detail, Explore, Home, Profile } from "../pages/client";
import type { AppRoute } from "./types";

const routesClient: AppRoute[] = [
  { path: "/", layout: ClientLayout, component: Home },
  { path: "/home", layout: ClientLayout, component: Home },
  { path: "/recetas", layout: ClientLayout, component: Explore },
  { path: "/receta/:id", layout: ClientLayout, component: Detail },
  { path: "/perfil", layout: ClientLayout, component: Profile },
];

export default routesClient;
