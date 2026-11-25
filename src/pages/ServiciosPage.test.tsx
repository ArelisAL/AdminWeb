import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ServiciosPage from "./ServiciosPage";
import type { Pagina, ServicioCatalogo } from "../api/client";

const {
  crearServicioCatalogo,
  editarServicioCatalogo,
  listarServiciosCatalogo,
} = vi.hoisted(() => ({
  crearServicioCatalogo: vi.fn(),
  editarServicioCatalogo: vi.fn(),
  listarServiciosCatalogo: vi.fn(),
}));

vi.mock("../api/client", () => ({
  crearServicioCatalogo,
  editarServicioCatalogo,
  listarServiciosCatalogo,
  mensajeError: (error: unknown) =>
    error instanceof Error ? error.message : "Error de prueba",
}));

const servicio: ServicioCatalogo = {
  id: 4,
  codigo: "SERV-001",
  nombre: "Servicio de prueba",
  categoria: "Arreglos",
  descripcion: "",
  unidad: "prenda",
  tarifa_base: null,
  requiere_valoracion: false,
  configuracion_pendiente: true,
  activo: false,
  creado_en: "2026-11-25T10:00:00Z",
  actualizado_en: "2026-11-25T10:00:00Z",
};

const pagina = (results: ServicioCatalogo[]): Pagina<ServicioCatalogo> => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

describe("ServiciosPage — catálogo administrable A2.1", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarServiciosCatalogo.mockResolvedValue(pagina([]));
  });

  afterEach(cleanup);

  it("crea un servicio sin asignar tarifa ni activarlo silenciosamente", async () => {
    render(<ServiciosPage />);
    fireEvent.change(screen.getByLabelText("Código"), {
      target: { value: "SERV-002" },
    });
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Servicio sin precio" },
    });
    fireEvent.change(screen.getByLabelText("Categoría"), {
      target: { value: "Prueba" },
    });
    fireEvent.change(screen.getByLabelText("Unidad"), {
      target: { value: "prenda" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar servicio" }));

    await waitFor(() => expect(crearServicioCatalogo).toHaveBeenCalledOnce());
    expect(crearServicioCatalogo).toHaveBeenCalledWith(
      expect.objectContaining({
        tarifa_base: null,
        activo: false,
        requiere_valoracion: false,
      }),
    );
    expect((await screen.findByRole("status")).textContent).toContain(
      "Servicio creado",
    );
  });

  it("informa errores del Backend al intentar activar un servicio incompleto", async () => {
    listarServiciosCatalogo.mockResolvedValue(pagina([servicio]));
    editarServicioCatalogo.mockRejectedValue(
      new Error("No se puede activar: la tarifa sigue pendiente."),
    );
    render(<ServiciosPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Activar" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "la tarifa sigue pendiente",
    );
  });

  it("edita la tarifa solo con el valor escrito expresamente", async () => {
    const user = userEvent.setup();
    listarServiciosCatalogo.mockResolvedValue(pagina([servicio]));
    render(<ServiciosPage />);
    const fila = await screen.findByText("SERV-001");
    await user.click(
      within(fila.closest("tr") as HTMLElement).getByRole("button", {
        name: "Editar",
      }),
    );
    const inputTarifa = screen.getByLabelText(
      "Tarifa base (USD)",
    ) as HTMLInputElement;
    await user.type(inputTarifa, "12.50");
    expect(inputTarifa.value).toBe("12.50");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(editarServicioCatalogo).toHaveBeenCalledWith(
        servicio.id,
        expect.objectContaining({ tarifa_base: "12.50" }),
      ),
    );
  });
});
// @vitest-environment jsdom
