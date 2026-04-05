"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CSSProperties, ReactNode, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AppSession, clearSession, getStoredSession } from "@/lib/session";

type ModuleTheme = {
  code: string;
  label: string;
  soft: string;
  solid: string;
  glow: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  note: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  moduleTheme?: ModuleTheme;
};

type TenantProfile = {
  name: string;
  plan?: string;
  subscriptionStatus?: string;
  brandProfile?: {
    companyName?: string | null;
    primaryColor?: string | null;
    accentColor?: string | null;
    supportEmail?: string | null;
  } | null;
  branches?: { id: string; name: string }[];
};

const navSections: NavSection[] = [
  {
    title: "Vision general",
    items: [
      { href: "/dashboard", label: "Resumen", icon: "RS", note: "KPI y flujo" }
    ]
  },
  {
    title: "Operacion",
    items: [
      {
        href: "/dashboard/clientes",
        label: "Clientes",
        icon: "CL",
        note: "Recepcion"
      },
      {
        href: "/dashboard/equipos",
        label: "Equipos",
        icon: "EQ",
        note: "Control tecnico"
      },
      {
        href: "/dashboard/ordenes",
        label: "Ordenes",
        icon: "OS",
        note: "Servicio y cobro"
      },
      {
        href: "/dashboard/inventario",
        label: "Inventario",
        icon: "IN",
        note: "Stock y costo"
      },
      {
        href: "/dashboard/garantias",
        label: "Garantias",
        icon: "GT",
        note: "Vigencias"
      }
    ]
  },
  {
    title: "Comercial",
    items: [
      {
        href: "/dashboard/pos",
        label: "POS",
        icon: "PV",
        note: "Mostrador"
      },
      {
        href: "/dashboard/compras",
        label: "Compras",
        icon: "CP",
        note: "Reabasto"
      },
      {
        href: "/dashboard/reportes",
        label: "Reportes",
        icon: "RP",
        note: "Analisis"
      }
    ]
  },
  {
    title: "Cuenta",
    items: [
      {
        href: "/dashboard/suscripcion",
        label: "Suscripcion",
        icon: "SB",
        note: "Plan y pagos"
      },
      {
        href: "/dashboard/admin",
        label: "Admin",
        icon: "AD",
        note: "Usuarios y marca"
      }
    ]
  }
];

const defaultModuleTheme: ModuleTheme = {
  code: "PN",
  label: "Panel",
  soft: "rgba(20, 92, 255, 0.1)",
  solid: "#145cff",
  glow: "#22c55e"
};

export function DashboardShell({
  title,
  description,
  children,
  moduleTheme = defaultModuleTheme
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AppSession | null>(null);
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const current = getStoredSession();
    if (!current) {
      router.replace("/login");
      return;
    }

    setSession(current);
  }, [router]);

  useEffect(() => {
    if (!session) return;
    apiFetch<TenantProfile>("/tenant/profile")
      .then(setTenantProfile)
      .catch(() => setTenantProfile(null));
  }, [session]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const roleText = useMemo(() => {
    if (!session) return "";

    const roleMap: Record<AppSession["user"]["role"], string> = {
      ADMIN: "Administrador",
      TECH: "Tecnico",
      CASHIER: "Cajero"
    };

    return roleMap[session.user.role];
  }, [session]);

  function isActiveNavItem(item: NavItem) {
    if (item.href === "/dashboard") return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  if (!session) {
    return <div className="screen-center">Cargando sesion...</div>;
  }

  const brandName =
    tenantProfile?.brandProfile?.companyName || tenantProfile?.name || session.user.tenant;
  const primaryColor = tenantProfile?.brandProfile?.primaryColor || "#145cff";
  const accentColor = tenantProfile?.brandProfile?.accentColor || "#22c55e";
  const branchCount = tenantProfile?.branches?.length || 1;
  return (
    <div
      className="dashboard-shell"
      style={
        {
          ["--primary" as string]: primaryColor,
          ["--accent" as string]: accentColor,
          ["--module-soft" as string]: moduleTheme.soft,
          ["--module-solid" as string]: moduleTheme.solid,
          ["--module-glow" as string]: moduleTheme.glow
        } as CSSProperties
      }
    >
      <button
        aria-hidden={!menuOpen}
        className={menuOpen ? "sidebar-overlay visible" : "sidebar-overlay"}
        onClick={() => setMenuOpen(false)}
        type="button"
      />

      <aside className={menuOpen ? "sidebar mobile-open" : "sidebar"}>
        <div className="brand-card">
          <span className="eyebrow">FixFlow SaaS</span>
          <h1>{brandName}</h1>
          <p>Operacion, ventas y control del taller desde un solo panel.</p>
          <div className="brand-summary-grid">
            <div className="subtle-box brand-summary-card">
              <strong>Plan {tenantProfile?.plan || "MVP"}</strong>
              <span>{tenantProfile?.subscriptionStatus || "TRIAL"}</span>
            </div>
            <div className="subtle-box brand-summary-card">
              <strong>{branchCount}</strong>
              <span>Sucursal(es)</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div className="sidebar-nav-group" key={section.title}>
              <span className="sidebar-section-label">{section.title}</span>
              <div className="sidebar-nav-list">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={isActiveNavItem(item) ? "nav-link active" : "nav-link"}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-link-copy">
                      <strong>{item.label}</strong>
                      <span>{item.note}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <strong>{session.user.name}</strong>
            <span>
              {roleText} - {session.user.branch}
            </span>
          </div>
          <button
            className="secondary-button full-width"
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="content-area">
        <div className="mobile-topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            {menuOpen ? "Cerrar" : "Menu"}
          </button>

          <div className="mobile-topbar-copy">
            <strong>{brandName}</strong>
            <span>
              {roleText} - {tenantProfile?.subscriptionStatus || "TRIAL"}
            </span>
          </div>
        </div>

        <header className="page-header module-header">
          <div className="module-header-badge">
            <span className="module-header-code">{moduleTheme.code}</span>
            <div className="module-header-copy">
              <strong>{moduleTheme.label}</strong>
              <span>Espacio de trabajo activo</span>
            </div>
          </div>

          <div className="page-header-main">
            <span className="eyebrow">Panel principal</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <div className="page-header-aside">
            <span className="header-chip">{roleText}</span>
            <span className="header-chip">{tenantProfile?.plan || "MVP"}</span>
            <span className="header-chip">
              {tenantProfile?.subscriptionStatus || "TRIAL"}
            </span>
          </div>
        </header>

        <section className="workspace-strip">
          <div className="workspace-stat">
            <span>Taller</span>
            <strong>{brandName}</strong>
            <small>{session.user.branch}</small>
          </div>
          <div className="workspace-stat">
            <span>Vista</span>
            <strong>{moduleTheme.label}</strong>
            <small>{branchCount} sucursal(es)</small>
          </div>
          <div className="workspace-stat">
            <span>Cuenta</span>
            <strong>
              {tenantProfile?.plan || "MVP"} / {tenantProfile?.subscriptionStatus || "TRIAL"}
            </strong>
            <small>{roleText}</small>
          </div>
        </section>

        <section className="page-content">{children}</section>
      </main>
    </div>
  );
}
