import React, { useState } from "react";
import { StoreProvider } from "./store";
import Dashboard from "./components/Dashboard";
import RegistrarIngreso from "./components/RegistrarIngreso";
import DistribucionSugerida from "./components/DistribucionSugerida";
import Cuentas from "./components/Cuentas";
import Deudas from "./components/Deudas";
import Metas from "./components/Metas";
import Logros from "./components/Logros";
import WealthAdvisor from "./components/WealthAdvisor";
import MiMundo from "./components/MiMundo";
import ProductosFinancieros from "./components/ProductosFinancieros";
import Metricas from "./components/Metricas";
import type { Distribucion } from "./types";

type Tab =
  | "dashboard" | "ingreso" | "distribucion" | "cuentas" | "deudas"
  | "metas" | "logros" | "advisor" | "mimundo" | "productos" | "metricas";

const NAV_ITEMS: { id: Tab; icon: string; label: string }[] = [
  { id: "dashboard", icon: "🏠", label: "Inicio"    },
  { id: "ingreso",   icon: "💰", label: "Ingreso"   },
  { id: "mimundo",   icon: "🌐", label: "Mi Mundo"  },
  { id: "metas",     icon: "🎯", label: "Metas"     },
  { id: "advisor",   icon: "🤖", label: "Advisor"   },
];

const MORE_ITEMS: { id: Tab; icon: string; label: string }[] = [
  { id: "productos",    icon: "💼", label: "Productos"    },
  { id: "distribucion", icon: "📐", label: "Distribuir"   },
  { id: "metricas",     icon: "📊", label: "Métricas"     },
  { id: "cuentas",      icon: "🏦", label: "Cuentas"      },
  { id: "deudas",       icon: "📋", label: "Deudas"       },
  { id: "logros",       icon: "🏆", label: "Logros"       },
];

const ALL_TABS = [...NAV_ITEMS, ...MORE_ITEMS];

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}

function AppInner() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [distribucionData, setDistribucionData] = useState<Distribucion[] | undefined>();
  const [showMore, setShowMore] = useState(false);

  function handleDistribucion(d: Distribucion[]) {
    setDistribucionData(d);
    setActiveTab("distribucion");
  }

  const activeInfo = ALL_TABS.find((n) => n.id === activeTab);

  function goTo(tab: string) { setActiveTab(tab as Tab); setShowMore(false); }

  return (
    <div style={{
      maxWidth: 430, margin: "0 auto", minHeight: "100dvh",
      background: "#f5f5f7", display: "flex", flexDirection: "column",
      position: "relative",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
    }}>
      <div style={{ height: "env(safe-area-inset-top, 0px)", background: "#f5f5f7" }} />

      {/* Top bar */}
      <div style={{ padding: "12px 20px 8px", background: "#f5f5f7", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1.5 }}>WealthOS César</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#1a1a2e", letterSpacing: -0.5 }}>
              {activeInfo?.icon} {activeInfo?.label ?? ""}
            </div>
          </div>
          <button
            onClick={() => setShowMore(!showMore)}
            style={{
              background: showMore ? "#1a1a2e" : "#e9ecef", border: "none", borderRadius: "50%",
              width: 36, height: 36, fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: showMore ? "#fff" : "#666",
            }}
          >
            ⋯
          </button>
        </div>

        {showMore && (
          <div style={{ background: "#fff", borderRadius: 14, marginTop: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden" }}>
            {MORE_ITEMS.map((item) => (
              <button key={item.id} onClick={() => goTo(item.id)} style={{
                width: "100%", padding: "13px 16px", background: activeTab === item.id ? "#f0f4ff" : "#fff",
                border: "none", borderBottom: "1px solid #f0f0f0", textAlign: "left",
                fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                color: "#1a1a2e", fontFamily: "inherit", fontWeight: activeTab === item.id ? 700 : 400,
              }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>
        {activeTab === "dashboard"    && <Dashboard onNavigate={goTo} />}
        {activeTab === "ingreso"      && <RegistrarIngreso onDistribucion={handleDistribucion} />}
        {activeTab === "distribucion" && <DistribucionSugerida distribucion={distribucionData} />}
        {activeTab === "mimundo"      && <MiMundo />}
        {activeTab === "productos"    && <ProductosFinancieros />}
        {activeTab === "metricas"     && <Metricas />}
        {activeTab === "cuentas"      && <Cuentas />}
        {activeTab === "deudas"       && <Deudas />}
        {activeTab === "metas"        && <Metas />}
        {activeTab === "logros"       && <Logros />}
        {activeTab === "advisor"      && <WealthAdvisor />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        padding: "8px 0 calc(8px + env(safe-area-inset-bottom, 0px))",
        zIndex: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => goTo(item.id)} style={{
              background: "none", border: "none", padding: "4px 10px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 52,
            }}>
              <span style={{
                fontSize: 22, display: "block",
                filter: activeTab === item.id ? "none" : "grayscale(0.5) opacity(0.5)",
                transition: "filter 0.2s",
              }}>
                {item.icon}
              </span>
              <span style={{ fontSize: 10, fontWeight: activeTab === item.id ? 700 : 400, color: activeTab === item.id ? "#1a1a2e" : "#aaa", letterSpacing: 0.2 }}>
                {item.label}
              </span>
              {activeTab === item.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#1a1a2e", marginTop: 1 }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
