import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Icon from "./Icon";
import Logo from "./Logo";

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { auth } = useAuth();
  const me = auth?.me;
  const displayName = me ? [me.first_name, me.last_name].filter(Boolean).join(" ") || me.username : "";

  const go = (to: string) => { navigate(to); setOpen(false); };
  const isRecipes = pathname.startsWith("/recetas") || pathname.startsWith("/receta/");
  const isProfile = pathname.startsWith("/perfil");
  const link = (label: string, to: string, active: boolean) => (
    <button className={active ? "nav-link active" : "nav-link"} onClick={() => go(to)}>{label}</button>
  );

  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo onClick={() => go("/")} />

        <nav className="header-nav" aria-label="Navegación principal">
          {link("Inicio", "/", pathname === "/" || pathname === "/home")}
          {link("Recetas", "/recetas", isRecipes)}
          {me?.is_staff && link("Panel", "/dashboard", false)}
          {auth === undefined ? null : me ? (
            <button className={isProfile ? "profile-button active" : "profile-button"} onClick={() => go("/perfil")} aria-label="Mi perfil">
              <span className="avatar">{initials(displayName)}</span>Perfil
            </button>
          ) : (
            <>
              <button className="text-button" onClick={() => go("/login")}>Iniciar sesión</button>
              <button className="pill-button small" onClick={() => go("/register")}>Registrarse</button>
            </>
          )}
        </nav>

        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Abrir menú">
          <Icon name={open ? "close" : "menu"} size={22} />
        </button>
      </div>

      {open && (
        <div className="mobile-nav">
          {link("Inicio", "/", pathname === "/" || pathname === "/home")}
          {link("Recetas", "/recetas", isRecipes)}
          {me?.is_staff && link("Panel", "/dashboard", false)}
          {me ? (
            <button onClick={() => go("/perfil")}>Mi perfil (@{me.username})</button>
          ) : (
            <>
              <button onClick={() => go("/login")}>Iniciar sesión</button>
              <button onClick={() => go("/register")}>Registrarse</button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
