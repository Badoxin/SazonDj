import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Al cambiar de página, regresa al inicio de la pantalla.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return null;
}
