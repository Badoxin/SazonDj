import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, Icon, Loader, Message } from "semantic-ui-react";
import { useAuth } from "../hooks/useAuth";
import { Login } from "../pages/common";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { auth, logout } = useAuth();

  // Sin esto se ve un "flash" del login mientras se revisa si ya había una sesión abierta.
  if (auth === undefined) return <Loader active size="large" content="Cargando..." />;
  if (!auth) return <Login />;

  // El manual solo revisaba que hubiera sesión: cualquier usuario podía ver el panel.
  // Ahora también se exige ser administrador (el servidor lo vuelve a comprobar en cada petición).
  if (!auth.me.is_staff) {
    return (
      <div className="admin-forbidden">
        <Message negative icon>
          <Icon name="ban" />
          <Message.Content>
            <Message.Header>No tienes permisos para ver esta página</Message.Header>
            <p>Esta sección es solo para administradores.</p>
            <Button as={Link} to="/" content="Volver al inicio" />
          </Message.Content>
        </Message>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <header className="admin-layout__bar">
        <h2>
          SAZÓN <span>Panel de administración</span>
        </h2>
        <nav>
          <Link to="/">Ver sitio</Link>
          <Link to="/dashboard">Usuarios</Link>
          <button onClick={logout}>Cerrar sesión ({auth.me.username})</button>
        </nav>
      </header>
      <main className="admin-layout__content">{children}</main>
    </div>
  );
}
