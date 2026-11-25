import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

let tokenAcceso: string | null = null;
const CLAVE_REFRESH = "fc_refresh_token";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: "administradora" | "recepcionista" | "costurera";
  activo: boolean;
  debe_cambiar_contraseña: boolean;
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface Pagina<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });
let refrescoEnCurso: Promise<Tokens> | null = null;

export function obtenerRefresh(): string | null {
  try {
    return window.sessionStorage.getItem(CLAVE_REFRESH);
  } catch {
    return null;
  }
}

export function guardarTokens(tokens: Tokens): void {
  tokenAcceso = tokens.access;
  try {
    window.sessionStorage.setItem(CLAVE_REFRESH, tokens.refresh);
  } catch {
    // El token de refresco no queda persistido si el navegador lo bloquea.
  }
}

export function borrarTokens(): void {
  tokenAcceso = null;
  try {
    window.sessionStorage.removeItem(CLAVE_REFRESH);
  } catch {
    // La sesión en memoria también se invalida.
  }
}

function adjuntarToken(config: InternalAxiosRequestConfig): void {
  if (tokenAcceso) config.headers.Authorization = `Bearer ${tokenAcceso}`;
}

api.interceptors.request.use((config) => {
  adjuntarToken(config);
  return config;
});

api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error: AxiosError) => {
    const original = error.config as
      (InternalAxiosRequestConfig & { _reintento?: boolean }) | undefined;
    if (
      error.response?.status !== 401 ||
      !original ||
      original._reintento ||
      original.url?.includes("/auth/login/") ||
      original.url?.includes("/auth/google/") ||
      original.url?.includes("/auth/refresh/")
    ) {
      return Promise.reject(error);
    }
    const refresh = obtenerRefresh();
    if (!refresh) return Promise.reject(error);
    original._reintento = true;
    try {
      if (!refrescoEnCurso) {
        refrescoEnCurso = axios
          .post<Tokens>(`${BASE_URL}/auth/refresh/`, { refresh })
          .then(({ data }) => {
            guardarTokens(data);
            return data;
          });
      }
      const tokens = await refrescoEnCurso;
      original.headers.Authorization = `Bearer ${tokens.access}`;
      return await api.request(original);
    } catch {
      borrarTokens();
      return Promise.reject(error);
    } finally {
      refrescoEnCurso = null;
    }
  },
);

export function mensajeError(error: unknown): string {
  const detalle = (error as { response?: { data?: { detalle?: unknown } } })
    ?.response?.data?.detalle;
  if (typeof detalle === "string" && detalle) return detalle;
  if (error instanceof Error && error.message) return error.message;
  return "No se pudo completar la solicitud. Verifica la conexión con la API.";
}

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<Tokens> {
  const { data } = await api.post<Tokens>("/auth/login/", { email, password });
  guardarTokens(data);
  return data;
}

export async function iniciarSesionGoogle(credential: string): Promise<Tokens> {
  const { data } = await api.post<Tokens>("/auth/google/", { credential });
  guardarTokens(data);
  return data;
}

export async function yo(): Promise<Usuario> {
  const { data } = await api.get<Usuario>("/auth/yo/");
  return data;
}

export async function cambiarContrasena(
  contrasenaActual: string,
  nuevaContrasena: string,
): Promise<void> {
  const { data } = await api.post<Tokens>("/auth/cambiar-contrasena/", {
    contrasena_actual: contrasenaActual,
    nueva_contrasena: nuevaContrasena,
  });
  guardarTokens(data);
}

export async function cerrarSesion(): Promise<void> {
  const refresh = obtenerRefresh();
  if (refresh) {
    try {
      await api.post("/auth/logout/", { refresh });
    } catch {
      // Un refresh vencido no impide limpiar la sesión local.
    }
  }
  borrarTokens();
}

export async function listarUsuarios(
  page = 1,
  rol?: Usuario["rol"],
): Promise<Pagina<Usuario>> {
  const { data } = await api.get<Pagina<Usuario>>("/usuarios/", {
    params: { page, ...(rol ? { rol } : {}) },
  });
  return data;
}

export interface DatosUsuarioNuevo {
  nombre: string;
  email: string;
  rol: Usuario["rol"];
  password: string;
}

export async function crearUsuario(datos: DatosUsuarioNuevo): Promise<Usuario> {
  const { data } = await api.post<Usuario>("/usuarios/", datos);
  return data;
}

export async function editarUsuario(
  id: number,
  datos: Partial<Pick<Usuario, "nombre" | "email" | "rol">>,
): Promise<Usuario> {
  const { data } = await api.patch<Usuario>(`/usuarios/${id}/`, datos);
  return data;
}

export async function desactivarUsuario(id: number): Promise<void> {
  await api.delete(`/usuarios/${id}/`);
}

export interface PedidoAdmin {
  id: number;
  codigo: string;
  cliente_nombre: string;
  prenda_nombre: string;
  categoria_codigo: string;
  fecha_entrega: string;
  estado: string;
  costurera: number | null;
  costurera_nombre: string | null;
  total: string;
  nota_interna: string;
}

export interface UsoTelaPedidoAdmin {
  id: number;
  tela: number;
  tela_nombre: string;
  tela_color: string;
  metros_usados: string;
  registrado_por_nombre: string | null;
  confirmado: boolean;
  vigente: boolean;
  reemplazado_en: string | null;
  reemplazado_por_nombre: string | null;
  fecha: string;
}

