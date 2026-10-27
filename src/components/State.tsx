// Estados reutilizables para cuando una petición está cargando o falló.
export function LoadingState({ text = "Cargando…" }: { text?: string }) {
  return <div className="api-state" role="status"><span className="spinner" /><b>{text}</b></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="api-state" role="alert">
      <b>{message}</b>
      {onRetry && <button className="pill-button small" onClick={onRetry}>Intentar de nuevo</button>}
    </div>
  );
}
