"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { DataTableCard } from "@/components/data-table-card";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { apiFetch, dateText } from "@/lib/api";

type DeviceOrder = {
  id: string;
  folio: string;
  status: string;
  failureReport: string;
  diagnosis?: string | null;
  createdAt?: string | null;
  promisedAt?: string | null;
  customer: {
    fullName: string;
    phone: string;
    email?: string | null;
  };
  device: {
    category: string;
    brand: string;
    model: string;
    imei?: string | null;
    serialNumber?: string | null;
    accessories?: string | null;
    issueSummary?: string | null;
  };
  assignedUser?: { id: string; name: string } | null;
};

const statusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "RECEIVED", label: "Recibido" },
  { value: "DIAGNOSIS", label: "Diagnostico" },
  { value: "QUOTE_PENDING", label: "Pendiente autorizacion" },
  { value: "APPROVED", label: "Autorizado" },
  { value: "IN_REPAIR", label: "En reparacion" },
  { value: "READY_DELIVERY", label: "Listo para entrega" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELED", label: "Cancelado" }
];

const statusLabels: Record<string, string> = {
  RECEIVED: "Recibido",
  DIAGNOSIS: "Diagnostico",
  QUOTE_PENDING: "Pendiente autorizacion",
  APPROVED: "Autorizado",
  IN_REPAIR: "En reparacion",
  READY_DELIVERY: "Listo para entrega",
  DELIVERED: "Entregado",
  CANCELED: "Cancelado"
};

function statusTone(status: string) {
  if (status === "READY_DELIVERY" || status === "DELIVERED") return "success";
  if (status === "QUOTE_PENDING") return "warning";
  if (status === "CANCELED") return "danger";
  return "info";
}

