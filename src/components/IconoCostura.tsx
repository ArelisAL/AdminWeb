type TipoIconoCostura = "tijeras" | "carrete" | "aguja" | "cinta" | "puntada";

interface IconoCosturaProps {
  tipo: TipoIconoCostura;
  className?: string;
  size?: number;
}

export default function IconoCostura({
  tipo,
  className,
  size = 24,
}: IconoCosturaProps) {
  const atributos = {
    "aria-hidden": true as const,
    className,
    fill: "none",
    height: size,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 48 48",
    width: size,
    focusable: false,
  };

  if (tipo === "tijeras") {
    return (
      <svg {...atributos}>
        <circle cx="11" cy="34" r="6" />
        <circle cx="11" cy="14" r="6" />
        <path d="m16 18 25 24M16 30l25-24M17 24h7" />
        <circle cx="27" cy="24" r="2" />
      </svg>
    );
  }

  if (tipo === "carrete") {
    return (
      <svg {...atributos}>
        <path d="M17 8h14l3 7-3 3v12l3 3-3 7H17l-3-7 3-3V18l-3-3 3-7Z" />
        <path d="M14 15h20M14 33h20M18 19h12M18 23h12M18 27h12" />
        <path d="M31 8c7 2 8 7 4 10" />
      </svg>
    );
  }

  if (tipo === "aguja") {
    return (
      <svg {...atributos}>
        <path d="m12 37 24-26 4 4-26 24-5 2 3-4Z" />
        <path d="m33 14 4 4M12 37c-5 3-2 8 2 6 3-2 1-5-2-6Z" />
        <path d="M10 42c-5 2-5 5-2 5" />
      </svg>
    );
  }

  if (tipo === "cinta") {
    return (
      <svg {...atributos}>
        <path d="M9 14a7 7 0 0 1 7-7h17a7 7 0 0 1 7 7v19a7 7 0 0 1-7 7H16a7 7 0 0 1-7-7V14Z" />
        <path d="M17 7v9m6-9v5m6-5v9m6-9v5M9 29h9m-9-6h5m-5 12h9" />
        <circle cx="29" cy="29" r="5" />
        <path d="M29 26v3l2 1" />
      </svg>
    );
  }

  return (
    <svg {...atributos}>
      <path strokeDasharray="2.5 4" d="M6 16h36M6 32h36" />
      <path d="m13 12 4 4-4 4m22 8-4 4 4 4" />
      <path d="M22 20v8m4-8v8" />
    </svg>
  );
}
