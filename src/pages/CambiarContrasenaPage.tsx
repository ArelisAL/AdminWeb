import { useState, type FormEvent } from "react";
import { cambiarContrasena, mensajeError } from "../api/client";
import logo from "../assets/logo-fran-costuras.png";
import IconoFC from "../components/IconoFC";

export default function CambiarContrasenaPage({
  onCorrecto,
}: {
  onCorrecto: () => void;
}) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await cambiarContrasena(actual, nueva);
      onCorrecto();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="auth-page auth-page-admin">
      <section className="auth-story" aria-label="Fran-Costuras administración">
        <div className="auth-logo-card">
          <img src={logo} alt="Fran-Costuras — Diseña, Cose, Crea" />
        </div>
      </section>
      <div className="auth-form-panel">
        <section className="auth-card" aria-labelledby="cambio-title">
          <div className="auth-pill">
            <IconoFC nombre="candado" size={14} /> Primer ingreso
          </div>
          <h1 id="cambio-title" className="auth-title">
            Actualiza tu contraseña
          </h1>
          <div className="auth-notice">
            <IconoFC nombre="alerta" size={18} />
            <p>Debes cambiar la contraseña temporal antes de continuar.</p>
          </div>
          {error && (
            <div className="auth-error" role="alert">
              <IconoFC nombre="alerta" size={16} />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={enviar} className="auth-form">
            <label htmlFor="contrasena-temporal">Contraseña temporal</label>
            <div className="auth-control">
              <input
                id="contrasena-temporal"
                type={mostrarActual ? "text" : "password"}
                autoComplete="current-password"
                required
                value={actual}
                onChange={(e) => setActual(e.target.value)}
              />
              <button
                className="auth-toggle"
                type="button"
                onClick={() => setMostrarActual((visible) => !visible)}
                aria-label={
                  mostrarActual
                    ? "Ocultar contraseña temporal"
                    : "Mostrar contraseña temporal"
                }
                aria-pressed={mostrarActual}
              >
                {mostrarActual ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <label htmlFor="nueva-contrasena">Nueva contraseña</label>
            <div className="auth-control">
              <input
                id="nueva-contrasena"
                type={mostrarNueva ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={10}
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
              />
              <button
                className="auth-toggle"
                type="button"
                onClick={() => setMostrarNueva((visible) => !visible)}
                aria-label={
                  mostrarNueva
                    ? "Ocultar nueva contraseña"
                    : "Mostrar nueva contraseña"
                }
                aria-pressed={mostrarNueva}
              >
                {mostrarNueva ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <button className="auth-submit" disabled={cargando}>
              {cargando ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </form>
        </section>
        <div className="auth-footnote">
          <IconoFC nombre="candado" size={16} /> Tu sesión se cierra sola tras
          30 minutos sin uso.
        </div>
      </div>
    </main>
  );
}
