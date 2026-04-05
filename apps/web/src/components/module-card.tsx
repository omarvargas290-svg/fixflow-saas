type Props = {
  title: string;
  description: string;
  bullets: string[];
  icon?: string;
};

export function ModuleCard({ title, description, bullets, icon }: Props) {
  return (
    <article className="panel-card module-card">
      <div className="panel-title-row">
        <div className="module-title">
          {icon ? <span className="module-icon">{icon}</span> : null}
          <div className="module-title-copy">
            <span className="panel-kicker">Modulo</span>
            <h3>{title}</h3>
          </div>
        </div>
        <span className="module-outline">Activo</span>
      </div>
      <p>{description}</p>
      <ul className="compact-list">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </article>
  );
}
