import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  crearTela,
  editarTela,
  listarTelas,
  listarTelasBajoStock,
  mensajeError,
  type Tela,
} from "../api/client";

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
    <main className="container py-4">
      <h1 className="h2 mb-3" style={{ color: "var(--fc-titulo)" }}>
        Inventario de telas
      </h1>
      {error && (
        <div
          className="alert"
          role="alert"
          style={{ backgroundColor: "var(--fc-error)", color: "#fff" }}
        >
          {error}
        </div>
      )}
      {mensaje && (
        <div className="alert alert-success" role="status">
          {mensaje}
        </div>
      )}
      {alertas.length > 0 && (
        <section
          className="alert"
          role="status"
          style={{ backgroundColor: "var(--fc-error)", color: "#fff" }}
        >
          <h2 className="h5">Stock bajo</h2>
          <ul className="mb-0">
            {alertas.map((tela) => (
              <li key={tela.id}>
                {tela.nombre} ({tela.color}): {tela.metros_disponibles} m;
                mínimo {tela.stock_minimo} m
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5" style={{ color: "var(--fc-titulo)" }}>
            Agregar tela
          </h2>
          <form className="row g-3" onSubmit={(e) => void guardar(e)}>
            <div className="col-12 col-md-6">
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
            <div className="col-12 col-md-6">
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
            <div className="col-12 col-md-6">
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
            <div className="col-12 col-md-6">
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
            <div className="col-12 col-md-6">
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
            <div className="col-12 col-md-6">
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
            <div className="col-12">
              <button className="btn btn-primary">Agregar tela</button>
            </div>
          </form>
        </div>
      </section>
      <section className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="h5" style={{ color: "var(--fc-titulo)" }}>
            Telas ({total})
          </h2>
          {cargando ? (
            <p aria-live="polite">Cargando telas…</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
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
                    <tr
                      key={tela.id}
                      style={
                        tela.stock_bajo
                          ? {
                              backgroundColor: "var(--fc-error)",
                              color: "#fff",
                            }
                          : undefined
                      }
                    >
                      <td>{tela.nombre}</td>
                      <td>{tela.color}</td>
                      <td>{tela.proveedor}</td>
                      <td>{tela.precio_metro}</td>
                      <td>{tela.metros_disponibles}</td>
                      <td>{tela.stock_minimo}</td>
                      <td>
                        <div className="d-flex flex-column flex-sm-row gap-2">
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
                            className="form-control"
                            value={ajustes[tela.id] ?? ""}
                            onChange={(e) =>
                              setAjustes((actual) => ({
                                ...actual,
                                [tela.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            className="btn btn-outline-primary"
                            disabled={!ajustes[tela.id]}
                            onClick={() => void guardarStock(tela)}
                          >
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
