import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  crearUsuario,
  desactivarUsuario,
  editarUsuario,
  listarUsuarios,
  listarTelasBajoStock,
  mensajeError,
  type Tela,
  type Usuario,
} from "../api/client";
import { Link } from "react-router-dom";

const roles: Usuario["rol"][] = [
  "administradora",
  "recepcionista",
  "costurera",
];

export default function UsuariosPage({ actual }: { actual: Usuario }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [telasBajas, setTelasBajas] = useState<Tela[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState<Usuario["rol"]>("recepcionista");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const resultado = await listarUsuarios(pagina);
      setUsuarios(resultado.results);
      setTotal(resultado.count);
      setError(null);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    listarTelasBajoStock()
      .then((pagina) => setTelasBajas(pagina.results))
      .catch(() => setTelasBajas([]));
  }, []);

  const limpiar = () => {
    setSeleccionado(null);
    setNombre("");
    setCorreo("");
    setRol("recepcionista");
    setPassword("");
    setMostrarPassword(false);
  };

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    try {
      if (seleccionado) {
        await editarUsuario(seleccionado.id, { nombre, email: correo, rol });
        setMensaje("Usuario actualizado.");
      } else {
        await crearUsuario({ nombre, email: correo, rol, password });
        setMensaje(
          "Usuario creado. Debe cambiar su contraseña temporal al ingresar.",
        );
      }
      limpiar();
      await cargar();
    } catch (e) {
      setError(mensajeError(e));
    }
  };

  const editar = (usuario: Usuario) => {
    setSeleccionado(usuario);
    setNombre(usuario.nombre);
    setCorreo(usuario.email);
    setRol(usuario.rol);
    setPassword("");
    setMostrarPassword(false);
  };

  const desactivar = async (usuario: Usuario) => {
    if (!window.confirm(`¿Desactivar la cuenta de ${usuario.nombre}?`)) return;
    setError(null);
    try {
      await desactivarUsuario(usuario.id);
      setMensaje("Cuenta desactivada.");
      await cargar();
    } catch (e) {
      setError(mensajeError(e));
    }
  };

  return (
    <main className="container py-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h1 className="h2 mb-1" style={{ color: "var(--fc-titulo)" }}>
            Usuarios del taller
          </h1>
          <p className="mb-0">Sesión: {actual.nombre} · Administradora</p>
          <Link className="btn btn-outline-primary mt-2" to="/pedidos">
            Fechas de entrega
          </Link>
          <Link className="btn btn-outline-primary mt-2 ms-2" to="/inventario">
            Inventario
          </Link>
          <Link className="btn btn-outline-primary mt-2 ms-2" to="/pagos">
            Pagos
          </Link>
        </div>
      </div>
      {error && (
        <div
          className="alert"
          role="alert"
          style={{ backgroundColor: "var(--fc-error)", color: "#fff" }}
        >
          {error}
        </div>
      )}
      {telasBajas.length > 0 && (
        <section
          className="alert mb-4"
          role="status"
          style={{ backgroundColor: "var(--fc-error)", color: "#fff" }}
        >
          <h2 className="h5">Alerta: telas con stock bajo</h2>
          <ul className="mb-0">
            {telasBajas.map((tela) => (
              <li key={tela.id}>
                {tela.nombre} ({tela.color}): {tela.metros_disponibles} m;
                mínimo {tela.stock_minimo} m
              </li>
            ))}
          </ul>
        </section>
      )}
      {mensaje && (
        <div
          className="alert"
          role="status"
          style={{
            background: "var(--fc-verde-menta)",
            color: "var(--fc-texto)",
          }}
        >
          {mensaje}
        </div>
      )}
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5" style={{ color: "var(--fc-titulo)" }}>
            {seleccionado ? "Editar usuario" : "Crear usuario"}
          </h2>
          <form onSubmit={enviar} className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label">
                Nombre
                <input
                  className="form-control"
                  required
                  maxLength={100}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </label>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">
                Correo
                <input
                  className="form-control"
                  required
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </label>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">
                Rol
                <select
                  className="form-select"
                  value={rol}
                  onChange={(e) => setRol(e.target.value as Usuario["rol"])}
                >
                  {roles.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {!seleccionado && (
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="contrasena-temporal">
                  Contraseña temporal
                </label>
                <div className="input-group">
                  <input
                    id="contrasena-temporal"
                    className="form-control"
                    required
                    minLength={10}
                    autoComplete="new-password"
                    type={mostrarPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="btn btn-outline-primary"
                    type="button"
                    onClick={() => setMostrarPassword((visible) => !visible)}
                    aria-label={mostrarPassword ? "Ocultar contraseña temporal" : "Mostrar contraseña temporal"}
                    aria-pressed={mostrarPassword}
                  >
                    {mostrarPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>
            )}
            <div className="col-12 d-flex gap-2">
              <button className="btn btn-primary" type="submit">
                {seleccionado ? "Guardar cambios" : "Crear usuario"}
              </button>
              {seleccionado && (
                <button
                  className="btn btn-outline-secondary"
                  style={{
                    color: "var(--fc-gris-violeta)",
                    borderColor: "var(--fc-gris-violeta)",
                  }}
                  type="button"
                  onClick={limpiar}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
      <section className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="h5" style={{ color: "var(--fc-titulo)" }}>
            Listado ({total})
          </h2>
          {cargando ? (
            <p aria-live="polite">Cargando usuarios…</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.nombre}</td>
                      <td>{usuario.email}</td>
                      <td>{usuario.rol}</td>
                      <td>{usuario.activo ? "Activo" : "Desactivado"}</td>
                      <td className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => editar(usuario)}
                        >
                          Editar
                        </button>
                        {usuario.activo && usuario.id !== actual.id && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            style={{
                              color: "var(--fc-error)",
                              borderColor: "var(--fc-error)",
                            }}
                            onClick={() => void desactivar(usuario)}
                          >
                            Desactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="d-flex justify-content-between align-items-center">
            <button
              className="btn btn-outline-primary"
              disabled={pagina <= 1 || cargando}
              onClick={() => setPagina((p) => p - 1)}
            >
              Anterior
            </button>
            <span>
              Página {pagina} de {Math.max(1, Math.ceil(total / 20))}
            </span>
            <button
              className="btn btn-outline-primary"
              disabled={pagina >= Math.ceil(total / 20) || cargando}
              onClick={() => setPagina((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
