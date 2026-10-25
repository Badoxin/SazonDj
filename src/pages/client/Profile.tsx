import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Icon from "../../components/Icon";
import { LoadingState } from "../../components/State";

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function Profile() {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();

  if (auth === undefined) return <main className="profile-page"><div className="content-width" style={{ paddingTop: 120 }}><LoadingState text="Cargando tu perfil…" /></div></main>;
  if (!auth) return <Navigate to="/login" replace />; // el perfil es privado

  const { me } = auth;
  const fullName = [me.first_name, me.last_name].filter(Boolean).join(" ") || me.username;
  const since = new Date(me.date_joined).toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  // Primero se navega al inicio y luego se cierra la sesión: esta página es privada y, si fuera al revés,
  // detectaría que ya no hay usuario y mandaría al login en lugar de ir al inicio.
  const signOut = () => { navigate("/"); logout(); };

  return (
    <main className="profile-page">
      <section className="profile-hero content-width">
        <span className="profile-avatar" aria-hidden="true">{initials(fullName)}</span>
        <div className="profile-info">
          <p className="eyebrow">MI PERFIL</p>
          <h1>{fullName}</h1>
          <p>@{me.username} · {me.email}</p>
          <p>{me.is_staff ? "Administrador" : "Cliente"} · Miembro desde {since}</p>
          {me.is_staff && <p><Link className="text-link" to="/dashboard">Ir al panel de administración</Link></p>}
        </div>
        <button className="logout-button" onClick={signOut}><Icon name="logout" size={17} />Cerrar sesión</button>
      </section>
    </main>
  );
}
