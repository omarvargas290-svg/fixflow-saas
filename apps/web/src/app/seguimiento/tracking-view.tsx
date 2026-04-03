"use client";

import { useEffect, useMemo, useState } from "react";
import { dateText, publicFetch } from "@/lib/api";

type TrackingResponse = {
  order: {
    folio: string;
    status: string;
    priority?: string | null;
    failureReport: string;
    diagnosis?: string | null;
    promisedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    customer: { fullName: string };
    device: {
      category?: string | null;
      brand: string;
      model: string;
      accessories?: string | null;
      issueSummary?: string | null;
    };
    assignedUser?: { name: string } | null;
    tenant: {
      name: string;
      supportEmail?: string | null;
      ticketHeader?: string | null;
    };
  };
};

const statusLabelMap: Record<string, string> = {
  RECEIVED: "Recibido",
  DIAGNOSIS: "Diagnostico",
  QUOTE_PENDING: "Pendiente de autorizacion",
  APPROVED: "Autorizado",
  IN_REPAIR: "En reparacion",
  READY_DELIVERY: "Listo para entrega",
  DELIVERED: "Entregado",
  CANCELED: "Cancelado"
};

function statusTone(status: string) {
  if (status === "READY_DELIVERY" || status === "DELIVERED") return "success";
  if (status === "QUOTE_PENDING") return "warning";
  if (status === "IN_REPAIR" || status === "DIAGNOSIS" || status === "APPROVED") return "info";
  return "danger";
}

function statusProgress(status: string) {
  const ordered = [
    "RECEIVED",
    "DIAGNOSIS",
    "QUOTE_PENDING",
    "APPROVED",
    "IN_REPAIR",
    "READY_DELIVERY",
    "DELIVERED"
  ];
  const index = ordered.indexOf(status);
  if (index < 0) return 10;
  return Math.round(((index + 1) / ordered.length) * 100);
}

export function TrackingView({ token }: { token: string }) {
  const [data, setData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTracking() {
      if (!token) {
        setError("La liga de seguimiento no incluye un token valido.");
        setLoading(false);
        return;
      }

      try {
        const response = await publicFetch<TrackingResponse>(
          `/public/track?token=${encodeURIComponent(token)}`
        );

        if (!active) return;
        setData(response);
        setError("");
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo consultar el estado de la reparacion."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTracking();

    return () => {
      active = false;
    };
  }, [token]);

  const order = data?.order ?? null;
  const progress = useMemo(() => statusProgress(order?.status || ""), [order?.status]);

  return (
    <div className="tracking-shell">
      <div className="tracking-grid">
        <section className="hero-card tracking-hero">
          <div>
            <span className="eyebrow">{order?.tenant.name || "Seguimiento en linea"}</span>
            <h1>Revisa el avance de tu reparacion en tiempo real.</h1>
            <p>
              Comparte esta pantalla con el cliente para consultar folio, estado, fecha promesa y
              datos del equipo sin entrar al panel interno.
            </p>
          </div>

          <div className="hero-grid">
            <div className="hero-chip">
              <strong>Folio</strong>
              <span>{order?.folio || "Pendiente"}</span>
            </div>
            <div className="hero-chip">
              <strong>Estado actual</strong>
              <span>{order ? statusLabelMap[order.status] || order.status : "Sin dato"}</span>
            </div>
            <div className="hero-chip">
              <strong>Fecha promesa</strong>
              <span>{dateText(order?.promisedAt)}</span>
            </div>
            <div className="hero-chip">
              <strong>Tecnico</strong>
              <span>{order?.assignedUser?.name || "Asignacion pendiente"}</span>
            </div>
          </div>
        </section>

        <section className="login-card tracking-card">
          <span className="eyebrow">Seguimiento de servicio</span>
          <h2>Estado de reparacion</h2>
          <p>Consulta aqui el progreso general del equipo y la informacion mas importante.</p>

          {loading ? (
            <div className="empty-state">
              <strong>Cargando seguimiento...</strong>
              <p>Estamos consultando el estado mas reciente de la orden.</p>
            </div>
          ) : error ? (
            <div className="empty-state tracking-error">
              <strong>No pudimos abrir la liga</strong>
              <p>{error}</p>
            </div>
          ) : order ? (
            <div className="tracking-stack">
              <div className="tracking-progress-card">
                <div className="tracking-progress-top">
                  <strong>{statusLabelMap[order.status] || order.status}</strong>
                  <span className={`badge ${statusTone(order.status)}`}>
                    {order.priority ? `Prioridad ${order.priority}` : "Seguimiento activo"}
                  </span>
                </div>
                <div className="tracking-progress-track">
                  <div className="tracking-progress-bar" style={{ width: `${progress}%` }} />
                </div>
                <p>
                  Ultima actualizacion: <strong>{dateText(order.updatedAt)}</strong>
                </p>
              </div>

              <div className="detail-grid">
                <div className="detail-block">
                  <span>Cliente</span>
                  <strong>{order.customer.fullName}</strong>
                  <p>{order.tenant.ticketHeader || "Gracias por confiar en nuestro taller."}</p>
                </div>
                <div className="detail-block">
                  <span>Equipo</span>
                  <strong>
                    {order.device.category || "Equipo"} · {order.device.brand} {order.device.model}
                  </strong>
                  <p>{order.device.accessories || "Sin accesorios registrados"}</p>
                </div>
                <div className="detail-block">
                  <span>Recepcion</span>
                  <strong>{dateText(order.createdAt)}</strong>
                  <p>Fecha promesa: {dateText(order.promisedAt)}</p>
                </div>
                <div className="detail-block">
                  <span>Tecnico asignado</span>
                  <strong>{order.assignedUser?.name || "Pendiente de asignacion"}</strong>
                  <p>{order.tenant.supportEmail || "Sin correo de soporte configurado"}</p>
                </div>
              </div>

              <div className="detail-block">
                <span>Falla reportada</span>
                <strong>{order.failureReport}</strong>
                <p>{order.device.issueSummary || "Sin notas tecnicas iniciales registradas."}</p>
                {order.diagnosis ? <p>Diagnostico: {order.diagnosis}</p> : null}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
