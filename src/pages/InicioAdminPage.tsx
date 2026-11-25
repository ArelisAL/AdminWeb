import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listarPedidosActivos,
  listarServiciosCatalogo,
  listarTelasBajoStock,
  listarUsuarios,
} from "../api/client";
import IconoCostura from "../components/IconoCostura";

type Resumen = {
  pedidos: number;
  equipo: number;
  alertas: number;
  servicios: number;
};

const accesos = [
  {
    ruta: "/usuarios",
    titulo: "Equipo",
    texto: "Crea y administra las cuentas del taller.",
    icono: "aguja" as const,
  },
  {
    ruta: "/pedidos",
    titulo: "Producción",
    texto: "Asigna pedidos y revisa fechas de entrega.",
    icono: "tijeras" as const,
  },
  {
    ruta: "/inventario",
    titulo: "Inventario",
    texto: "Consulta telas y alertas de existencias.",
    icono: "cinta" as const,
  },
  {
    ruta: "/servicios",
    titulo: "Servicios",
    texto: "Configura el catálogo y tarifas aprobadas.",
    icono: "carrete" as const,
  },
  {
    ruta: "/pagos",
    titulo: "Pagos",
    texto: "Revisa pagos registrados y saldos disponibles.",
    icono: "puntada" as const,
  },
];

export default function InicioAdminPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
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

  const indicadores = [
    {
      etiqueta: "Pedidos activos",
      valor: resumen?.pedidos,
      icono: "tijeras" as const,
      tono: "blue",
    },
    {
      etiqueta: "Personas del equipo",
      valor: resumen?.equipo,
      icono: "aguja" as const,
      tono: "pink",
    },
    {
      etiqueta: "Alertas de inventario",
      valor: resumen?.alertas,
      icono: "cinta" as const,
      tono: "yellow",
    },
    {
      etiqueta: "Servicios registrados",
      valor: resumen?.servicios,
      icono: "carrete" as const,
      tono: "mint",
    },
  ];

  return (
    <main className="container py-4 fc-admin-home">
      <section
        className="fc-admin-welcome mb-4"
        aria-labelledby="admin-home-title"
      >
        <div>
          <span className="fc-admin-kicker">
            <IconoCostura tipo="puntada" size={18} /> PANEL DE TALLER
          </span>
          <h1 id="admin-home-title">Todo el taller, en orden.</h1>
          <p>
            Una vista rápida para organizar el equipo, la producción y los
            recursos de Fran-Costuras.
          </p>
        </div>
        <span className="fc-admin-welcome__art" aria-hidden="true">
          <IconoCostura tipo="tijeras" size={82} />
        </span>
      </section>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <section
        className="fc-admin-metrics mb-4"
        aria-label="Resumen del taller"
      >
        {indicadores.map((item) => (
          <article className="fc-admin-metric" key={item.etiqueta}>
            <span
              className={`fc-admin-metric__icon fc-admin-metric__icon--${item.tono}`}
            >
              <IconoCostura tipo={item.icono} size={25} />
            </span>
            <span>
              <small>{item.etiqueta}</small>
              <strong aria-live="polite">{item.valor ?? "—"}</strong>
            </span>
          </article>
        ))}
      </section>

      <div className="fc-admin-section-title">
        <div>
          <span className="fc-admin-kicker">ACCESOS DIRECTOS</span>
          <h2>¿Qué necesitas gestionar?</h2>
        </div>
        <span aria-hidden="true" className="fc-admin-stitch" />
      </div>
      <section
        className="fc-admin-shortcuts"
        aria-label="Módulos de administración"
      >
        {accesos.map((item) => (
          <Link className="fc-admin-shortcut" key={item.ruta} to={item.ruta}>
            <span className="fc-admin-shortcut__icon">
              <IconoCostura tipo={item.icono} size={27} />
            </span>
            <span className="fc-admin-shortcut__copy">
              <strong>{item.titulo}</strong>
              <small>{item.texto}</small>
            </span>
            <span className="fc-admin-shortcut__arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
