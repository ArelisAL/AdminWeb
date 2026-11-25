import { useState, type FormEvent } from "react";
import { cambiarContrasena, mensajeError } from "../api/client";

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
    <main className="container d-flex justify-content-center py-5">
      <section
        className="login-card rounded-4 p-4 shadow"
        style={{ background: "var(--fc-blanco-lavanda)" }}
      >
        <h1 className="h3 mb-3" style={{ color: "var(--fc-titulo)" }}>
          Actualiza tu contraseña
        </h1>
        <p>Debes cambiar la contraseña temporal antes de continuar.</p>
        {error && (
          <div
            className="alert"
            role="alert"
            style={{ backgroundColor: "var(--fc-error)", color: "#fff" }}
          >
            {error}
          </div>
        )}
        <form onSubmit={enviar} className="d-grid gap-3">
          <div>
            <label htmlFor="contrasena-temporal">Contraseña temporal</label>
            <div className="input-group mt-1">
              <input
                id="contrasena-temporal"
                className="form-control"
                type={mostrarActual ? "text" : "password"}
                autoComplete="current-password"
                required
                value={actual}
                onChange={(e) => setActual(e.target.value)}
              />
              <button
                className="btn btn-outline-primary"
                type="button"
                onClick={() => setMostrarActual((visible) => !visible)}
                aria-label={mostrarActual ? "Ocultar contraseña temporal" : "Mostrar contraseña temporal"}
                aria-pressed={mostrarActual}
              >
                {mostrarActual ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="nueva-contrasena">Nueva contraseña</label>
            <div className="input-group mt-1">
              <input
                id="nueva-contrasena"
                className="form-control"
                type={mostrarNueva ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={10}
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
              />
              <button
                className="btn btn-outline-primary"
                type="button"
                onClick={() => setMostrarNueva((visible) => !visible)}
                aria-label={mostrarNueva ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                aria-pressed={mostrarNueva}
              >
                {mostrarNueva ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>
          <button className="btn btn-primary" disabled={cargando}>
            {cargando ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </form>
      </section>
    </main>
  );
}
