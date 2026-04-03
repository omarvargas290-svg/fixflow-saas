"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { DataTableCard } from "@/components/data-table-card";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { apiFetch, dateText } from "@/lib/api";

type Warranty = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  terms?: string | null;
  device: {
    brand: string;
    model: string;
    imei?: string | null;
    serialNumber?: string | null;
  };
  serviceOrder: {
    folio: string;
    status: string;
    customer: {
      fullName: string;
      phone: string;
    };
    assignedUser?: {
      id: string;
      name: string;
      email: string;
    } | null;
  };
};

const warrantyStatusLabels: Record<string, string> = {
  ACTIVE: "Activa",
  CLAIMED: "Reclamada",
  EXPIRED: "Vencida",
  VOID: "Anulada"
};

function warrantyTone(status: string) {
  if (status === "ACTIVE") return "success";
  if (status === "CLAIMED") return "info";
  return "danger";
}

function daysUntil(value: string) {
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedWarrantyId, setSelectedWarrantyId] = useState("");

  useEffect(() => {
    apiFetch<Warranty[]>("/warranties").then(setWarranties).catch(console.error);
  }, []);

  const filteredWarranties = warranties.filter((warranty) => {
    const matchesStatus = statusFilter ? warranty.status === statusFilter : true;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      warranty.serviceOrder.folio.toLowerCase().includes(term) ||
      warranty.serviceOrder.customer.fullName.toLowerCase().includes(term) ||
      warranty.serviceOrder.customer.phone.toLowerCase().includes(term) ||
      warranty.device.brand.toLowerCase().includes(term) ||
      warranty.device.model.toLowerCase().includes(term) ||
      (warranty.device.imei || "").toLowerCase().includes(term) ||
      (warranty.device.serialNumber || "").toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    if (!filteredWarranties.length) {
      setSelectedWarrantyId("");
      return;
    }

    if (
      !selectedWarrantyId ||
      !filteredWarranties.some((warranty) => warranty.id === selectedWarrantyId)
    ) {
      setSelectedWarrantyId(filteredWarranties[0].id);
    }
  }, [filteredWarranties, selectedWarrantyId]);

  const selectedWarranty =
    filteredWarranties.find((warranty) => warranty.id === selectedWarrantyId) ?? null;
  const activeCount = filteredWarranties.filter((warranty) => warranty.status === "ACTIVE").length;
  const claimedCount = filteredWarranties.filter((warranty) => warranty.status === "CLAIMED").length;
  const expiredCount = filteredWarranties.filter((warranty) => warranty.status === "EXPIRED").length;
  const expiringSoonCount = filteredWarranties.filter((warranty) => {
    const remaining = daysUntil(warranty.endsAt);
    return remaining !== null && remaining >= 0 && remaining <= 7;
  }).length;
  const remainingDays = selectedWarranty ? daysUntil(selectedWarranty.endsAt) : null;

  return (
    <DashboardShell
      title="Garantias"
      description="Control de vigencias, reclamaciones y referencia directa a la orden atendida."
      moduleTheme={{
        code: "GT",
        label: "Garantias",
        soft: "rgba(34, 197, 94, 0.12)",
        solid: "#16a34a",
        glow: "#4ade80"
      }}
    >
      <div className="metric-grid">
        <MetricCard
          label="Activas"
          value={String(activeCount)}
          hint="Equipos actualmente cubiertos."
          icon="AC"
        />
        <MetricCard
          label="Por vencer"
          value={String(expiringSoonCount)}
          hint="Vencen dentro de los proximos 7 dias."
          icon="PV"
        />
        <MetricCard
          label="Reclamadas"
          value={String(claimedCount)}
          hint="Casos que ya hicieron uso de la garantia."
          icon="RC"
        />
        <MetricCard
          label="Vencidas"
          value={String(expiredCount)}
          hint="Garantias fuera de vigencia."
          icon="VN"
        />
      </div>

      <div className="split-grid balanced">
        <DataTableCard
          title="Garantias registradas"
          description="Busca por orden, cliente, telefono o identificador del equipo."
          toolbar={
            <div className="toolbar">
              <input
                placeholder="Folio, cliente, IMEI..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Todos los estados</option>
                <option value="ACTIVE">Activas</option>
                <option value="CLAIMED">Reclamadas</option>
                <option value="EXPIRED">Vencidas</option>
                <option value="VOID">Anuladas</option>
              </select>
            </div>
          }
        >
          {filteredWarranties.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>Cliente</th>
                    <th>Equipo</th>
                    <th>Estado</th>
                    <th>Vigencia</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWarranties.map((warranty) => (
                    <tr
                      className={`row-selectable ${selectedWarranty?.id === warranty.id ? "active" : ""}`}
                      key={warranty.id}
                      onClick={() => setSelectedWarrantyId(warranty.id)}
                    >
                      <td>{warranty.serviceOrder.folio}</td>
                      <td>
                        <strong>{warranty.serviceOrder.customer.fullName}</strong>
                        <br />
                        <span>{warranty.serviceOrder.customer.phone}</span>
                      </td>
                      <td>
                        <strong>
                          {warranty.device.brand} {warranty.device.model}
                        </strong>
                        <br />
                        <span>{warranty.device.imei || warranty.device.serialNumber || "Sin identificador"}</span>
                      </td>
                      <td>
                        <span className={`badge ${warrantyTone(warranty.status)}`}>
                          {warrantyStatusLabels[warranty.status] || warranty.status}
                        </span>
                      </td>
                      <td>{dateText(warranty.endsAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Sin garantias registradas"
              description="Apareceran aqui cuando una orden genere una cobertura activa."
            />
          )}
        </DataTableCard>

        <DataTableCard
          title="Ficha de garantia"
          description="Consulta rapida de vigencia, cliente, orden y terminos de cobertura."
        >
          {selectedWarranty ? (
            <div className="order-detail-stack">
              <div className="detail-hero">
                <div className="detail-hero-top">
                  <div>
                    <strong>{selectedWarranty.serviceOrder.folio}</strong>
                    <p>
                      {selectedWarranty.device.brand} {selectedWarranty.device.model}
                    </p>
                  </div>
                  <div className="detail-meta-row">
                    <span className={`badge ${warrantyTone(selectedWarranty.status)}`}>
                      {warrantyStatusLabels[selectedWarranty.status] || selectedWarranty.status}
                    </span>
                    <span className="header-chip">
                      {remainingDays === null
                        ? "Sin vigencia"
                        : remainingDays >= 0
                          ? `${remainingDays} dias restantes`
                          : `${Math.abs(remainingDays)} dias vencida`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-block">
                  <span>Cliente</span>
                  <strong>{selectedWarranty.serviceOrder.customer.fullName}</strong>
                  <p>{selectedWarranty.serviceOrder.customer.phone}</p>
                </div>
                <div className="detail-block">
                  <span>Tecnico</span>
                  <strong>{selectedWarranty.serviceOrder.assignedUser?.name || "Sin tecnico asignado"}</strong>
                  <p>Responsable asociado a la orden original.</p>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-block">
                  <span>Inicio</span>
                  <strong>{dateText(selectedWarranty.startsAt)}</strong>
                  <p>Fecha en que inicio la cobertura.</p>
                </div>
                <div className="detail-block">
                  <span>Vence</span>
                  <strong>{dateText(selectedWarranty.endsAt)}</strong>
                  <p>Fecha limite para reclamacion.</p>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-block">
                  <span>Equipo</span>
                  <strong>
                    {selectedWarranty.device.brand} {selectedWarranty.device.model}
                  </strong>
                  <p>{selectedWarranty.device.imei || selectedWarranty.device.serialNumber || "Sin identificador"}</p>
                </div>
                <div className="detail-block">
                  <span>Estado de la orden</span>
                  <strong>{selectedWarranty.serviceOrder.status}</strong>
                  <p>Referencia del flujo original de servicio.</p>
                </div>
              </div>

              <div className="detail-grid single">
                <div className="detail-block">
                  <span>Terminos</span>
                  <strong>{selectedWarranty.terms || "Sin terminos registrados"}</strong>
                  <p>Condiciones de cobertura, exclusiones o notas de seguimiento.</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Selecciona una garantia"
              description="Elige una fila para ver el detalle de cobertura y vigencia."
            />
          )}
        </DataTableCard>
      </div>
    </DashboardShell>
  );
}
