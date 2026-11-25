// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import UsuariosPage from "./UsuariosPage";
import {
  crearUsuario,
  desactivarUsuario,
  editarUsuario,
  listarTelasBajoStock,
  listarUsuarios,
  type Usuario,
} from "../api/client";

vi.mock("../api/client", () => ({
  crearUsuario: vi.fn(),
  desactivarUsuario: vi.fn(),
  editarUsuario: vi.fn(),
  listarTelasBajoStock: vi.fn(),
  listarUsuarios: vi.fn(),
  mensajeError: (error: { response?: { data?: { detalle?: string } } }) =>
    error.response?.data?.detalle ?? "Error de API",
}));

const admin: Usuario = {
  id: 1,
  nombre: "Francisca",
  email: "admin@fran-costuras.test",
  rol: "administradora",
  activo: true,
  debe_cambiar_contraseña: false,
};
const recepcionista: Usuario = {
  id: 2,
  nombre: "María",
  email: "maria@fran-costuras.test",
  rol: "recepcionista",
  activo: true,
  debe_cambiar_contraseña: true,
};
const apiListarUsuarios = vi.mocked(listarUsuarios);
const apiTelasBajas = vi.mocked(listarTelasBajoStock);
const apiCrear = vi.mocked(crearUsuario);
const apiEditar = vi.mocked(editarUsuario);
const apiDesactivar = vi.mocked(desactivarUsuario);

function renderUsuarios() {
  return render(
    <MemoryRouter>
      <UsuariosPage actual={admin} />
    </MemoryRouter>,
  );
}

describe("UsuariosPage — administración de cuentas (M0)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiListarUsuarios.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [recepcionista],
    });
    apiTelasBajas.mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    apiCrear.mockResolvedValue({ ...recepcionista, id: 3 });
    apiEditar.mockResolvedValue({ ...recepcionista, nombre: "María Editada" });
    apiDesactivar.mockResolvedValue(undefined);
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("crea una cuenta con rol y contraseña temporal", async () => {
    const user = userEvent.setup();
    renderUsuarios();

    await user.type(screen.getByLabelText("Nombre"), "Costurera Ana");
    await user.type(screen.getByLabelText("Correo"), "ana@fran-costuras.test");
    await user.selectOptions(screen.getByLabelText("Rol"), "costurera");
    await user.type(screen.getByLabelText("Contraseña temporal"), "Fuerte_Clave_2030");
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    await waitFor(() =>
      expect(apiCrear).toHaveBeenCalledWith({
        nombre: "Costurera Ana",
        email: "ana@fran-costuras.test",
        rol: "costurera",
        password: "Fuerte_Clave_2030",
      }),
    );
    expect(
      await screen.findByText(/Debe cambiar su contraseña temporal/i),
    ).toBeTruthy();
  });

  it("edita una cuenta existente y muestra el mensaje de API si falla", async () => {
    const user = userEvent.setup();
    apiEditar.mockRejectedValueOnce({
      response: { data: { detalle: "El correo ya está registrado." } },
    });
    renderUsuarios();

    await user.click(await screen.findByRole("button", { name: "Editar" }));
    await user.clear(screen.getByLabelText("Nombre"));
    await user.type(screen.getByLabelText("Nombre"), "María Editada");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(apiEditar).toHaveBeenCalledWith(2, {
      nombre: "María Editada",
      email: recepcionista.email,
      rol: recepcionista.rol,
    });
    expect(await screen.findByText("El correo ya está registrado.")).toBeTruthy();
  });

  it("desactiva una cuenta solo después de la confirmación", async () => {
    renderUsuarios();

    fireEvent.click(await screen.findByRole("button", { name: "Desactivar" }));

    expect(window.confirm).toHaveBeenCalledWith("¿Desactivar la cuenta de María?");
    await waitFor(() => expect(apiDesactivar).toHaveBeenCalledWith(2));
  });
});
