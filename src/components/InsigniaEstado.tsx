import type { ReactNode } from "react";

/* Insignia de estado del diseño Figma (componente «Insignia de estado»).
 * Estados de pedido con la marca y texto gris violeta; rojo solo para stock
 * bajo y anulaciones (AGENTS.md §12.4). */
const TONOS: Record<string, string> = {
  PENDIENTE: "fc-badge--pendiente",
  EN_PROCESO: "fc-badge--proceso",
  TERMINADO: "fc-badge--terminado",
  ENTREGADO: "fc-badge--entregado",
};

export default function InsigniaEstado({
  estado,
  tono,
  children,
}: {
  estado?: string;
  tono?:
    | "pendiente"
    | "proceso"
    | "terminado"
    | "entregado"
    | "activo"
    | "inactivo"
    | "error"
    | "error-borde";
  children?: ReactNode;
}) {
  const clase = tono
    ? `fc-badge--${tono}`
    : (TONOS[estado ?? ""] ?? "fc-badge--inactivo");
  return (
    <span className={`fc-badge ${clase}`}>
      {children ?? (estado ?? "").replace(/_/g, " ")}
    </span>
  );
}
