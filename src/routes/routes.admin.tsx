import { AdminLayout } from "../layouts";
import { Dashboard } from "../pages/admin";
import type { AppRoute } from "./types";

const routesAdmin: AppRoute[] = [
  {
    path: "/dashboard",
    layout: AdminLayout,
    component: Dashboard,
  },
];

export default routesAdmin;
