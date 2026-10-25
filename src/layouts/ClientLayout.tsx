import { ReactNode } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";

// Sitio público de SAZÓN: encabezado + página + pie.
export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
