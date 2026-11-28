// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import LoginPage from "./LoginPage";
import { cerrarSesion, iniciarSesion, yo } from "../api/client";

vi.mock("../api/client", () => ({
  cerrarSesion: vi.fn(),
  iniciarSesion: vi.fn(),
  iniciarSesionGoogle: vi.fn(),
  mensajeError: (error: Error) => error.message,
  yo: vi.fn(),
}));

const loginApi = vi.mocked(iniciarSesion);
const cerrarApi = vi.mocked(cerrarSesion);
const yoApi = vi.mocked(yo);

const administradora = {
  id: 1,
  nombre: "Francisca",
  email: "francisca@example.com",
  rol: "administradora" as const,
  activo: true,
  debe_cambiar_contraseña: false,
};

describe("LoginPage de AdminWeb", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
    cerrarApi.mockResolvedValue();
  });

  it("inicia sesión únicamente para la administradora", async () => {
    loginApi.mockResolvedValueOnce({ access: "a", refresh: "r" });
    yoApi.mockResolvedValueOnce(administradora);
    const onAutenticado = vi.fn();
    render(<LoginPage onAutenticado={onAutenticado} />);
    expect(
      screen.queryByRole("button", { name: /Continuar con Google/i }),
    ).toBeNull();

    await userEvent.type(
      screen.getByLabelText(/Correo electrónico/i),
      administradora.email,
    );
    await userEvent.type(
      screen.getByLabelText(/^Contraseña$/i),
      "clave-segura",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Entrar a administración/i }),
    );

    await waitFor(() =>
      expect(onAutenticado).toHaveBeenCalledWith(administradora),
    );
    expect(cerrarApi).not.toHaveBeenCalled();
  });

  it("invalida la sesión si la cuenta no tiene rol de administradora", async () => {
    loginApi.mockResolvedValueOnce({ access: "a", refresh: "r" });
    yoApi.mockResolvedValueOnce({ ...administradora, rol: "recepcionista" });
    const onAutenticado = vi.fn();
    render(<LoginPage onAutenticado={onAutenticado} />);

    await userEvent.type(
      screen.getByLabelText(/Correo electrónico/i),
      administradora.email,
    );
    await userEvent.type(
      screen.getByLabelText(/^Contraseña$/i),
      "clave-segura",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Entrar a administración/i }),
    );

    await screen.findByRole("alert");
    expect(cerrarApi).toHaveBeenCalled();
    expect(onAutenticado).not.toHaveBeenCalled();
  });
});
