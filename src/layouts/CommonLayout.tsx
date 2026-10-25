import { ReactNode } from "react";

// Pantallas sin encabezado: login, registro y error 404.
export function CommonLayout({ children }: { children: ReactNode }) {
  return <div className="common-layout">{children}</div>;
}
