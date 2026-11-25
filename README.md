# AdminWeb — Fran-Costuras

Cliente web del taller de costura **Fran-Costuras** para la **administradora**
(gestión de usuarios, asignación de costureras, inventario de telas, pagos y anulaciones, reportes PDF).
No tiene base de datos ni reglas de negocio: todo se lee y se guarda a través de la API REST del repositorio `Backend`.

Tecnologías: React 18 + TypeScript + Vite, React Router, Axios, Bootstrap 5 + `src/styles/marca.css`.

> Estado actual: incluye inicio de sesión y cambio obligatorio de contraseña temporal; gestión de usuarios; asignación de costureras y edición de fechas de entrega; gestión de telas y alerta de stock bajo; consulta de saldos, registro y anulación de pagos. Siguen pendientes la eliminación de clientes, la edición del catálogo y los reportes PDF.

## Requisitos

- Node.js 20.19 o superior (rama 20), o 22.12 o superior (rama 22+), y npm.
- La API del `Backend` corriendo (en desarrollo, `http://localhost:8000/api/v1`).

## Variable de entorno

Crear el archivo `.env.local` en la raíz del repositorio (no se versiona):

```
VITE_API_URL=http://localhost:8000/api/v1
VITE_GOOGLE_CLIENT_ID=tu-client-id-web.apps.googleusercontent.com
```

Las variables `VITE_*` quedan visibles en el navegador: nunca se ponen secretos en ellas.
Para habilitar el acceso Google, configura el Client ID web compartido con
Frontend y Backend. El backend autentica solo cuentas activas ya existentes y
mantiene este portal restringido a la administradora.

## Instalar y correr

```bash
npm install
npm run dev        # http://localhost:5174
```

## Probar y verificar

```bash
npm run lint
npm run test       # Vitest + React Testing Library
npm run build      # debe compilar sin errores
```

Reglas de trabajo y del proyecto: ver `AGENTS.md`.

## Ampliación de alcance

El proyecto también contempla la ampliación aprobada por la cliente en `DERCAS_Fran-Costuras_v1.5-ampliacion.docx` y `.pdf` (§14). La captura de consumos por recepción/administración y la confirmación de «En proceso» por administradora/costurera asignada están implementadas y verificadas en Backend, Frontend, AdminWeb y AppMovil como primera entrega de la Fase A. El resto se entrega por fases según `docs/plan/AMPLIACION-DERCAS-1.5.md`; las decisiones de negocio pendientes siguen bloqueando las funciones dependientes. El DERCAS describe el alcance, no certifica las funciones pendientes.
