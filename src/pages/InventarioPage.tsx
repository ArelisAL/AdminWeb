import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  crearTela,
  editarTela,
  listarTelas,
  listarTelasBajoStock,
  mensajeError,
  type Tela,
} from "../api/client";
import EncabezadoPagina from "../components/EncabezadoPagina";
import IconoFC from "../components/IconoFC";
import InsigniaEstado from "../components/InsigniaEstado";

export default function InventarioPage() {
  const [telas, setTelas] = useState<Tela[]>([]);
  const [alertas, setAlertas] = useState<Tela[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("");
  const [metros, setMetros] = useState("");
  const [precio, setPrecio] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [minimo, setMinimo] = useState("5");
  const [ajustes, setAjustes] = useState<Record<number, string>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [inventario, bajoStock] = await Promise.all([
        listarTelas(pagina),
        listarTelasBajoStock(),
      ]);
      setTelas(inventario.results);
      setTotal(inventario.count);
      setAlertas(bajoStock.results);
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

  async function guardar(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMensaje(null);
    try {
      await crearTela({
        nombre,
        color,
        metros_disponibles: metros,
        precio_metro: precio,
        proveedor,
        stock_minimo: minimo,
      });
      setNombre("");
      setColor("");
      setMetros("");
      setPrecio("");
      setProveedor("");
      setMinimo("5");
      setMensaje("Tela agregada al inventario.");
      await cargar();
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  async function guardarStock(tela: Tela) {
    const nuevo = ajustes[tela.id];
    if (!nuevo) return;
    setError(null);
    setMensaje(null);
    try {
      const actualizada = await editarTela(tela.id, {
        metros_disponibles: nuevo,
      });
      setTelas((lista) =>
        lista.map((item) => (item.id === tela.id ? actualizada : item)),
      );
      setAjustes((lista) => ({ ...lista, [tela.id]: "" }));
      setMensaje(`Stock actualizado para ${tela.nombre}.`);
      const bajoStock = await listarTelasBajoStock();
      setAlertas(bajoStock.results);
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  return (
    <main className="fc-page">
      <EncabezadoPagina etiqueta="INVENTARIO" titulo="Inventario de telas" />
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
      <section className="fc-metrics fc-metrics--2" aria-label="Inventario">
        <article className="fc-metric">
          <span className="fc-metric__head">
            <span className="fc-bubble">
              <IconoFC nombre="inventario" />
            </span>
            <small>Telas</small>
          </span>
          <strong>{total}</strong>
        </article>
        <article className="fc-metric">
          <span className="fc-metric__head">
            <span className="fc-bubble">
              <IconoFC nombre="alerta" />
            </span>
            <small>Stock bajo</small>
          </span>
          <strong>{alertas.length}</strong>
        </article>
      </section>
      {alertas.length > 0 && (
        <section className="fc-alert-panel" role="status">
          <IconoFC nombre="alerta" size={22} />
          <div>
            <h2>Stock bajo</h2>
            <ul className="mb-0">
              {alertas.map((tela) => (
                <li key={tela.id}>
                  {tela.nombre} ({tela.color}): {tela.metros_disponibles} m;
                  mínimo {tela.stock_minimo} m
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <div className="fc-split">
        <section className="fc-split__main" aria-labelledby="telas-lista">
          <div className="fc-table-card">
            <h2 id="telas-lista" className="fc-table-card__title">
              Telas ({total})
            </h2>
            {cargando ? (
              <p className="fc-table-card__empty" aria-live="polite">
                Cargando telas…
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table fc-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Tela</th>
                      <th>Color</th>
                      <th>Proveedor</th>
                      <th>Precio/m</th>
                      <th>Stock (m)</th>
                      <th>Mínimo (m)</th>
                      <th>Ajustar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telas.map((tela) => (
                      <tr key={tela.id}>
                        <td>
                          <strong>{tela.nombre}</strong>
                        </td>
                        <td>{tela.color}</td>
                        <td>{tela.proveedor}</td>
                        <td>{tela.precio_metro}</td>
                        <td>
                          {tela.stock_bajo ? (
                            <span className="fc-stock-low">
                              <strong>{tela.metros_disponibles}</strong>
                              <InsigniaEstado tono="error">
                                Stock bajo
                              </InsigniaEstado>
                            </span>
                          ) : (
                            tela.metros_disponibles
                          )}
                        </td>
                        <td>{tela.stock_minimo}</td>
                        <td>
                          <div className="fc-inline-form">
                            <label
                              className="visually-hidden"
                              htmlFor={`stock-${tela.id}`}
                            >
                              Nuevo stock para {tela.nombre}
                            </label>
                            <input
                              id={`stock-${tela.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-control form-control-sm"
                              value={ajustes[tela.id] ?? ""}
                              onChange={(e) =>
                                setAjustes((actual) => ({
                                  ...actual,
                                  [tela.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              className="btn btn-sm btn-outline-primary fc-btn-icon"
                              disabled={!ajustes[tela.id]}
                              onClick={() => void guardarStock(tela)}
                            >
                              <IconoFC nombre="editar" size={16} />
                              Guardar
                            </button>
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
          aria-labelledby="tela-form-title"
        >
          <h2 id="tela-form-title" className="fc-panel__heading">
            Agregar tela
          </h2>
          <form className="fc-form" onSubmit={(e) => void guardar(e)}>
            <div>
              <label className="form-label" htmlFor="tela-nombre">
                Nombre
              </label>
              <input
                id="tela-nombre"
                className="form-control"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                maxLength={120}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="tela-color">
                Color
              </label>
              <input
                id="tela-color"
                className="form-control"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
                maxLength={80}
              />
            </div>
            <div className="fc-form__row">
              <div>
                <label className="form-label" htmlFor="tela-metros">
                  Metros disponibles
                </label>
                <input
                  id="tela-metros"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={metros}
                  onChange={(e) => setMetros(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label" htmlFor="tela-precio">
                  Precio por metro
                </label>
                <input
                  id="tela-precio"
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="form-control"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="tela-proveedor">
                Proveedor
              </label>
              <input
                id="tela-proveedor"
                className="form-control"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                required
                maxLength={150}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="tela-minimo">
                Stock mínimo (m)
              </label>
              <input
                id="tela-minimo"
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                value={minimo}
                onChange={(e) => setMinimo(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary w-100">Agregar tela</button>
          </form>
        </section>
      </div>
    </main>
  );
}
