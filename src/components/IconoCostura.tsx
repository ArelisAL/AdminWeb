import IconoFC, { type NombreIconoFC } from "./IconoFC";

type TipoIconoCostura = "tijeras" | "carrete" | "aguja" | "cinta" | "puntada";

interface IconoCosturaProps {
  tipo: TipoIconoCostura;
  className?: string;
  size?: number;
}

/* Alias histórico: ahora dibuja los íconos de trazo del diseño Figma. */
const EQUIVALENCIAS: Record<TipoIconoCostura, NombreIconoFC> = {
  tijeras: "tijeras",
  carrete: "carrete",
  aguja: "aguja",
  cinta: "inventario",
  puntada: "cheque",
};

export default function IconoCostura({
  tipo,
  className,
  size = 24,
}: IconoCosturaProps) {
  return (
    <IconoFC nombre={EQUIVALENCIAS[tipo]} size={size} className={className} />
  );
}
