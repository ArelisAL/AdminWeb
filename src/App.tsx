import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { cerrarSesion, obtenerRefresh, yo, type Usuario } from "./api/client";
import LoginPage from "./pages/LoginPage";
import CambiarContrasenaPage from "./pages/CambiarContrasenaPage";
import UsuariosPage from "./pages/UsuariosPage";
import PedidosAdminPage from "./pages/PedidosAdminPage";
import InventarioPage from "./pages/InventarioPage";
import PagosPage from "./pages/PagosPage";
import ServiciosPage from "./pages/ServiciosPage";
import logoFranCosturas from "./assets/logo-fran-costuras.png";
import IconoFC, { type NombreIconoFC } from "./components/IconoFC";
import { iniciales } from "./components/iniciales";
import InicioAdminPage from "./pages/InicioAdminPage";

const SECCIONES: { ruta: string; texto: string; icono: NombreIconoFC }[] = [
  { ruta: "/", texto: "Resumen", icono: "resumen" },
  { ruta: "/usuarios", texto: "Usuarios", icono: "equipo" },
  { ruta: "/pedidos", texto: "Pedidos", icono: "tijeras" },
  { ruta: "/inventario", texto: "Inventario", icono: "inventario" },
  { ruta: "/servicios", texto: "Servicios y tarifas", icono: "servicios" },
  { ruta: "/pagos", texto: "Pagos", icono: "pagos" },
];

const CLAVE_ACTIVIDAD = "fc_ultima_actividad";
const TREINTA_MINUTOS = 30 * 60 * 1000;

