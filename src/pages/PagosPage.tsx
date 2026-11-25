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
    <main className="container py-4">
      <h1 className="h2 mb-3" style={{ color: "var(--fc-titulo)" }}>
        Pagos y saldos
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
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5" style={{ color: "var(--fc-titulo)" }}>
            Pedidos ({total})
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
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Pagos</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((item) => (
                    <tr key={item.id}>
                      <td>{item.codigo}</td>
                      <td>{item.cliente_nombre}</td>
                      <td>{item.prenda_nombre}</td>
                      <td>${Number(item.total).toFixed(2)}</td>
                      <td>{item.estado}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          aria-pressed={pedido?.id === item.id}
                          onClick={() => void seleccionar(item)}
                        >
                          Ver saldo
                        </button>
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
              onClick={() => setPagina((actual) => actual - 1)}
            >
              Anterior
            </button>
            <span>
              Página {pagina} de {Math.max(1, Math.ceil(total / 20))}
            </span>
            <button
              className="btn btn-outline-primary"
              disabled={pagina >= Math.ceil(total / 20) || cargando}
              onClick={() => setPagina((actual) => actual + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>
      {pedido && (
        <section className="card border-0 shadow-sm">
          <div className="card-body">
            <h2 className="h5" style={{ color: "var(--fc-titulo)" }}>
              {pedido.codigo} · {pedido.cliente_nombre}
            </h2>
            <p>
              Total: ${Number(pedido.total).toFixed(2)} · Saldo pendiente: $
              {Number(saldo).toFixed(2)}
            </p>
            {Number(pedido.total) > 0 && Number(saldo) > 0 ? (
              <form className="row g-2 mb-3" onSubmit={(e) => void guardar(e)}>
                <div className="col-12 col-sm-7 col-md-5">
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
                <div className="col-12 align-self-end">
                  <button className="btn btn-primary" disabled={procesando}>
                    {procesando ? "Guardando…" : "Registrar abono"}
                  </button>
                </div>
              </form>
            ) : (
              <p>
                {Number(pedido.total) <= 0
                  ? "El total del pedido aún no está definido."
                  : "El pedido no tiene saldo pendiente."}
              </p>
            )}
            <h3 className="h6">Historial de abonos</h3>
            {pagos.length === 0 ? (
              <p>No hay abonos registrados.</p>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table align-middle">
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
                        <tr key={pago.id}>
                          <td>${Number(pago.monto).toFixed(2)}</td>
                          <td>
                            {new Date(pago.fecha).toLocaleString("es-EC")}
                          </td>
                          <td>{pago.registrado_por_nombre}</td>
                          <td>{pago.anulado ? "Anulado" : "Vigente"}</td>
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
                <div className="d-flex justify-content-between align-items-center">
                  <button
                    className="btn btn-outline-primary"
                    disabled={paginaPagos <= 1}
                    onClick={() => void cambiarPaginaPagos(paginaPagos - 1)}
                  >
                    Anterior
                  </button>
                  <span>
                    Página {paginaPagos} de{" "}
                    {Math.max(1, Math.ceil(totalPagos / 20))}
                  </span>
                  <button
                    className="btn btn-outline-primary"
                    disabled={paginaPagos >= Math.ceil(totalPagos / 20)}
                    onClick={() => void cambiarPaginaPagos(paginaPagos + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
