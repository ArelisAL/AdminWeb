import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  anularPago,
  listarPagosPedido,
  listarPedidosParaPagos,
  mensajeError,
  registrarPagoPedido,
  type Pago,
  type PedidoAdmin,
} from "../api/client";
import EncabezadoPagina from "../components/EncabezadoPagina";
import IconoFC from "../components/IconoFC";
import InsigniaEstado from "../components/InsigniaEstado";

export default function PagosPage() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [pedido, setPedido] = useState<PedidoAdmin | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [saldo, setSaldo] = useState("0.00");
  const [monto, setMonto] = useState("");
  const [paginaPagos, setPaginaPagos] = useState(1);
  const [totalPagos, setTotalPagos] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const solicitudPago = useRef(0);

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    try {
      const resultado = await listarPedidosParaPagos(pagina);
      setPedidos(resultado.results);
      setTotal(resultado.count);
      setError(null);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [pagina]);

  useEffect(() => {
    void cargarPedidos();
  }, [cargarPedidos]);

  async function seleccionar(pedidoActual: PedidoAdmin) {
    const solicitud = ++solicitudPago.current;
    setPedido(pedidoActual);
    setPagos([]);
    setSaldo("0.00");
    setMonto("");
    setPaginaPagos(1);
    setTotalPagos(0);
    setError(null);
    setMensaje(null);
    setProcesando(true);
    try {
      const resultado = await listarPagosPedido(pedidoActual.codigo);
      if (solicitud !== solicitudPago.current) return;
      setPagos(resultado.results);
      setSaldo(resultado.saldo);
      setTotalPagos(resultado.count);
    } catch (e) {
      if (solicitud === solicitudPago.current) setError(mensajeError(e));
    } finally {
      if (solicitud === solicitudPago.current) setProcesando(false);
    }
  }

  async function recargarPagos(
    codigo: string,
    numeroPagina: number,
    solicitud: number,
  ) {
    const resultado = await listarPagosPedido(codigo, numeroPagina);
    if (solicitud !== solicitudPago.current) return;
    setPagos(resultado.results);
    setSaldo(resultado.saldo);
    setTotalPagos(resultado.count);
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!pedido) return;
    const pedidoCodigo = pedido.codigo;
    const solicitud = solicitudPago.current;
    setError(null);
    setMensaje(null);
    setProcesando(true);
    try {
      await registrarPagoPedido(pedidoCodigo, monto);
      await recargarPagos(pedidoCodigo, paginaPagos, solicitud);
      if (solicitud !== solicitudPago.current) return;
      setMonto("");
      setMensaje(`Abono registrado para ${pedido.codigo}.`);
    } catch (e) {
      if (solicitud === solicitudPago.current) setError(mensajeError(e));
    } finally {
      if (solicitud === solicitudPago.current) setProcesando(false);
    }
  }

  async function anular(pago: Pago) {
    if (
      !window.confirm(`¿Anular el abono de $${Number(pago.monto).toFixed(2)}?`)
    )
      return;
    const codigoSeleccionado = pedido?.codigo;
    if (!codigoSeleccionado) return;
    const solicitud = solicitudPago.current;
    setError(null);
    setMensaje(null);
    setProcesando(true);
    try {
      await anularPago(pago.id);
      await recargarPagos(codigoSeleccionado, paginaPagos, solicitud);
      if (solicitud !== solicitudPago.current) return;
      setMensaje("Abono anulado. El registro se conserva en el historial.");
    } catch (e) {
      if (solicitud === solicitudPago.current) setError(mensajeError(e));
    } finally {
      if (solicitud === solicitudPago.current) setProcesando(false);
    }
  }

  async function cambiarPaginaPagos(numero: number) {
    if (!pedido || numero < 1) return;
    const solicitud = solicitudPago.current;
    try {
      const resultado = await listarPagosPedido(pedido.codigo, numero);
      if (solicitud !== solicitudPago.current) return;
      setPagos(resultado.results);
      setSaldo(resultado.saldo);
      setTotalPagos(resultado.count);
      setPaginaPagos(numero);
    } catch (e) {
      if (solicitud === solicitudPago.current) setError(mensajeError(e));
    }
  }

  return (
    <main className="fc-page">
      <EncabezadoPagina etiqueta="PAGOS" titulo="Pagos y saldos" />
      {error && (
        <div className="alert alert-danger fc-alert" role="alert">
          <IconoFC nombre="alerta" size={18} />
          <span>{error}</span>
        </div>
      )}
      {mensaje && (
        <div className="alert alert-success fc-alert" role="status">
          <IconoFC nombre="cheque" size={18} />
          <span>{mensaje}</span>
        </div>
      )}
      <div className="fc-split fc-split--wide">
        <section className="fc-split__main" aria-labelledby="pagos-pedidos">
          <div className="fc-table-card">
            <h2 id="pagos-pedidos" className="fc-table-card__title">
              Pedidos ({total})
            </h2>
            {cargando ? (
              <p className="fc-table-card__empty" aria-live="polite">
                Cargando pedidos…
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table fc-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Prenda</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Pagos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((item) => (
                      <tr
                        key={item.id}
                        className={pedido?.id === item.id ? "is-selected" : ""}
                      >
                        <td>
                          <strong>{item.codigo}</strong>
                        </td>
                        <td>{item.cliente_nombre}</td>
                        <td>{item.prenda_nombre}</td>
                        <td>${Number(item.total).toFixed(2)}</td>
                        <td>
                          <InsigniaEstado estado={item.estado} />
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary fc-btn-icon"
                            aria-pressed={pedido?.id === item.id}
                            onClick={() => void seleccionar(item)}
                          >
                            <IconoFC nombre="pagos" size={16} />
                            Ver saldo
                          </button>
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
              onClick={() => setPagina((actual) => actual - 1)}
            >
              Anterior
            </button>
            <span className="fc-pagination__current">
              Página {pagina} de {Math.max(1, Math.ceil(total / 20))}
            </span>
            <button
              className="fc-link-btn"
              disabled={pagina >= Math.ceil(total / 20) || cargando}
              onClick={() => setPagina((actual) => actual + 1)}
            >
              Siguiente
            </button>
          </div>
        </section>
        {pedido && (
          <section
            className="fc-panel fc-split__side"
            aria-labelledby="pago-detalle"
          >
            <h2 id="pago-detalle" className="fc-panel__title">
              <IconoFC nombre="pagos" size={20} /> {pedido.codigo} ·{" "}
              {pedido.cliente_nombre}
            </h2>
            <p className="fc-balance">
              <span className="fc-balance__item">
                Total: ${Number(pedido.total).toFixed(2)}
              </span>
              <span className="fc-balance__item fc-balance__item--saldo">
                Saldo pendiente: ${Number(saldo).toFixed(2)}
              </span>
            </p>
            <h3 className="fc-panel__subheading">Historial de abonos</h3>
            {pagos.length === 0 ? (
              <p className="fc-small">No hay abonos registrados.</p>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table fc-table fc-table--compact align-middle">
                    <thead>
                      <tr>
                        <th>Monto</th>
                        <th>Fecha</th>
                        <th>Registrado por</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map((pago) => (
                        <tr
                          key={pago.id}
                          className={pago.anulado ? "is-void" : ""}
                        >
                          <td>
                            <strong>${Number(pago.monto).toFixed(2)}</strong>
                          </td>
                          <td>
                            {new Date(pago.fecha).toLocaleString("es-EC")}
                          </td>
                          <td>{pago.registrado_por_nombre}</td>
                          <td>
                            <InsigniaEstado
                              tono={pago.anulado ? "error-borde" : "activo"}
                            >
                              {pago.anulado ? "Anulado" : "Vigente"}
                            </InsigniaEstado>
                          </td>
                          <td>
                            {!pago.anulado && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                disabled={procesando}
                                onClick={() => void anular(pago)}
                              >
                                Anular
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="fc-pagination">
                  <button
                    className="fc-link-btn"
                    disabled={paginaPagos <= 1}
                    onClick={() => void cambiarPaginaPagos(paginaPagos - 1)}
                  >
                    Anterior
                  </button>
                  <span className="fc-pagination__current">
                    Página {paginaPagos} de{" "}
                    {Math.max(1, Math.ceil(totalPagos / 20))}
                  </span>
                  <button
                    className="fc-link-btn"
                    disabled={paginaPagos >= Math.ceil(totalPagos / 20)}
                    onClick={() => void cambiarPaginaPagos(paginaPagos + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
            <div className="fc-panel__divider" />
            {Number(pedido.total) > 0 && Number(saldo) > 0 ? (
              <form className="fc-form" onSubmit={(e) => void guardar(e)}>
                <div>
                  <label className="form-label" htmlFor="pago-monto">
                    Nuevo abono
                  </label>
                  <input
                    id="pago-monto"
                    className="form-control"
                    type="number"
                    min="0.01"
                    max={saldo}
                    step="0.01"
                    required
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary w-100" disabled={procesando}>
                  {procesando ? "Guardando…" : "Registrar abono"}
                </button>
              </form>
            ) : (
              <p className="fc-note">
                <IconoFC nombre="alerta" size={18} />
                <span>
                  {Number(pedido.total) <= 0
                    ? "El total del pedido aún no está definido."
                    : "El pedido no tiene saldo pendiente."}
                </span>
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
