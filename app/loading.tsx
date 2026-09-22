export default function Loading() {
  return (
    <div className="utech-loading" role="status" aria-live="polite" aria-label="Loading">
      <div className="utech-loading-card">
        <div className="utech-loading-spinner" aria-hidden="true" />
        <div className="utech-loading-brand">UTECH</div>
        <div className="utech-loading-text">Loading...</div>
      </div>
    </div>
  );
}
