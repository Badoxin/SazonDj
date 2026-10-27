import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer>
      <div className="footer-brand"><Logo onClick={() => navigate("/")} /><p>Recetas para disfrutar y compartir.</p></div>
      <div className="footer-links">
        <button onClick={() => navigate("/")}>Inicio</button>
        <button onClick={() => navigate("/recetas")}>Recetas</button>
      </div>
      <p className="copyright">© {new Date().getFullYear()} SAZÓN. Recetas por TheMealDB.</p>
    </footer>
  );
}
