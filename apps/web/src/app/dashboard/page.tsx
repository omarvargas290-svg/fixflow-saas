"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { MetricCard } from "@/components/metric-card";
import { ModuleCard } from "@/components/module-card";
import { apiFetch, money } from "@/lib/api";

type Summary = {
  metrics: {
    customersCount: number;
    openOrders: number;
    lowStockItems: number;
    serviceRevenue: number;
    posRevenue: number;
  };
  pipeline: { status: string; total: number }[];
};

type ReportOverview = {
  daily: number;
  weekly: number;
  monthly: number;
};

const quickLinks = [
  {
    href: "/dashboard/ordenes",
    title: "Capturar orden",
    description: "Registra el equipo y deja ticket."
  },
  {
    href: "/dashboard/inventario",
    title: "Revisar inventario",
    description: "Detecta stock bajo."
  },
  {
    href: "/dashboard/reportes",
    title: "Ver reportes",
    description: "Consulta cierre y flujo."
  }
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [report, setReport] = useState<ReportOverview | null>(null);

  useEffect(() => {
    apiFetch<Summary>("/dashboard/summary").then(setSummary).catch(console.error);
    apiFetch<ReportOverview>("/reports/overview").then(setReport).catch(console.error);
  }, []);

  return (
    <DashboardShell
      title="Dashboard operativo"
      description="Vista central para ordenes, ventas, inventario y control diario."
      moduleTheme={{
        code: "RS",
        label: "Resumen",
        soft: "rgba(20, 92, 255, 0.12)",
        solid: "#145cff",
        glow: "#60a5fa"
      }}
    >
      <section className="overview-hero">
        <div className="overview-copy">
          <span className="eyebrow">Vista general</span>
          <h3>Control rapido del taller en una sola vista.</h3>
          <p>Ordenes activas, ingresos y stock critico sin navegar de mas.</p>
        </div>

        <div className="quick-links-grid">
          {quickLinks.map((item) => (
            <Link className="insight-card" href={item.href} key={item.href}>
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard
          label="Ordenes abiertas"
          value={String(summary?.metrics.openOrders ?? 0)}
          hint="Equipos activos en diagnostico, reparacion o entrega."
          icon="OS"
        />
        <MetricCard
          label="Clientes"
          value={String(summary?.metrics.customersCount ?? 0)}
          hint="Base de clientes del tenant actual."
          icon="CL"
        />
        <MetricCard
          label="Ingresos servicio"
          value={money(summary?.metrics.serviceRevenue ?? 0)}
          hint="Cobros acumulados por ordenes."
          icon="SV"
        />
        <MetricCard
          label="Ventas POS"
          value={money(summary?.metrics.posRevenue ?? 0)}
          hint="Mostrador y productos consumibles."
          icon="PV"
        />
        <MetricCard
          label="Stock bajo"
          value={String(summary?.metrics.lowStockItems ?? 0)}
          hint="Refacciones a vigilar o reabastecer."
          icon="ST"
        />
        <MetricCard
          label="Flujo mensual"
          value={money(report?.monthly ?? 0)}
          hint="Referencia rapida para cierres y seguimiento."
          icon="MX"
        />
      </div>

      <div className="split-grid">
        <section className="panel-card">
          <div className="panel-title-row">
            <div>
              <h3>Pipeline de reparacion</h3>
              <p>Estado actual del taller.</p>
            </div>
            <span className="header-chip">Operacion activa</span>
          </div>

          <div className="pipeline">
            {(summary?.pipeline ?? []).map((item) => (
              <div className="pipeline-row" key={item.status}>
                <div className="panel-title-row">
                  <strong>{item.status}</strong>
                  <span>{item.total}</span>
                </div>
                <div className="pipeline-track">
                  <div
                    className="pipeline-bar"
                    style={{ width: `${Math.min(item.total * 12, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card-grid">
          <ModuleCard
            title="Operacion de taller"
            description="Recepcion, seguimiento y entrega."
            icon="TL"
            bullets={[
              "Clientes y equipos",
              "Ordenes con folio automatico",
              "Anticipos y garantias"
            ]}
          />
          <ModuleCard
            title="Comercial y caja"
            description="Mostrador, caja y compras."
            icon="CJ"
            bullets={[
              "POS para refacciones",
              "Caja diaria",
              "Compras y proveedores"
            ]}
          />
        </section>
      </div>
    </DashboardShell>
  );
}
