import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  crearServicioCatalogo,
  editarServicioCatalogo,
  listarServiciosCatalogo,
  mensajeError,
  type CambioServicio,
  type ServicioCatalogo,
} from "../api/client";
import IconoCostura from "../components/IconoCostura";
import EncabezadoPagina from "../components/EncabezadoPagina";
import IconoFC from "../components/IconoFC";

const formularioVacio: CambioServicio = {
  codigo: "",
  nombre: "",
  categoria: "",
  descripcion: "",
  unidad: "",
  tarifa_base: null,
  requiere_valoracion: false,
  activo: false,
};

function formularioDe(servicio: ServicioCatalogo): CambioServicio {
  return {
    codigo: servicio.codigo,
    nombre: servicio.nombre,
    categoria: servicio.categoria,
    descripcion: servicio.descripcion,
    unidad: servicio.unidad,
    tarifa_base: servicio.tarifa_base,
    requiere_valoracion: servicio.requiere_valoracion,
    activo: servicio.activo,
  };
}

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<ServicioCatalogo[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [formulario, setFormulario] = useState<CambioServicio>(formularioVacio);
  const [edicion, setEdicion] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const activosEnPagina = servicios.filter(
    (servicio) => servicio.activo,
  ).length;
  const pendientesEnPagina = servicios.filter(
    (servicio) => servicio.tarifa_base === null,
  ).length;

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await listarServiciosCatalogo(pagina);
      setServicios(respuesta.results);
      setTotal(respuesta.count);
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

  function actualizar<K extends keyof CambioServicio>(
    campo: K,
    valor: CambioServicio[K],
  ) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    setGuardando(true);
    const datos: CambioServicio = {
      ...formulario,
      tarifa_base: formulario.tarifa_base?.trim() || null,
    };
    try {
      if (edicion === null) await crearServicioCatalogo(datos);
      else await editarServicioCatalogo(edicion, datos);
      setMensaje(
        edicion === null ? "Servicio creado." : "Servicio actualizado.",
      );
      setFormulario(formularioVacio);
      setEdicion(null);
      if (pagina !== 1) setPagina(1);
      else await cargar();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  }

  function editar(servicio: ServicioCatalogo) {
    setFormulario(formularioDe(servicio));
    setEdicion(servicio.id);
    setError(null);
    setMensaje(null);
  }

  async function cambiarActivo(servicio: ServicioCatalogo) {
    setError(null);
    setMensaje(null);
    try {
      await editarServicioCatalogo(servicio.id, { activo: !servicio.activo });
      setMensaje(
        servicio.activo ? "Servicio desactivado." : "Servicio activado.",
      );
      await cargar();
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  return (
    <main className="fc-page fc-catalog">
      <EncabezadoPagina
        id="catalog-title"
        etiqueta="CONFIGURACIÓN DEL TALLER"
        titulo="Servicios y tarifas"
        descripcion="Organiza los trabajos del taller y configura únicamente los precios aprobados por el negocio."
        acciones={
          <span className="fc-catalog-hero__note">
            <IconoFC nombre="carrete" size={18} /> Sin precios de referencia
            precargados
          </span>
        }
      />

      <section
        className="fc-metrics fc-metrics--3"
        aria-label="Resumen del catálogo"
      >
        <article className="fc-metric">
          <span className="fc-metric__head">
            <span className="fc-bubble">
              <IconoFC nombre="servicios" />
            </span>
            <small>Servicios registrados</small>
          </span>
          <strong>{total}</strong>
        </article>
        <article className="fc-metric">
          <span className="fc-metric__head">
            <span className="fc-bubble">
              <IconoFC nombre="cheque" />
            </span>
            <small>Activos en esta página</small>
          </span>
          <strong>{activosEnPagina}</strong>
        </article>
        <article className="fc-metric">
          <span className="fc-metric__head">
            <span className="fc-bubble">
              <IconoFC nombre="calendario" />
            </span>
            <small>Por configurar en esta página</small>
          </span>
          <strong>{pendientesEnPagina}</strong>
        </article>
      </section>

      <div
        className="alert fc-config-alert d-flex align-items-start gap-2"
        role="note"
      >
        <span className="fc-config-alert__icon">
          <IconoCostura tipo="aguja" size={21} />
        </span>
        <span>
          Deja la tarifa vacía mientras no esté aprobada. El sistema la marcará
          como pendiente; no se usarán los precios de referencia del documento.
        </span>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="alert alert-success" role="status">
          {mensaje}
        </div>
      )}

      <div className="fc-split fc-split--form-last">
        <section
          className="card shadow-sm border-0 fc-catalog-panel fc-catalog-editor"
          aria-labelledby="form-title"
        >
          <div className="fc-catalog-panel__heading">
            <span className="fc-catalog-panel__seal">
              <IconoCostura tipo="carrete" size={30} />
            </span>
            <div>
              <p className="fc-eyebrow mb-1">FICHA DEL CATÁLOGO</p>
              <h2 id="form-title">
                {edicion === null ? "Agregar un servicio" : "Editar servicio"}
              </h2>
              <p>Completa los datos del trabajo que realiza el taller.</p>
            </div>
            {edicion !== null && (
              <span className="fc-editing-pill">
                <IconoCostura tipo="aguja" size={17} /> Editando ficha
              </span>
            )}
          </div>
          <div className="card-body p-3 p-lg-4">
            <form onSubmit={(evento) => void guardar(evento)}>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label
                    className="form-label fc-catalog-label"
                    htmlFor="servicio-codigo"
                  >
                    <IconoCostura tipo="tijeras" size={17} /> Código
                  </label>
                  <input
                    id="servicio-codigo"
                    className="form-control"
                    maxLength={40}
                    required
                    value={formulario.codigo}
                    onChange={(e) => actualizar("codigo", e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label
                    className="form-label fc-catalog-label"
                    htmlFor="servicio-nombre"
                  >
                    <IconoCostura tipo="aguja" size={17} /> Nombre
                  </label>
                  <input
                    id="servicio-nombre"
                    className="form-control"
                    maxLength={120}
                    required
                    value={formulario.nombre}
                    onChange={(e) => actualizar("nombre", e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label
                    className="form-label fc-catalog-label"
                    htmlFor="servicio-categoria"
                  >
                    <IconoCostura tipo="puntada" size={17} /> Categoría
                  </label>
                  <input
                    id="servicio-categoria"
                    className="form-control"
                    maxLength={80}
                    required
                    value={formulario.categoria}
                    onChange={(e) => actualizar("categoria", e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label
                    className="form-label fc-catalog-label"
                    htmlFor="servicio-unidad"
                  >
                    <IconoCostura tipo="cinta" size={17} /> Unidad
                  </label>
                  <input
                    id="servicio-unidad"
                    className="form-control"
                    maxLength={40}
                    required
                    value={formulario.unidad}
                    onChange={(e) => actualizar("unidad", e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label
                    className="form-label fc-catalog-label"
                    htmlFor="servicio-tarifa"
                  >
                    <IconoCostura tipo="carrete" size={17} /> Tarifa base (USD)
                  </label>
                  <input
                    id="servicio-tarifa"
                    className="form-control"
                    type="text"
                    inputMode="decimal"
                    placeholder="Pendiente de configurar"
                    value={formulario.tarifa_base ?? ""}
                    onChange={(e) => actualizar("tarifa_base", e.target.value)}
                  />
                  <small className="fc-field-hint">
                    Déjala vacía si el taller aún no ha aprobado el precio.
                  </small>
                </div>
                <div className="col-12 col-md-4 d-flex align-items-end">
                  <div className="form-check mb-2">
                    <input
                      id="servicio-valoracion"
                      className="form-check-input"
                      type="checkbox"
                      checked={formulario.requiere_valoracion}
                      onChange={(e) =>
                        actualizar("requiere_valoracion", e.target.checked)
                      }
                    />
                    <label
                      className="form-check-label fc-valuation-label"
                      htmlFor="servicio-valoracion"
                    >
                      <span className="fc-valuation-label__icon">
                        <IconoCostura tipo="aguja" size={20} />
                      </span>
                      <span>
                        <strong>Requiere valoración manual</strong>
                        <small>El precio se define para cada caso.</small>
                      </span>
                    </label>
                  </div>
                </div>
                <div className="col-12">
                  <label
                    className="form-label fc-catalog-label"
                    htmlFor="servicio-descripcion"
                  >
                    <IconoCostura tipo="puntada" size={17} /> Descripción del
                    trabajo
                  </label>
                  <textarea
                    id="servicio-descripcion"
                    className="form-control"
                    rows={2}
                    value={formulario.descripcion}
                    onChange={(e) => actualizar("descripcion", e.target.value)}
                  />
                </div>
                {edicion !== null && (
                  <div className="col-12">
                    <div className="form-check">
                      <input
                        id="servicio-activo"
                        className="form-check-input"
                        type="checkbox"
                        checked={formulario.activo}
                        onChange={(e) => actualizar("activo", e.target.checked)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="servicio-activo"
                      >
                        Activo
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  className="btn btn-primary fc-catalog-save"
                  type="submit"
                  disabled={guardando}
                >
                  <IconoCostura tipo="puntada" size={19} />{" "}
                  {guardando
                    ? "Guardando…"
                    : edicion === null
                      ? "Guardar servicio"
                      : "Guardar cambios"}
                </button>
                {edicion !== null && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => {
                      setFormulario(formularioVacio);
                      setEdicion(null);
                    }}
                  >
                    <IconoCostura tipo="tijeras" size={17} /> Cancelar edición
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        <section
          className="card shadow-sm border-0 fc-catalog-panel fc-catalog-list"
          aria-labelledby="list-title"
        >
          <div className="card-body p-3 p-lg-4">
            <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
              <div className="fc-list-title">
                <span className="fc-catalog-panel__seal fc-catalog-panel__seal--small">
                  <IconoCostura tipo="tijeras" size={24} />
                </span>
                <span>
                  <h2 id="list-title">Tu catálogo</h2>
                  <small>{total} servicios registrados</small>
                </span>
              </div>
              <button
                className="btn btn-outline-primary btn-sm fc-refresh-button"
                type="button"
                onClick={() => void cargar()}
                disabled={cargando}
              >
                <IconoCostura tipo="puntada" size={17} /> Actualizar
              </button>
            </div>
            {cargando ? (
              <p aria-live="polite">Cargando catálogo…</p>
            ) : servicios.length === 0 ? (
              <div className="fc-empty-state mb-0">
                <span className="fc-empty-state__icon">
                  <IconoCostura tipo="carrete" size={42} />
                </span>
                <h3>Empieza tu colección de servicios</h3>
                <p>
                  Añade los trabajos del taller. Los precios pueden quedar
                  pendientes hasta que los apruebes.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fc-service-table">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Categoría</th>
                      <th>Unidad</th>
                      <th>Tarifa base</th>
                      <th>Estado</th>
                      <th>
                        <span className="visually-hidden">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicios.map((servicio) => (
                      <tr key={servicio.id} className="fc-service-row">
                        <td data-label="Servicio">
                          <div className="fc-service-ident">
                            <span className="fc-service-ident__icon">
                              <IconoCostura
                                tipo={
                                  servicio.requiere_valoracion
                                    ? "aguja"
                                    : "carrete"
                                }
                                size={27}
                              />
                            </span>
                            <span>
                              <strong>{servicio.nombre}</strong>
                              <code>{servicio.codigo}</code>
                            </span>
                          </div>
                        </td>
                        <td data-label="Categoría">
                          <span className="fc-category-pill">
                            <IconoCostura tipo="puntada" size={16} />
                            {servicio.categoria}
                          </span>
                        </td>
                        <td data-label="Unidad">
                          <span className="fc-unit-pill">
                            <IconoCostura tipo="cinta" size={15} />
                            {servicio.unidad}
                          </span>
                        </td>
                        <td data-label="Tarifa base">
                          {servicio.tarifa_base === null ? (
                            <span className="badge rounded-pill fc-status-pending fc-price-pending">
                              <IconoCostura tipo="aguja" size={15} />
                              {servicio.requiere_valoracion
                                ? "Requiere valoración manual"
                                : "Pendiente de configurar"}
                            </span>
                          ) : (
                            <span className="fc-price-value">
                              <span>$</span>
                              {servicio.tarifa_base}
                              <small>USD</small>
                            </span>
                          )}
                        </td>
                        <td data-label="Estado">
                          <span
                            className={`badge rounded-pill fc-service-status ${servicio.activo ? "fc-status-active" : "fc-status-pending"}`}
                          >
                            <span className="fc-status-dot" />
                            {servicio.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td data-label="Acciones">
                          <div className="d-flex flex-wrap gap-2 fc-service-actions">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              type="button"
                              onClick={() => editar(servicio)}
                            >
                              <IconoCostura tipo="aguja" size={16} />
                              Editar
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              type="button"
                              onClick={() => void cambiarActivo(servicio)}
                            >
                              <IconoCostura tipo="puntada" size={16} />
                              {servicio.activo ? "Desactivar" : "Activar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="fc-catalog-pagination mt-3">
              <button
                className="btn btn-outline-secondary btn-sm"
                type="button"
                disabled={pagina <= 1 || cargando}
                onClick={() => setPagina((actual) => actual - 1)}
              >
                <span aria-hidden="true">←</span> Anterior
              </button>
              <span className="fc-page-number">
                <IconoCostura tipo="puntada" size={17} /> Página {pagina}
              </span>
              <button
                className="btn btn-outline-secondary btn-sm"
                type="button"
                disabled={pagina * 20 >= total || cargando}
                onClick={() => setPagina((actual) => actual + 1)}
              >
                Siguiente <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
