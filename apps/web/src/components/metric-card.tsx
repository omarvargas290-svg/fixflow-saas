type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: string;
};

export function MetricCard({ label, value, hint, icon }: Props) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <div className="metric-copy">
          <span className="metric-label">{label}</span>
          {hint ? <p className="metric-hint">{hint}</p> : null}
        </div>
        {icon ? <span className="metric-icon">{icon}</span> : null}
      </div>
      <strong>{value}</strong>
    </article>
  );
}
