import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listarPedidosActivos,
  listarServiciosCatalogo,
  listarTelasBajoStock,
  listarUsuarios,
  type PedidoAdmin,
  type Tela,
} from "../api/client";
import EncabezadoPagina from "../components/EncabezadoPagina";
import IconoFC, { type NombreIconoFC } from "../components/IconoFC";
import InsigniaEstado from "../components/InsigniaEstado";

type Resumen = {
  pedidos: number;
  equipo: number;
  alertas: number;
  servicios: number;
};

const accesos: {
  ruta: string;
  titulo: string;
  texto: string;
  icono: NombreIconoFC;
  tono: string;
}[] = [
  {
    ruta: "/usuarios",
    titulo: "Equipo",
    texto: "Crea y administra las cuentas del taller.",
    icono: "equipo",
    tono: "celeste",
  },
  {
    ruta: "/pedidos",
    titulo: "Producción",
    texto: "Asigna pedidos y revisa fechas de entrega.",
    icono: "tijeras",
    tono: "rosa",
  },
  {
    ruta: "/inventario",
    titulo: "Inventario",
    texto: "Consulta telas y alertas de existencias.",
    icono: "inventario",
    tono: "menta",
  },
  {
    ruta: "/servicios",
    titulo: "Servicios",
    texto: "Configura el catálogo y tarifas aprobadas.",
    icono: "servicios",
    tono: "amarillo",
  },
  {
    ruta: "/pagos",
    titulo: "Pagos",
    texto: "Revisa pagos registrados y saldos disponibles.",
    icono: "pagos",
    tono: "lila",
  },
];

const MESES = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

/* Solo presentación: separa «AAAA-MM-DD» en día y mes abreviado. */
function partesFecha(fecha: string) {
  const [, mes, dia] = fecha.split("-");
  return { dia: dia ?? "", mes: MESES[Number(mes) - 1] ?? "" };
}

export default function InicioAdminPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [telasBajas, setTelasBajas] = useState<Tela[]>([]);
  const [entregas, setEntregas] = useState<PedidoAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activa = true;
    Promise.all([
      listarPedidosActivos(),
      listarUsuarios(),
      listarTelasBajoStock(),
      listarServiciosCatalogo(),
    ])
      .then(([pedidos, equipo, alertas, servicios]) => {
        if (activa) {
          setResumen({
            pedidos: pedidos.count,
            equipo: equipo.count,
            alertas: alertas.count,
            servicios: servicios.count,
          });
          setTelasBajas(alertas.results.slice(0, 3));
          setEntregas(pedidos.results.slice(0, 3));
        }
      })
      .catch(() => {
        if (activa)
          setError(
            "No se pudo cargar el resumen del taller. Revisa la conexión e inténtalo de nuevo.",
          );
      });
    return () => {
      activa = false;
    };
  }, []);

  const indicadores: {
    etiqueta: string;
    valor?: number;
    icono: NombreIconoFC;
  }[] = [
    { etiqueta: "Pedidos activos", valor: resumen?.pedidos, icono: "tijeras" },
    {
      etiqueta: "Personas del equipo",
      valor: resumen?.equipo,
      icono: "equipo",
    },
    {
      etiqueta: "Servicios registrados",
      valor: resumen?.servicios,
      icono: "servicios",
    },
    {
      etiqueta: "Alertas de inventario",
      valor: resumen?.alertas,
      icono: "alerta",
    },
  ];

  return (
    <main className="fc-page fc-admin-home">
      <EncabezadoPagina
        id="admin-home-title"
        etiqueta="PANEL DE TALLER"
        titulo="Todo el taller, en orden."
        descripcion="Una vista rápida para organizar el equipo, la producción y los recursos de Fran-Costuras."
        acciones={
          <>
            <Link className="btn btn-outline-primary" to="/pedidos">
              Ver pedidos
            </Link>
            <Link className="btn btn-primary" to="/usuarios">
              Crear usuario
            </Link>
          </>
        }
      />

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <section className="fc-metrics" aria-label="Resumen del taller">
        {indicadores.map((item) => (
          <article className="fc-metric" key={item.etiqueta}>
            <span className="fc-metric__head">
              <span className="fc-bubble">
                <IconoFC nombre={item.icono} />
              </span>
              <small>{item.etiqueta}</small>
            </span>
            <strong aria-live="polite">{item.valor ?? "—"}</strong>
          </article>
        ))}
      </section>

      <div className="fc-admin-body">
        <section aria-labelledby="accesos-title">
          <p className="fc-eyebrow">ACCESOS DIRECTOS</p>
          <h2 id="accesos-title" className="fc-section-title">
            ¿Qué necesitas gestionar?
          </h2>
          <nav
            className="fc-admin-shortcuts"
            aria-label="Módulos de administración"
          >
            {accesos.map((item) => (
              <Link
                className="fc-admin-shortcut"
                key={item.ruta}
                to={item.ruta}
              >
                <span
                  className={`fc-bubble fc-bubble--lg fc-bubble--${item.tono}`}
                >
                  <IconoFC nombre={item.icono} size={22} />
                </span>
                <strong>{item.titulo}</strong>
                <small>{item.texto}</small>
                <span className="fc-admin-shortcut__go" aria-hidden="true">
                  Abrir módulo <IconoFC nombre="flecha" size={16} />
                </span>
              </Link>
            ))}
          </nav>
        </section>

        <aside className="fc-admin-side">
          <section className="fc-panel" aria-labelledby="stock-title">
            <h2 id="stock-title" className="fc-panel__title">
              <IconoFC nombre="alerta" size={20} /> Alertas de inventario
            </h2>
            {telasBajas.length > 0 && (
              <ul className="fc-list">
                {telasBajas.map((tela) => (
                  <li key={tela.id}>
                    <span className="fc-list__copy">
                      <strong>
                        {tela.nombre} · {tela.color}
                      </strong>
                      <small>
                        {tela.metros_disponibles} m · mínimo {tela.stock_minimo}{" "}
                        m
                      </small>
                    </span>
                    <InsigniaEstado tono="error">Stock bajo</InsigniaEstado>
                  </li>
                ))}
              </ul>
            )}
            <Link className="btn btn-outline-primary w-100" to="/inventario">
              Inventario
            </Link>
          </section>

          <section className="fc-panel" aria-labelledby="entregas-title">
            <h2 id="entregas-title" className="fc-panel__title">
              <IconoFC nombre="calendario" size={20} /> Fechas de entrega
            </h2>
            {entregas.length === 0 ? (
              <p className="mb-0">No hay pedidos activos.</p>
            ) : (
              <ul className="fc-list fc-list--lined">
                {entregas.map((pedido) => {
                  const fecha = partesFecha(pedido.fecha_entrega);
                  return (
                    <li key={pedido.id}>
                      <span className="fc-date-chip">
                        <strong>{fecha.dia}</strong>
                        <small>{fecha.mes}</small>
                      </span>
                      <span className="fc-list__copy">
                        <strong>
                          {pedido.codigo} · {pedido.prenda_nombre}
                        </strong>
                        <small>{pedido.cliente_nombre}</small>
                      </span>
                      <InsigniaEstado estado={pedido.estado} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
