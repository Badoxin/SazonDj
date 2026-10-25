import type { ComponentType, ReactNode } from "react";

export type AppRoute = {
  path: string;
  layout: ComponentType<{ children: ReactNode }>;
  component: ComponentType;
};
