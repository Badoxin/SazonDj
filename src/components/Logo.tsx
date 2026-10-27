export default function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button className="logo" onClick={onClick} aria-label="Ir al inicio">
      SAZÓN<span>Descubre, cocina y comparte</span>
    </button>
  );
}
