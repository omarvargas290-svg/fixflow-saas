"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { saveSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "No fue posible iniciar sesion.");
      }

      saveSession(payload);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <div className="login-grid compact-login-grid">
        <section className="hero-card compact-hero-card">
          <div>
            <span className="eyebrow">FixFlow SaaS</span>
            <h1>Operacion y control del taller.</h1>
            <p>Ordenes, inventario, POS y seguimiento en una sola plataforma.</p>
          </div>

          <div className="hero-grid compact-hero-grid">
            <div className="hero-chip">
              <strong>Ordenes</strong>
              <span>Cliente, equipo y folio.</span>
            </div>
            <div className="hero-chip">
              <strong>Inventario</strong>
              <span>Stock y piezas usadas.</span>
            </div>
            <div className="hero-chip">
              <strong>POS</strong>
              <span>Ventas y corte diario.</span>
            </div>
          </div>
        </section>

        <section className="login-card">
          <span className="eyebrow">Acceso seguro</span>
          <h2>Inicia sesion</h2>
          <p>Accede al panel de control.</p>

          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Correo</label>
              <input
                id="email"
                type="email"
                placeholder="correo@negocio.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Contrasena</label>
              <input
                id="password"
                type="password"
                placeholder="Tu contrasena"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error ? <div className="danger-text">{error}</div> : null}

            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Entrando..." : "Entrar al panel"}
            </button>

            <Link className="secondary-button" href="/billing-admin">
              Backoffice de facturacion
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}
