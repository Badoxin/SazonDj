import { Link } from "react-router-dom";
import { Button } from "semantic-ui-react";

export function Error404() {
  return (
    <div className="auth-page">
      <div className="auth-page__content error-404">
        <h1>404</h1>
        <p className="auth-page__subtitle">Esta página no existe o ya no está disponible.</p>
        <Button as={Link} to="/" primary fluid content="Ir al inicio" />
      </div>
    </div>
  );
}