export async function listarConsumosPedido(
  codigo: string,
): Promise<Pagina<UsoTelaPedidoAdmin>> {
  const { data } = await api.get<Pagina<UsoTelaPedidoAdmin>>(
    `/pedidos/${codigo}/consumos/`,
  );
  return data;
}

export interface OpcionTelaConsumo {
  id: number;
  nombre: string;
  color: string;
  metros_disponibles: string;
}

export async function listarOpcionesTelaConsumo(): Promise<
  Pagina<OpcionTelaConsumo>
> {
  const { data } = await api.get<Pagina<OpcionTelaConsumo>>(
    "/telas/opciones-consumo/",
  );
  return data;
}

export async function registrarConsumosPedido(
  codigo: string,
  usos: { tela: number; metros_usados: string }[],
): Promise<void> {
  await api.post(`/pedidos/${codigo}/consumos/`, { usos });
}

export async function confirmarInicioPedido(codigo: string): Promise<void> {
  await api.post(`/pedidos/${codigo}/estado/`, { confirmar: true });
}

export async function listarPedidosActivos(
  page = 1,
): Promise<Pagina<PedidoAdmin>> {
  const { data } = await api.get<Pagina<PedidoAdmin>>("/pedidos/", {
    params: { page },
  });
  return data;
}

export async function listarPedidosParaPagos(
  page = 1,
): Promise<Pagina<PedidoAdmin>> {
  const { data } = await api.get<Pagina<PedidoAdmin>>("/pedidos/", {
    params: { page, incluir_entregados: true },
  });
  return data;
}

export interface Pago {
  id: number;
  pedido: number;
  monto: string;
  fecha: string;
  registrado_por: number;
  registrado_por_nombre: string;
  anulado: boolean;
  anulado_por: number | null;
  anulado_por_nombre: string | null;
}

export interface PaginaPagos extends Pagina<Pago> {
  saldo: string;
}

export interface PagoConSaldo extends Pago {
  saldo: string;
}

export async function listarPagosPedido(
  codigo: string,
  page = 1,
): Promise<PaginaPagos> {
  const { data } = await api.get<PaginaPagos>(`/pedidos/${codigo}/pagos/`, {
    params: { page },
  });
  return data;
}

export async function registrarPagoPedido(
  codigo: string,
  monto: string,
): Promise<PagoConSaldo> {
  const { data } = await api.post<PagoConSaldo>(`/pedidos/${codigo}/pagos/`, {
    monto,
  });
  return data;
}

export async function anularPago(id: number): Promise<PagoConSaldo> {
  const { data } = await api.post<PagoConSaldo>(`/pagos/${id}/anular/`);
  return data;
}

export async function cambiarFechaEntrega(
  codigo: string,
  fecha_entrega: string,
): Promise<PedidoAdmin> {
  const { data } = await api.patch<PedidoAdmin>(`/pedidos/${codigo}/`, {
    fecha_entrega,
  });
  return data;
}

export async function guardarNotaInterna(
  codigo: string,
  nota_interna: string,
): Promise<PedidoAdmin> {
  const { data } = await api.patch<PedidoAdmin>(`/pedidos/${codigo}/notas/`, {
    nota_interna,
  });
  return data;
}

export async function asignarCosturera(
  codigo: string,
  costurera: number,
): Promise<PedidoAdmin> {
  const { data } = await api.post<PedidoAdmin>(`/pedidos/${codigo}/asignar/`, {
    costurera,
  });
  return data;
}

export interface Tela {
  id: number;
  nombre: string;
  color: string;
  metros_disponibles: string;
  precio_metro: string;
  proveedor: string;
  stock_minimo: string;
  stock_bajo: boolean;
}

export interface ServicioCatalogo {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  unidad: string;
  tarifa_base: string | null;
  requiere_valoracion: boolean;
  configuracion_pendiente: boolean;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface CambioServicio {
  codigo: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  unidad: string;
  tarifa_base: string | null;
  requiere_valoracion: boolean;
  activo: boolean;
}

export async function listarServiciosCatalogo(
  page = 1,
): Promise<Pagina<ServicioCatalogo>> {
  const { data } = await api.get<Pagina<ServicioCatalogo>>("/servicios/", {
    params: { page },
  });
  return data;
}

export async function crearServicioCatalogo(
  datos: CambioServicio,
): Promise<ServicioCatalogo> {
  const { data } = await api.post<ServicioCatalogo>("/servicios/", datos);
  return data;
}

export async function editarServicioCatalogo(
  id: number,
  datos: Partial<CambioServicio>,
): Promise<ServicioCatalogo> {
  const { data } = await api.patch<ServicioCatalogo>(
    `/servicios/${id}/`,
    datos,
  );
  return data;
}

export async function listarTelas(page = 1): Promise<Pagina<Tela>> {
  const { data } = await api.get<Pagina<Tela>>("/telas/", { params: { page } });
  return data;
}

export async function listarTelasBajoStock(page = 1): Promise<Pagina<Tela>> {
  const { data } = await api.get<Pagina<Tela>>("/telas/stock-bajo/", {
    params: { page },
  });
  return data;
}

export async function crearTela(
  datos: Omit<Tela, "id" | "stock_bajo">,
): Promise<Tela> {
  const { data } = await api.post<Tela>("/telas/", datos);
  return data;
}

export async function editarTela(
  id: number,
  datos: Partial<Omit<Tela, "id" | "stock_bajo">>,
): Promise<Tela> {
  const { data } = await api.patch<Tela>(`/telas/${id}/`, datos);
  return data;
}
