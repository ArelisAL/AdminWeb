import { useState, type FormEvent } from "react";
import { GoogleLogin } from "@react-oauth/google";
import {
  cerrarSesion,
  iniciarSesion,
  iniciarSesionGoogle,
  mensajeError,
  yo,
  type Usuario,
} from "../api/client";
import logo from "../assets/logo-fran-costuras.png";
import IconoFC from "../components/IconoFC";

export default function LoginPage({
  onAutenticado,
}: {
  onAutenticado: (usuario: Usuario) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const anchoGoogle = Math.min(360, Math.max(240, window.innerWidth - 84));

  async function completarAcceso(iniciar: () => Promise<unknown>) {
    setCargando(true);
    setError(null);
    try {
      await iniciar();
      const usuario = await yo();
      if (usuario.rol !== "administradora" || !usuario.activo) {
        await cerrarSesion();
        throw new Error(
          "Este portal es exclusivo para la administradora. Ingresa desde el espacio de tu perfil.",
        );
      }
      onAutenticado(usuario);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    return completarAcceso(() => iniciarSesion(email, password));
  };

  return (
    <main className="auth-page auth-page-admin">
      <section className="auth-story" aria-label="Fran-Costuras administración">
        <div className="auth-logo-card">
          <img src={logo} alt="Fran-Costuras — Diseña, Cose, Crea" />
        </div>
        <div className="auth-story-mark">ESPACIO DE ADMINISTRACIÓN</div>
        <h1>
          Tu taller, <span>en armonía.</span>
        </h1>
        <p>
          Coordina cada detalle de Fran-Costuras desde un espacio claro y
          organizado.
        </p>
        <div className="auth-story-points">
          <div>
            <span className="auth-point-icon" aria-hidden="true">
              <IconoFC nombre="resumen" size={18} />
            </span>
            <span>
              <strong>Una visión completa</strong>
              <small>Pedidos, equipo e inventario a tu alcance.</small>
            </span>
          </div>
          <div>
            <span className="auth-point-icon" aria-hidden="true">
              <IconoFC nombre="aguja" size={18} />
            </span>
            <span>
              <strong>Diseñado para tu taller</strong>
              <small>Una experiencia sencilla, segura y cercana.</small>
            </span>
          </div>
        </div>
      </section>

      <div className="auth-form-panel">
        <section className="auth-card" aria-labelledby="login-title">
          <div className="auth-pill">
            <IconoFC nombre="candado" size={14} /> PORTAL ADMINISTRATIVO
          </div>
          <h2 id="login-title">Bienvenida</h2>
          <p className="auth-subtitle">Inicia sesión para continuar</p>

          <form onSubmit={enviar} className="auth-form">
            <label htmlFor="email">Correo electrónico</label>
            <div className="auth-control">
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="nombre@ejemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={cargando}
              />
            </div>
            <label htmlFor="password">Contraseña</label>
            <div className="auth-control">
              <input
                id="password"
                type={mostrarClave ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Escribe tu contraseña"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={cargando}
              />
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setMostrarClave((actual) => !actual)}
                aria-label={
                  mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={mostrarClave}
                disabled={cargando}
              >
                {mostrarClave ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <button className="auth-submit" type="submit" disabled={cargando}>
              {cargando ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Verificando acceso…
                </>
              ) : (
                <>
                  Entrar a administración <IconoFC nombre="flecha" size={18} />
                </>
              )}
            </button>
          </form>
          {error && (
            <div className="auth-error" role="alert">
              <IconoFC nombre="alerta" size={16} />
              <span>{error}</span>
            </div>
          )}

          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <>
              <div className="auth-divider">
                <span>o continúa con</span>
              </div>
              <div className="auth-google">
                <GoogleLogin
                  onSuccess={({ credential }) =>
                    credential
                      ? void completarAcceso(() =>
                          iniciarSesionGoogle(credential),
                        )
                      : setError("Google no devolvió una credencial válida.")
                  }
                  onError={() =>
                    setError(
                      "No se pudo iniciar con Google. Inténtalo de nuevo.",
                    )
                  }
                  text="signin_with"
                  shape="pill"
                  width={anchoGoogle}
                />
              </div>
            </>
          ) : null}
        </section>
        <div className="auth-footnote">
          <IconoFC nombre="candado" size={16} /> Acceso privado para la
          administradora
        </div>
        <footer className="auth-footer">
          <IconoFC nombre="aguja" size={16} /> Fran-Costuras · Diseña, Cose,
          Crea
        </footer>
      </div>
    </main>
  );
}
