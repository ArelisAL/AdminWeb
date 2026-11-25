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
import IconoCostura from "./components/IconoCostura";
import InicioAdminPage from "./pages/InicioAdminPage";

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
    <div className="fc-app-shell">
      {!autenticado || requiereCambio ? (
        <header className="container py-3 d-flex align-items-center">
          <Link to={autenticado ? inicio : "/login"} className="fc-brand-link">
            Fran-Costuras
          </Link>
        </header>
      ) : (
        <header className="navbar navbar-expand-lg fc-navbar sticky-top">
          <div className="container-fluid px-3 px-lg-4">
            <Link to="/" className="navbar-brand fc-brand-link">
              <img
                className="fc-brand-logo"
                src={logoFranCosturas}
                alt="Fran-Costuras — Diseña, Cose, Crea"
              />
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              onClick={() => setMenuAbierto((abierto) => !abierto)}
              aria-controls="fcNavigation"
              aria-expanded={menuAbierto}
              aria-label="Mostrar navegación"
            >
              <span className="navbar-toggler-icon" />
            </button>
            <nav
              className={`navbar-collapse ${menuAbierto ? "d-block" : "d-none"} d-lg-flex`}
              id="fcNavigation"
              aria-label="Navegación principal"
            >
              <div className="navbar-nav me-auto">
                <Link
                  onClick={() => setMenuAbierto(false)}
                  className={`nav-link ${ubicacion.pathname === "/" ? "active" : ""}`}
                  to="/"
                >
                  <IconoCostura tipo="puntada" size={17} /> Resumen
                </Link>
                <Link
                  onClick={() => setMenuAbierto(false)}
                  className={`nav-link ${ubicacion.pathname === "/usuarios" ? "active" : ""}`}
                  to="/usuarios"
                >
                  <IconoCostura tipo="aguja" size={17} /> Usuarios
                </Link>
                <Link
                  onClick={() => setMenuAbierto(false)}
                  className={`nav-link ${ubicacion.pathname === "/pedidos" ? "active" : ""}`}
                  to="/pedidos"
                >
                  <IconoCostura tipo="tijeras" size={17} /> Pedidos
                </Link>
                <Link
                  onClick={() => setMenuAbierto(false)}
                  className={`nav-link ${ubicacion.pathname === "/inventario" ? "active" : ""}`}
                  to="/inventario"
                >
                  <IconoCostura tipo="cinta" size={17} /> Inventario
                </Link>
                <Link
                  onClick={() => setMenuAbierto(false)}
                  className={`nav-link ${ubicacion.pathname === "/servicios" ? "active" : ""}`}
                  to="/servicios"
                >
                  <IconoCostura tipo="carrete" size={17} /> Servicios y tarifas
                </Link>
                <Link
                  onClick={() => setMenuAbierto(false)}
                  className={`nav-link ${ubicacion.pathname === "/pagos" ? "active" : ""}`}
                  to="/pagos"
                >
                  <IconoCostura tipo="puntada" size={17} /> Pagos
                </Link>
              </div>
              <div className="d-flex align-items-center gap-3 py-2 py-lg-0">
                <span className="fc-user-label">
                  {usuario.nombre} <small>Administradora</small>
                </span>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    void cerrarSesion().finally(() => setUsuario(null));
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            </nav>
          </div>
        </header>
      )}
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
  );
}
