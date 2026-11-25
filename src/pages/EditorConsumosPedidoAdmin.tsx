import { useEffect, useState, type FormEvent } from "react";
import {
  listarOpcionesTelaConsumo,
  registrarConsumosPedido,
  mensajeError,
  type OpcionTelaConsumo,
} from "../api/client";

type FilaConsumo = { tela: string; metros: string };

export default function EditorConsumosPedidoAdmin({
  codigo,
  alGuardar,
}: {
  codigo: string;
  alGuardar: () => Promise<void>;
}) {
  const [telas, setTelas] = useState<OpcionTelaConsumo[]>([]);
  const [filas, setFilas] = useState<FilaConsumo[]>([{ tela: "", metros: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    listarOpcionesTelaConsumo()
      .then((pagina) => {
        if (vigente) setTelas(pagina.results);
      })
      .catch((e: unknown) => {
        if (vigente) setError(mensajeError(e));
      });
    return () => {
      vigente = false;
    };
  }, []);

  function editar(indice: number, campo: keyof FilaConsumo, valor: string) {
    setFilas((actuales) =>
      actuales.map((fila, i) =>
        i === indice ? { ...fila, [campo]: valor } : fila,
      ),
    );
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    setGuardando(true);
    try {
      await registrarConsumosPedido(
        codigo,
        filas.map((fila) => ({
          tela: Number(fila.tela),
          metros_usados: fila.metros,
        })),
      );
      await alGuardar();
      setFilas([{ tela: "", metros: "" }]);
      setMensaje(
        "Consumos guardados. El inventario se descuenta al confirmar el inicio.",
      );
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="border rounded p-3 mt-3" onSubmit={(e) => void guardar(e)}>
      <h3 className="h6">Capturar o actualizar consumos</h3>
      <p className="small text-muted">
        Guardar otra vez sustituye la propuesta pendiente y conserva el
        historial. No descuenta tela todavía.
      </p>
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
      {filas.map((fila, indice) => (
        <div className="row g-2 mb-2" key={indice}>
          <div className="col-12 col-md-7">
            <label
              className="form-label"
              htmlFor={`tela-admin-${codigo}-${indice}`}
            >
              Tela
            </label>
            <select
              id={`tela-admin-${codigo}-${indice}`}
              className="form-select"
              required
              value={fila.tela}
              onChange={(e) => editar(indice, "tela", e.target.value)}
            >
              <option value="">Selecciona tela</option>
              {telas.map((tela) => (
                <option key={tela.id} value={tela.id}>
                  {tela.nombre} · {tela.color} · {tela.metros_disponibles} m
                  disponibles
                </option>
              ))}
            </select>
          </div>
          <div className="col-8 col-md-3">
            <label
              className="form-label"
              htmlFor={`metros-admin-${codigo}-${indice}`}
            >
              Metros
            </label>
            <input
              id={`metros-admin-${codigo}-${indice}`}
              className="form-control"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={fila.metros}
              onChange={(e) => editar(indice, "metros", e.target.value)}
            />
          </div>
          <div className="col-4 col-md-2 d-flex align-items-end">
            <button
              type="button"
              className="btn btn-outline-danger w-100"
              disabled={filas.length === 1}
              onClick={() =>
                setFilas((actuales) => actuales.filter((_, i) => i !== indice))
              }
            >
              Quitar
            </button>
          </div>
        </div>
      ))}
      {telas.length === 0 && <p>No hay telas disponibles en el inventario.</p>}
      <div className="d-flex flex-wrap gap-2 mt-3">
        <button
          className="btn btn-outline-primary"
          type="button"
          onClick={() =>
            setFilas((actuales) => [...actuales, { tela: "", metros: "" }])
          }
        >
          Agregar tela
        </button>
        <button
          className="btn btn-primary"
          disabled={guardando || telas.length === 0}
        >
          {guardando ? "Guardando…" : "Guardar consumos"}
        </button>
      </div>
    </form>
  );
}
