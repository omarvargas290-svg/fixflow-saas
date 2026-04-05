import { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  toolbar?: ReactNode;
  children: ReactNode;
};

export function DataTableCard({ title, description, toolbar, children }: Props) {
  return (
    <section className="panel-card">
      <div className="panel-title-row card-shell-header">
        <div className="card-shell-copy">
          <span className="panel-kicker">Gestion</span>
          <h3>{title}</h3>
          {description ? <p className="card-shell-description">{description}</p> : null}
        </div>
        {toolbar ? <div className="card-toolbar">{toolbar}</div> : null}
      </div>
      {children}
    </section>
  );
}
