import { CommonLayout } from "../layouts";
import { Error404, Login, Register } from "../pages/common";
import type { AppRoute } from "./types";

const routesCommon: AppRoute[] = [
  { path: "/login", layout: CommonLayout, component: Login },
  { path: "/register", layout: CommonLayout, component: Register },
  { path: "*", layout: CommonLayout, component: Error404 },
];

export default routesCommon;
