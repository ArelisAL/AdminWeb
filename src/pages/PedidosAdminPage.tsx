import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  cambiarFechaEntrega,
  listarPedidosActivos,
  listarUsuarios,
  guardarNotaInterna,
  mensajeError,
  type PedidoAdmin,
  type UsoTelaPedidoAdmin,
  type Usuario,
  asignarCosturera,
  listarConsumosPedido,
  confirmarInicioPedido,
} from "../api/client";
import EditorConsumosPedidoAdmin from "./EditorConsumosPedidoAdmin";

function fechaLocal() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
  }).format(new Date());
}

export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [costureras, setCostureras] = useState<Usuario[]>([]);
  const [asignaciones, setAsignaciones] = useState<Record<number, string>>({});
  const [pagina, setPagina] = useState(1);
  const [fechas, setFechas] = useState<Record<number, string>>({});
  const [notas, setNotas] = useState<Record<number, string>>({});
  const [pedidoConsumosAbierto, setPedidoConsumosAbierto] = useState<
    string | null
  >(null);
  const [consumos, setConsumos] = useState<
    Record<string, UsoTelaPedidoAdmin[]>
  >({});
  const [cargandoConsumos, setCargandoConsumos] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await listarPedidosActivos(pagina);
      setPedidos(datos.results);
      setTotal(datos.count);
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
    listarUsuarios(1, "costurera")
      .then((datos) =>
        setCostureras(datos.results.filter((usuario) => usuario.activo)),
      )
      .catch((e: unknown) => setError(mensajeError(e)));
  }, []);

  async function guardar(event: FormEvent, pedido: PedidoAdmin) {
    event.preventDefault();
    setError(null);
    setMensaje(null);
    try {
      const actualizado = await cambiarFechaEntrega(
        pedido.codigo,
        fechas[pedido.id] || pedido.fecha_entrega,
      );
      setPedidos((lista) =>
        lista.map((item) =>
          item.id === pedido.id
            ? { ...item, fecha_entrega: actualizado.fecha_entrega }
            : item,
        ),
      );
      setMensaje(`Fecha de entrega actualizada para ${pedido.codigo}.`);
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  async function asignar(pedido: PedidoAdmin) {
    const costurera = asignaciones[pedido.id];
    if (!costurera) return;
    setError(null);
    setMensaje(null);
    try {
      const actualizado = await asignarCosturera(
        pedido.codigo,
        Number(costurera),
      );
      setPedidos((lista) =>
        lista.map((item) =>
          item.id === pedido.id
            ? {
                ...item,
                costurera: actualizado.costurera,
                costurera_nombre: actualizado.costurera_nombre,
              }
            : item,
        ),
      );
      setMensaje(
        `Pedido ${pedido.codigo} asignado a ${actualizado.costurera_nombre}.`,
      );
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  async function guardarNota(event: FormEvent, pedido: PedidoAdmin) {
    event.preventDefault();
    setError(null);
    setMensaje(null);
    try {
      const actualizado = await guardarNotaInterna(
        pedido.codigo,
        notas[pedido.id] ?? pedido.nota_interna,
      );
      setPedidos((lista) =>
        lista.map((item) =>
          item.id === pedido.id
            ? { ...item, nota_interna: actualizado.nota_interna }
            : item,
        ),
      );
      setNotas((actual) => ({
        ...actual,
        [pedido.id]: actualizado.nota_interna,
      }));
      setMensaje(`Nota interna guardada para ${pedido.codigo}.`);
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  async function verConsumos(pedido: PedidoAdmin) {
    if (pedidoConsumosAbierto === pedido.codigo) {
      setPedidoConsumosAbierto(null);
      return;
    }
    setPedidoConsumosAbierto(pedido.codigo);
    setCargandoConsumos(pedido.codigo);
    setError(null);
    try {
      const pagina = await listarConsumosPedido(pedido.codigo);
      setConsumos((actuales) => ({
        ...actuales,
        [pedido.codigo]: pagina.results,
      }));
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargandoConsumos(null);
    }
  }

  async function confirmarInicio(pedido: PedidoAdmin) {
    setError(null);
    setMensaje(null);
    try {
      await confirmarInicioPedido(pedido.codigo);
      setMensaje(`Pedido ${pedido.codigo} pasó a En proceso.`);
      setPedidoConsumosAbierto(null);
      setConsumos((actuales) => ({
        ...actuales,
        [pedido.codigo]: (actuales[pedido.codigo] ?? []).map((uso) =>
          uso.vigente ? { ...uso, confirmado: true } : uso,
        ),
      }));
      await cargar();
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  return (
    <main className="container py-4">
      <h1 className="h2 mb-3" style={{ color: "var(--fc-titulo)" }}>
        Fechas de entrega
      </h1>
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
      <section className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="h5" style={{ color: "var(--fc-titulo)" }}>
            Pedidos activos ({total})
          </h2>
          {cargando ? (
            <p aria-live="polite">Cargando pedidos…</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Prenda</th>
                    <th>Fecha de entrega</th>
                    <th>Costurera asignada</th>
                    <th>Nota interna</th>
                    <th>Estado</th>
                    <th>Producción</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <Fragment key={pedido.id}>
                      <tr>
                        <td>{pedido.codigo}</td>
                        <td>{pedido.cliente_nombre}</td>
                        <td>{pedido.prenda_nombre}</td>
                        <td>
                          <form
                            className="d-flex flex-column flex-sm-row gap-2"
                            onSubmit={(e) => void guardar(e, pedido)}
                          >
                            <label
                              className="visually-hidden"
                              htmlFor={`fecha-${pedido.id}`}
                            >
                              Fecha para {pedido.codigo}
                            </label>
                            <input
                              id={`fecha-${pedido.id}`}
                              type="date"
                              min={fechaLocal()}
                              required
                              className="form-control"
                              value={fechas[pedido.id] ?? pedido.fecha_entrega}
                              onChange={(e) =>
                                setFechas((actual) => ({
                                  ...actual,
                                  [pedido.id]: e.target.value,
                                }))
                              }
                            />
                            <button className="btn btn-primary">Guardar</button>
                          </form>
                        </td>
                        <td>
                          {pedido.costurera_nombre ?? (
                            <div className="d-flex flex-column gap-2">
                              <label
                                className="visually-hidden"
                                htmlFor={`costurera-${pedido.id}`}
                              >
                                Costurera para {pedido.codigo}
                              </label>
                              <select
                                id={`costurera-${pedido.id}`}
                                className="form-select"
                                value={asignaciones[pedido.id] ?? ""}
                                onChange={(e) =>
                                  setAsignaciones((actual) => ({
                                    ...actual,
                                    [pedido.id]: e.target.value,
                                  }))
                                }
                              >
                                <option value="">Selecciona</option>
                                {costureras.map((usuario) => (
                                  <option key={usuario.id} value={usuario.id}>
                                    {usuario.nombre}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="btn btn-outline-primary"
                                disabled={!asignaciones[pedido.id]}
                                onClick={() => void asignar(pedido)}
                              >
                                Asignar
                              </button>
                            </div>
                          )}
                        </td>
                        <td>
                          <form
                            className="d-flex flex-column gap-2"
                            onSubmit={(e) => void guardarNota(e, pedido)}
                          >
                            <label
                              className="visually-hidden"
                              htmlFor={`nota-${pedido.id}`}
                            >
                              Nota interna para {pedido.codigo}
                            </label>
                            <textarea
                              id={`nota-${pedido.id}`}
                              className="form-control"
                              rows={2}
                              maxLength={5000}
                              value={
                                notas[pedido.id] ?? pedido.nota_interna ?? ""
                              }
                              onChange={(e) =>
                                setNotas((actual) => ({
                                  ...actual,
                                  [pedido.id]: e.target.value,
                                }))
                              }
                            />
                            <button className="btn btn-outline-primary">
                              Guardar nota
                            </button>
                          </form>
                        </td>
                        <td>{pedido.estado}</td>
                        <td>
                          {pedido.estado === "PENDIENTE" && (
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => void verConsumos(pedido)}
                            >
                              {pedidoConsumosAbierto === pedido.codigo
                                ? "Ocultar consumos"
                                : "Revisar consumos"}
                            </button>
                          )}
                        </td>
                      </tr>
                      {pedidoConsumosAbierto === pedido.codigo && (
                        <tr>
                          <td colSpan={8}>
                            {cargandoConsumos === pedido.codigo ? (
                              <p aria-live="polite">Cargando consumos…</p>
                            ) : (
                              <>
                                {(consumos[pedido.codigo] ?? []).length ===
                                0 ? (
                                  <p>
                                    Recepción todavía no ha registrado consumos
                                    para este pedido.
                                  </p>
                                ) : (
                                  <ul className="list-group mb-3">
                                    {(consumos[pedido.codigo] ?? []).map(
                                      (uso) => (
                                        <li
                                          className="list-group-item"
                                          key={uso.id}
                                        >
                                          {uso.tela_nombre} ({uso.tela_color}) ·{" "}
                                          {uso.metros_usados} m
                                          {uso.registrado_por_nombre
                                            ? ` · Capturó: ${uso.registrado_por_nombre}`
                                            : ""}
                                          {!uso.vigente &&
                                            " · Registro reemplazado"}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                )}
                                {pedido.estado === "PENDIENTE" && (
                                  <EditorConsumosPedidoAdmin
                                    codigo={pedido.codigo}
                                    alGuardar={async () => {
                                      const pagina = await listarConsumosPedido(
                                        pedido.codigo,
                                      );
                                      setConsumos((actuales) => ({
                                        ...actuales,
                                        [pedido.codigo]: pagina.results,
                                      }));
                                    }}
                                  />
                                )}
                                {(consumos[pedido.codigo] ?? []).some(
                                  (uso) => uso.vigente && !uso.confirmado,
                                ) && (
                                  <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={() => void confirmarInicio(pedido)}
                                  >
                                    Confirmar «En proceso» y descontar
                                    inventario
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!cargando && pedidos.length === 0 && <p>No hay pedidos activos.</p>}
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