function registrarActividad() {
  try {
    window.sessionStorage.setItem(CLAVE_ACTIVIDAD, String(Date.now()));
  } catch {
    // La sesión sigue protegida por el vencimiento del refresh en la API.
  }
}

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ubicacion = useLocation();

  useEffect(() => {
    let activo = true;
    const restaurar = async () => {
      try {
        const refresh = obtenerRefresh();
        if (!refresh) return;
        const ultima = Number(window.sessionStorage.getItem(CLAVE_ACTIVIDAD));
        if (Number.isFinite(ultima) && Date.now() - ultima >= TREINTA_MINUTOS) {
          await cerrarSesion();
          return;
        }
        const actual = await yo();
        if (actual.rol !== "administradora" || !actual.activo) {
          await cerrarSesion();
          return;
        }
        if (activo) setUsuario(actual);
      } catch (e) {
        const estado = (e as { response?: { status?: number } })?.response
          ?.status;
        if (estado === 401) await cerrarSesion();
        else if (activo)
          setError("No se pudo conectar con la API. Intenta nuevamente.");
      } finally {
        if (activo) setCargando(false);
      }
    };
    void restaurar();
    const actividad = () => registrarActividad();
    window.addEventListener("pointerdown", actividad);
    window.addEventListener("keydown", actividad);
    return () => {
      activo = false;
      window.removeEventListener("pointerdown", actividad);
      window.removeEventListener("keydown", actividad);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const ultima = Number(window.sessionStorage.getItem(CLAVE_ACTIVIDAD));
      if (
        usuario &&
        Number.isFinite(ultima) &&
        Date.now() - ultima >= TREINTA_MINUTOS
      ) {
        void cerrarSesion().finally(() => setUsuario(null));
      }
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [usuario]);

  if (cargando)
    return (
      <main className="container py-5" aria-live="polite">
        Cargando sesión…
      </main>
    );
  if (error && !usuario) {
    return (
      <main className="container py-5" role="alert">
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => setError(null)}>
          Ir al inicio de sesión
        </button>
      </main>
    );
  }

  const autenticado = usuario !== null;
  const requiereCambio = Boolean(usuario?.debe_cambiar_contraseña);
  const inicio = requiereCambio ? "/cambiar-contrasena" : "/";

  return (
    <div
      className={`fc-app-shell ${autenticado && !requiereCambio ? "fc-app-shell--panel" : ""}`}
    >
      {autenticado && !requiereCambio && (
        <aside className="fc-sidebar" aria-label="Panel de administración">
          <div className="fc-sidebar__top">
            <Link
              to="/"
              className="fc-sidebar__brand"
              onClick={() => setMenuAbierto(false)}
            >
              <img
                className="fc-brand-logo"
                src={logoFranCosturas}
                alt="Fran-Costuras — Diseña, Cose, Crea"
              />
            </Link>
            <button
              className="fc-sidebar__toggle"
              type="button"
              onClick={() => setMenuAbierto((abierto) => !abierto)}
              aria-controls="fcNavigation"
              aria-expanded={menuAbierto}
              aria-label="Mostrar navegación"
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
          <div
            id="fcNavigation"
            className={`fc-sidebar__body ${menuAbierto ? "is-open" : ""}`}
          >
            <p className="fc-eyebrow fc-sidebar__label" aria-hidden="true">
              PANEL DE ADMINISTRACIÓN
            </p>
            <nav className="fc-sidebar__nav" aria-label="Navegación principal">
              {SECCIONES.map((seccion) => (
                <Link
                  key={seccion.ruta}
                  onClick={() => setMenuAbierto(false)}
                  className={`fc-nav-item ${ubicacion.pathname === seccion.ruta ? "active" : ""}`}
                  aria-current={
                    ubicacion.pathname === seccion.ruta ? "page" : undefined
                  }
                  to={seccion.ruta}
                >
                  <IconoFC nombre={seccion.icono} size={20} /> {seccion.texto}
                </Link>
              ))}
            </nav>
            <div className="fc-sidebar__spacer" />
            <div className="fc-session-card">
              <span className="fc-avatar fc-avatar--rosa" aria-hidden="true">
                {iniciales(usuario.nombre)}
              </span>
              <span className="fc-user-label">
                {usuario.nombre} <small>Administradora</small>
              </span>
            </div>
            <button
              className="btn btn-outline-primary w-100"
              onClick={() => {
                void cerrarSesion().finally(() => setUsuario(null));
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </aside>
      )}
      <div className="fc-app-content">
        <Routes>
          <Route
            path="/login"
            element={
              autenticado ? (
                <Navigate to={inicio} replace />
              ) : (
                <LoginPage onAutenticado={setUsuario} />
              )
            }
          />
          <Route
            path="/cambiar-contrasena"
            element={
              !autenticado ? (
                <Navigate to="/login" replace />
              ) : !requiereCambio ? (
                <Navigate to="/" replace />
              ) : (
                <CambiarContrasenaPage
                  onCorrecto={() =>
                    setUsuario((u) =>
                      u ? { ...u, debe_cambiar_contraseña: false } : u,
                    )
                  }
                />
              )
            }
          />
          <Route
            path="/"
            element={
              !autenticado ? (
                <Navigate to="/login" replace />
              ) : requiereCambio ? (
                <Navigate to="/cambiar-contrasena" replace />
              ) : (
                <InicioAdminPage />
              )
            }
          />
          <Route
            path="/usuarios"
            element={
              !autenticado ? (
                <Navigate to="/login" replace />
              ) : requiereCambio ? (
                <Navigate to="/cambiar-contrasena" replace />
              ) : usuario?.rol === "administradora" ? (
                <UsuariosPage actual={usuario} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/pedidos"
            element={
              !autenticado ? (
                <Navigate to="/login" replace />
              ) : requiereCambio ? (
                <Navigate to="/cambiar-contrasena" replace />
              ) : usuario?.rol === "administradora" ? (
                <PedidosAdminPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/inventario"
            element={
              !autenticado ? (
                <Navigate to="/login" replace />
              ) : requiereCambio ? (
                <Navigate to="/cambiar-contrasena" replace />
              ) : usuario?.rol === "administradora" ? (
                <InventarioPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/pagos"
            element={
              !autenticado ? (
                <Navigate to="/login" replace />
              ) : requiereCambio ? (
                <Navigate to="/cambiar-contrasena" replace />
              ) : usuario?.rol === "administradora" ? (
                <PagosPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/servicios"
            element={
              !autenticado ? (
                <Navigate to="/login" replace />
              ) : requiereCambio ? (
                <Navigate to="/cambiar-contrasena" replace />
              ) : usuario?.rol === "administradora" ? (
                <ServiciosPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="*"
            element={<Navigate to={autenticado ? inicio : "/login"} replace />}
          />
        </Routes>
      </div>
    </div>
  );
}
