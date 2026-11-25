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

function Icono({ tipo }: { tipo: "correo" | "clave" }) {
  const dibujo =
    tipo === "correo" ? (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m4 7 8 6 8-6" />
      </>
    ) : (
      <>
        <rect x="4" y="10" width="16" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
      </>
    );
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {dibujo}
    </svg>
  );
}

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
        <div className="auth-story-mark">
          <span aria-hidden="true">✦</span> ESPACIO DE ADMINISTRACIÓN
        </div>
        <h1>
          Tu taller,
          <br />
          <span>en armonía.</span>
        </h1>
        <p>
          Coordina cada detalle de Fran-Costuras desde un espacio claro y
          organizado.
        </p>
        <div className="auth-story-points">
          <div>
            <span className="auth-point-icon" aria-hidden="true">
              ✧
            </span>
            <span>
              <strong>Una visión completa</strong>
              <small>Pedidos, equipo e inventario a tu alcance.</small>
            </span>
          </div>
          <div>
            <span className="auth-point-icon" aria-hidden="true">
              ⌁
            </span>
            <span>
              <strong>Diseñado para tu taller</strong>
              <small>Una experiencia sencilla, segura y cercana.</small>
            </span>
          </div>
        </div>
        <div className="auth-stitch" aria-hidden="true" />
      </section>

      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-logo-wrap">
          <img src={logo} alt="Fran-Costuras — Diseña, Cose, Crea" />
        </div>
        <div className="auth-eyebrow">PORTAL ADMINISTRATIVO</div>
        <h2 id="login-title">Bienvenida</h2>
        <p className="auth-subtitle">Inicia sesión para continuar</p>
        {error && (
          <div className="auth-error" role="alert">
            <span aria-hidden="true">!</span>
            {error}
          </div>
        )}

        <form onSubmit={enviar} className="auth-form">
          <label htmlFor="email">Correo electrónico</label>
          <div className="auth-control">
            <span className="auth-control-icon">
              <Icono tipo="correo" />
            </span>
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
            <span className="auth-control-icon">
              <Icono tipo="clave" />
            </span>
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
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
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
                Entrar a administración <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

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
                  setError("No se pudo iniciar con Google. Inténtalo de nuevo.")
                }
                text="signin_with"
                shape="pill"
                width={anchoGoogle}
              />
            </div>
          </>
        ) : (
          <>
            <div className="auth-divider">
              <span>o continúa con</span>
            </div>
            <button
              type="button"
              className="auth-google-placeholder"
              disabled
              aria-describedby="google-pendiente"
            >
              Continuar con Google
            </button>
            <p id="google-pendiente" className="auth-provider-note">
              Se habilita al configurar el Client ID de Google del taller.
            </p>
          </>
        )}
        <div className="auth-footnote">
          <span aria-hidden="true">♧</span> Acceso privado para la
          administradora
        </div>
      </section>
      <footer className="auth-footer">
        Fran-Costuras <span>·</span> Diseña, Cose, Crea
      </footer>
    </main>
  );
}
