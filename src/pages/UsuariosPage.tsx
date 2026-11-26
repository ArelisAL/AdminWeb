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
import EncabezadoPagina from "../components/EncabezadoPagina";
import IconoFC from "../components/IconoFC";
import InsigniaEstado from "../components/InsigniaEstado";
import { iniciales } from "../components/iniciales";

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

  const tonosAvatar = ["rosa", "celeste", "menta", "amarillo", "lila"];

  return (
    <main className="fc-page">
      <EncabezadoPagina
        etiqueta="EQUIPO"
        titulo="Usuarios del taller"
        descripcion={<>Sesión: {actual.nombre} · Administradora</>}
        acciones={
          <>
            <Link className="btn btn-outline-primary" to="/pedidos">
              Fechas de entrega
            </Link>
            <Link className="btn btn-outline-primary" to="/inventario">
              Inventario
            </Link>
            <Link className="btn btn-outline-primary" to="/pagos">
              Pagos
            </Link>
          </>
        }
      />
      {error && (
        <div className="alert alert-danger fc-alert" role="alert">
          <IconoFC nombre="alerta" size={18} />
          <span>{error}</span>
        </div>
      )}
      {telasBajas.length > 0 && (
        <section className="fc-alert-panel" role="status">
          <IconoFC nombre="alerta" size={22} />
          <div>
            <h2>Alerta: telas con stock bajo</h2>
            <ul className="mb-0">
              {telasBajas.map((tela) => (
                <li key={tela.id}>
                  {tela.nombre} ({tela.color}): {tela.metros_disponibles} m;
                  mínimo {tela.stock_minimo} m
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      {mensaje && (
        <div className="alert alert-success fc-alert" role="status">
          <IconoFC nombre="cheque" size={18} />
          <span>{mensaje}</span>
        </div>
      )}
      <div className="fc-split">
        <section className="fc-split__main" aria-labelledby="usuarios-lista">
          <div className="fc-table-card">
            <h2 id="usuarios-lista" className="fc-table-card__title">
              Listado ({total})
            </h2>
            {cargando ? (
              <p className="fc-table-card__empty" aria-live="polite">
                Cargando usuarios…
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table fc-table align-middle mb-0">
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
                    {usuarios.map((usuario, indice) => (
                      <tr
                        key={usuario.id}
                        className={
                          seleccionado?.id === usuario.id ? "is-selected" : ""
                        }
                      >
                        <td>
                          <span className="fc-person">
                            <span
                              className={`fc-avatar fc-avatar--${usuario.activo ? tonosAvatar[indice % tonosAvatar.length] : "gris"}`}
                              aria-hidden="true"
                            >
                              {iniciales(usuario.nombre)}
                            </span>
                            <strong>{usuario.nombre}</strong>
                          </span>
                        </td>
                        <td>{usuario.email}</td>
                        <td>
                          <span className="fc-tag">{usuario.rol}</span>
                        </td>
                        <td>
                          <InsigniaEstado
                            tono={usuario.activo ? "activo" : "inactivo"}
                          >
                            {usuario.activo ? "Activo" : "Desactivado"}
                          </InsigniaEstado>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary fc-btn-icon"
                              onClick={() => editar(usuario)}
                            >
                              <IconoFC nombre="editar" size={16} />
                              Editar
                            </button>
                            {usuario.activo && usuario.id !== actual.id && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => void desactivar(usuario)}
                              >
                                Desactivar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="fc-pagination">
            <button
              className="fc-link-btn"
              disabled={pagina <= 1 || cargando}
              onClick={() => setPagina((p) => p - 1)}
            >
              Anterior
            </button>
            <span className="fc-pagination__current">
              Página {pagina} de {Math.max(1, Math.ceil(total / 20))}
            </span>
            <button
              className="fc-link-btn"
              disabled={pagina >= Math.ceil(total / 20) || cargando}
              onClick={() => setPagina((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </section>
        <section
          className="fc-panel fc-split__side"
          aria-labelledby="usuario-form"
        >
          <div className="fc-panel__person">
            {seleccionado && (
              <span className="fc-avatar fc-avatar--celeste" aria-hidden="true">
                {iniciales(seleccionado.nombre)}
              </span>
            )}
            <h2 id="usuario-form" className="fc-panel__heading">
              {seleccionado ? "Editar usuario" : "Crear usuario"}
            </h2>
          </div>
          <form onSubmit={enviar} className="fc-form">
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
            {!seleccionado && (
              <div>
                <label className="form-label" htmlFor="contrasena-temporal">
                  Contraseña temporal
                </label>
                <div className="fc-input-action">
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
                    className="fc-link-btn"
                    type="button"
                    onClick={() => setMostrarPassword((visible) => !visible)}
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña temporal"
                        : "Mostrar contraseña temporal"
                    }
                    aria-pressed={mostrarPassword}
                  >
                    {mostrarPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>
            )}
            <div className="fc-form__actions">
              {seleccionado && (
                <button
                  className="btn btn-outline-primary"
                  type="button"
                  onClick={limpiar}
                >
                  Cancelar
                </button>
              )}
              <button className="btn btn-primary" type="submit">
                {seleccionado ? "Guardar cambios" : "Crear usuario"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
