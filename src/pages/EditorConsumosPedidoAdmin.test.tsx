// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listarOpcionesTelaConsumo,
  registrarConsumosPedido,
} from "../api/client";
import EditorConsumosPedidoAdmin from "./EditorConsumosPedidoAdmin";

vi.mock("../api/client", () => ({
  listarOpcionesTelaConsumo: vi.fn(),
  registrarConsumosPedido: vi.fn(),
  mensajeError: vi.fn(() => "Error de prueba"),
}));

const telasApi = vi.mocked(listarOpcionesTelaConsumo);
const guardarApi = vi.mocked(registrarConsumosPedido);

describe("EditorConsumosPedidoAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    telasApi.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 4,
          nombre: "Lino",
          color: "Crema",
          metros_disponibles: "6.00",
        },
      ],
    });
    guardarApi.mockResolvedValue();
  });

  it("permite a la administradora capturar consumos antes de confirmar el estado", async () => {
    const alGuardar = vi.fn().mockResolvedValue(undefined);
    render(
      <EditorConsumosPedidoAdmin codigo="FC-0002" alGuardar={alGuardar} />,
    );

    fireEvent.change(await screen.findByLabelText("Tela"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("Metros"), {
      target: { value: "2.25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar consumos" }));

    expect((await screen.findByRole("status")).textContent).toContain(
      "El inventario se descuenta al confirmar el inicio.",
    );
    expect(guardarApi).toHaveBeenCalledWith("FC-0002", [
      { tela: 4, metros_usados: "2.25" },
    ]);
    expect(alGuardar).toHaveBeenCalledOnce();
  });
});