export default function DevicesPage() {
  const [orders, setOrders] = useState<DeviceOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");

  async function loadOrders(term = "", status = "") {
    const params = new URLSearchParams();
    if (term) params.set("search", term);
    if (status) params.set("status", status);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiFetch<DeviceOrder[]>(`/service-orders${query}`);
    setOrders(data);
  }

  useEffect(() => {
    loadOrders(search, statusFilter).catch(console.error);
  }, [search, statusFilter]);

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId("");
      return;
    }

    if (!selectedOrderId || !orders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;
  const identifiedDevices = orders.filter(
    (order) => order.device.imei || order.device.serialNumber
  ).length;
  const activeDevices = orders.filter(
    (order) => !["DELIVERED", "CANCELED"].includes(order.status)
  ).length;
  const recentDevices = orders.filter((order) => {
    const created = order.createdAt ? new Date(order.createdAt).getTime() : Number.NaN;
    if (Number.isNaN(created)) return false;
    return Date.now() - created <= 1000 * 60 * 60 * 24 * 30;
  }).length;
  const laptopDevices = orders.filter((order) =>
    order.device.category.toLowerCase().includes("laptop")
  ).length;

  return (
    <DashboardShell
      title="Equipos recibidos"
      description="Historial operativo por dispositivo, IMEI, serie y trazabilidad de orden."
      moduleTheme={{
        code: "EQ",
        label: "Equipos",
        soft: "rgba(6, 182, 212, 0.12)",
        solid: "#0891b2",
        glow: "#22d3ee"
      }}
    >
      <div className="metric-grid">
        <MetricCard
          label="Equipos visibles"
          value={String(orders.length)}
          hint="Resultados del filtro actual."
          icon="EQ"
        />
        <MetricCard
          label="En taller"
          value={String(activeDevices)}
          hint="Equipos que siguen dentro del flujo tecnico."
          icon="TL"
        />
        <MetricCard
          label="Con identificador"
          value={String(identifiedDevices)}
          hint="IMEI o numero de serie capturado."
          icon="ID"
        />
        <MetricCard
          label="Ingresos recientes"
          value={String(recentDevices)}
          hint="Equipos recibidos en los ultimos 30 dias."
          icon="RC"
        />
      </div>

      <div className="split-grid balanced">
        <DataTableCard
          title="Bitacora de equipos"
          description="Busca por folio, cliente, IMEI, serie o estado de reparacion."
          toolbar={
            <div className="toolbar">
              <input
                placeholder="Folio, cliente, IMEI..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {statusOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          {orders.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Equipo</th>
                    <th>Cliente</th>
                    <th>Identificador</th>
                    <th>Estado</th>
                    <th>Recepcion</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      className={`row-selectable ${selectedOrder?.id === order.id ? "active" : ""}`}
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <td>{order.folio}</td>
                      <td>
                        <strong>
                          {order.device.brand} {order.device.model}
                        </strong>
                        <br />
                        <span>{order.device.category}</span>
                      </td>
                      <td>
                        <strong>{order.customer.fullName}</strong>
                        <br />
                        <span>{order.customer.phone}</span>
                      </td>
                      <td>{order.device.imei || order.device.serialNumber || "Sin dato"}</td>
                      <td>
                        <span className={`badge ${statusTone(order.status)}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td>{dateText(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Sin equipos registrados"
              description="Cuando captures ordenes, aqui se concentrara la trazabilidad por dispositivo."
            />
          )}
        </DataTableCard>

        <DataTableCard
          title="Ficha del equipo"
          description="Detalle operativo para recepcion, seguimiento y entrega."
        >
          {selectedOrder ? (
            <div className="order-detail-stack">
              <div className="detail-hero">
                <div className="detail-hero-top">
                  <div>
                    <strong>
                      {selectedOrder.device.brand} {selectedOrder.device.model}
                    </strong>
                    <p>{selectedOrder.device.category}</p>
                  </div>
                  <div className="detail-meta-row">
                    <span className="header-chip">{selectedOrder.folio}</span>
                    <span className={`badge ${statusTone(selectedOrder.status)}`}>
                      {statusLabels[selectedOrder.status] || selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-block">
                  <span>Cliente</span>
                  <strong>{selectedOrder.customer.fullName}</strong>
                  <p>{selectedOrder.customer.phone}</p>
                </div>
                <div className="detail-block">
                  <span>Tecnico asignado</span>
                  <strong>{selectedOrder.assignedUser?.name || "Sin asignar"}</strong>
                  <p>Responsable actual de la orden.</p>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-block">
                  <span>IMEI / Serie</span>
                  <strong>{selectedOrder.device.imei || selectedOrder.device.serialNumber || "Sin capturar"}</strong>
                  <p>Dato clave para rastreo y entrega segura.</p>
                </div>
                <div className="detail-block">
                  <span>Promesa de entrega</span>
                  <strong>{dateText(selectedOrder.promisedAt)}</strong>
                  <p>Fecha comprometida con el cliente.</p>
                </div>
              </div>

              <div className="detail-grid single">
                <div className="detail-block">
                  <span>Falla reportada</span>
                  <strong>{selectedOrder.failureReport}</strong>
                  <p>{selectedOrder.device.issueSummary || "Sin resumen adicional del equipo."}</p>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-block">
                  <span>Accesorios recibidos</span>
                  <strong>{selectedOrder.device.accessories || "Sin accesorios"}</strong>
                  <p>Cargadores, fundas, chips u otros elementos entregados.</p>
                </div>
                <div className="detail-block">
                  <span>Diagnostico</span>
                  <strong>{selectedOrder.diagnosis || "Pendiente de diagnostico"}</strong>
                  <p>Observacion tecnica mas reciente del equipo.</p>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-block">
                  <span>Recepcion</span>
                  <strong>{dateText(selectedOrder.createdAt)}</strong>
                  <p>Alta inicial en el flujo del taller.</p>
                </div>
                <div className="detail-block">
                  <span>Laptops</span>
                  <strong>{String(laptopDevices)}</strong>
                  <p>Conteo rapido de laptops dentro del resultado actual.</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Selecciona un equipo"
              description="Elige una fila para ver su ficha operativa completa."
            />
          )}
        </DataTableCard>
      </div>
    </DashboardShell>
  );
}
