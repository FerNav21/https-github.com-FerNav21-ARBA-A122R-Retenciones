## Instrucciones para agentes de IA (Copilot)

Objetivo corto
- Ayuda inmediata para desarrollar, depurar y extender la interfaz web que orquesta el envío de retenciones a la API ARBA A-122R.

Qué hay en este repositorio (big picture)
- Frontend React + Vite: interfaz de configuración y monitoreo (entrada: CSV desde ERP; salida: comprobante PDF). Archivos clave: `App.tsx`, `index.tsx`, `components/*`, `contexts/SettingsContext.tsx`.
- Proxy / helper server (Node/Express): `proxy-server.js` (ESM) y `server.js` (CommonJS, alternativa). Exponen endpoints para evitar CORS y centralizar clientSecret en desarrollo.
- Servicios de consumo de ARBA: `services/arbaApi.ts` (lógica principal de autenticación, creación/consulta de DJ, envío de comprobantes, obtención de PDF) y `services/localApi.ts` (placeholder para integración local/ERP).
- Configuración central: `config.ts` (toggles para usar proxy, urls y client secrets de test/producción) y `vite.config.ts` (proxy de desarrollo para `/arba` y `/auth`).

Pistas rápidas para ser productivo
- Rutas y puertos relevantes
  - Frontend dev server: `vite` (puerto 3000). Ver `package.json` scripts: `npm run dev`.
  - Proxy server local sugerido: `proxy-server.js` escucha por defecto en puerto 3001.
  - Vite define proxies en `vite.config.ts`: `/arba` → `https://dfe.test.arba.gov.ar/...`, `/auth` → `https://login.test.arba.gov.ar/...` (solo en dev).

- ¿Usar proxy o llamar directo a ARBA?
  - Toggle principal: `USE_PROXY` en `config.ts`. Cuando `true`, frontend apunta a `http://localhost:3001/api/arba` y `http://localhost:3001/api/arba/auth`.
  - Para debugging rápido en dev puedes usar `vite` proxy (ver `vite.config.ts`) o ejecutar el `proxy-server.js` y cambiar `USE_PROXY` a `true`.

- Credenciales y secretos
  - Valores de ejemplo de `clientSecret` y `clientId` están en `config.ts` (ambiente `test` y `production`); no los modifiques en producción.
  - El token OAuth se obtiene con grant_type=password; ver `services/arbaApi.ts: authenticateARBA`.

Patrones y convenciones del proyecto (evitar suposiciones genéricas)
- Settings centralizados en `SettingsContext.tsx` y persistidos en localStorage bajo `arba-settings`. Cuando modifiques configuración, respeta las claves: `environment`, `cuit`, `cit`, `anio`, `mes`, `quincena`, `actividadId`, `localApiUrl`, `networkFolderPath`, `useCustomCredentials`, `customClientId`, `customClientSecret`.
- Manejo de errores: los servicios lanzan excepciones con mensajes legibles (ej: `DJ_YA_EXISTE: ...` o `Comprobante observado: ...`). El frontend espera estas cadenas y las muestra tal cual en la UI.
- Endpoints ARBA esperados por `services/arbaApi.ts`:
  - POST /declaracionJurada  (crear DJ)
  - GET /declaraciones-juradas?{params} (buscar DJ por periodo)
  - POST /comprobante (enviar comprobante)
  - GET /comprobantePdf?comprobante={id} (obtener PDF)
  - DELETE /comprobante?ID={id} (eliminar comprobante)

Ejemplos concretos (copiar y adaptar)
- Llamada de autenticación usada por el frontend (cuando `USE_PROXY = true`) se envía a `http://localhost:3001/api/arba/auth` con body JSON: { username, password, clientId, clientSecret, environment }.
- Flujo de crear una DJ en `services/arbaApi.ts`:
  1) Buscar DJ del periodo anterior; si existe y está abierta, llamar a `closeDJ(idDj)` (POST a `{apiUrl}/declaraciones-juradas/{id}/cierre`).
  2) POST a `{apiUrl}/declaracionJurada` con `payload` para crear la DJ.
  3) Si la respuesta contiene mensaje "Posee una DJ iniciada" la librería lanza `DJ_YA_EXISTE`.

Ejemplos JSON (request / response) — copiar/pegar y adaptar
- Autenticación (frontend -> proxy -> ARBA):

  Request (a proxy `POST /api/arba/auth`):

  {
    "username": "20304050601",   // CUIT
    "password": "CIT_SECRETA",
    "clientId": "A122RServicios",
    "clientSecret": "44cqahkhERKtkkDGmcqrPApCMtez3Xxt",
    "environment": "test"
  }

  Response (ejemplo ARBA):

  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 300
  }

- Crear DJ (proxy -> ARBA POST /declaracionJurada):

  Request payload (ejemplo `DJPayload` usado en `services/arbaApi.ts`):

  {
    "cuit": "20304050601",
    "anio": 2024,
    "mes": 7,
    "quincena": 1,
    "actividadId": "6",
    "datos": [] // array de detalles según especificación de ARBA
  }

  Posible Response de éxito:

  {
    "idDj": "DJ-123456",
    "estado": "INICIADA"
  }

  Posible Response indicando DJ ya iniciada (manejar en código):

  {
    "message": "Posee una DJ iniciada para el periodo"
  }

- Enviar comprobante (POST /comprobante):

  Request payload (`VoucherPayload`):

  {
    "idDj": "DJ-123456",
    "fechaOperacion": "2024-07-18T10:30:00",
    "cuitContribuyente": "20304050601",
    "sucursal": "1",
    "alicuota": 2.5,
    "baseImponible": 10000.00,
    "importeRetencion": 250.00,
    "razonSocialContribuyente": "Empresa Ejemplo SRL"
  }

  Success Response (ejemplo):

  {
    "id": "CMP-987654",
    "observado": false
  }

  Error observado (ejemplo manejado por `submitVoucher`):

  {
    "observado": true,
    "mensaje": "La alícuota no corresponde"
  }

- Obtener PDF (GET /comprobantePdf?comprobante={id})
  - Respuesta: binary/pdf (en frontend se solicita vía `getVoucherPDF` y se transforma a blob).

Debugging y errores comunes (qué buscar y cómo reproducir)
- Errores de autenticación
  - Síntomas: llamadas a ARBA devuelven 401 o `response.ok` false. Mensaje típico en proxy: error de autenticación con código HTTP del proveedor.
  - Repro: usar credenciales inválidas en `Settings` y navegar a la pantalla de Generar Token.
  - Qué revisar: `config.ts` para `authUrl` correcto según `USE_PROXY`, `proxy-server.js` logs (si corres el proxy), y que `clientId/clientSecret` sean correctos.

- DJ ya existe (flujo de negocio)
  - Síntoma: la llamada a crear DJ falla con mensaje que contiene "Posee una DJ iniciada".
  - Repro: intentar crear una DJ para el mismo periodo dos veces.
  - Qué hacer: la app lanza `Error('DJ_YA_EXISTE: ...')` — la UI espera esa cadena exactamente. Evitar cambiar el texto del error si dependes de la UI.

- Comprobante observado
  - Síntoma: `submitVoucher` lanza `Comprobante observado: ...` y no devuelve id.
  - Repro: enviar datos con alícuota/base incompatible o datos faltantes.
  - Qué revisar: payload enviado (campos: `alicuota`, `baseImponible`, `cuitContribuyente`), y logs del proxy / respuesta del servidor ARBA.

- Errores de CORS / Proxy
  - Síntoma: llamadas desde el navegador bloqueadas con error CORS.
  - Repro: correr `npm run dev` y no ejecutar `proxy-server.js` mientras `USE_PROXY=true` en `config.ts`.
  - Qué hacer: o bien ejecutar el `proxy-server.js` (Node) o usar el proxy integrado de Vite (`vite.config.ts`) y adaptar las rutas `/arba` y `/auth`.

- Errores en la API local (ERP)
  - Síntoma: la funcionalidad de procesamiento automatizado falla porque `services/localApi.ts` devuelve `not implemented`.
  - Repro: configurar `Settings.localApiUrl` sin implementar el endpoint.
  - Qué hacer: implementar un endpoint local que acepte `{ filePath, settings }` y devuelva `VoucherResult[]`.

Notas finales
- Evita commitear secretos reales. Si implementas cambios para producción, extrae `clientSecret` a variables de entorno.
- Si alguna respuesta del proveedor ARBA cambia su shape, actualiza `services/arbaApi.ts` y conserva los mensajes de error usados por la UI.

Tests unitarios sugeridos (rápido)
- Recomendación: usar `vitest` junto a mocking de `fetch` para probar `services/arbaApi.ts` sin llamadas reales a ARBA.
- Instalación rápida (PowerShell):

```powershell
npm install -D vitest
```

- Comando de ejecución (añadir script `test` en `package.json`):

```powershell
npm run test
```

- Casos de prueba recomendados (mínimos):
  1) `authenticateARBA` — éxito y error (mockear `fetch` para devolver `access_token` y respuestas no-ok).
  2) `findOrCreateDJ` — cuando el periodo previo devuelve una DJ abierta (mockear `GET /declaraciones-juradas`) y crear DJ con `POST /declaracionJurada`.
  3) `submitVoucher` — éxito (devuelve id) y comprobante observado (throw con mensaje `Comprobante observado:`).
  4) `getVoucherPDF` — mockear `fetch` para devolver `blob()` y verificar que la función devuelve un blob.

- Ejemplo minimal de test (usa vitest, archivo: `tests/arbaApi.test.ts`):

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateARBA, submitVoucher } from '../services/arbaApi';

describe('arbaApi (unit)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('authenticateARBA returns access token on success', async () => {
    const fakeToken = 'tok-123';
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ access_token: fakeToken }),
    })) as any;

    const token = await authenticateARBA({ clientId: 'A', clientSecret: 'B', username: 'u', password: 'p' } as any, 'test');
    expect(token).toBe(fakeToken);
  });

  it('submitVoucher returns id on success', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 'CMP-1' }),
    })) as any;

    const result = await submitVoucher({} as any, 'token', 'test');
    expect(result.id).toBe('CMP-1');
  });
});
```

Notas: adapta los imports y mocks según tu runner. Si usas Node <18 o `node-fetch`, asegúrate de stubear `global.fetch` o usar `vi.stubGlobal('fetch', ...)`.

Comandos útiles de desarrollo
- Instalar dependencias: `npm install` (proyecto usa npm). (Windows PowerShell)
- Levantar frontend en dev: `npm run dev` (abre en http://localhost:3000).
- Construir producción: `npm run build`.
- Vista previa build: `npm run preview`.
- Levantar proxy local (Node): `node proxy-server.js` (requiere Node >= 18 por `node-fetch` ESM). Alternativa CommonJS: `node server.js`.

Puntos de integración importantes
- Integración ERP: el ERP genera archivos CSV y llama a una API local (configurable en `Settings.networkFolderPath` y `Settings.localApiUrl`). El proyecto incluye ejemplos COBOL (`erp-integration/*.cbl`) y `llamar_api.bat` que muestra cómo invocar una API local con curl.
- `services/localApi.ts` es actualmente un placeholder; los agentes que implementen la integración deben respetar la shape de `settings` y devolver `VoucherResult[]` como en `types.ts`.

Riesgos y notas de seguridad
- No comites credenciales reales. El repo contiene client secrets de ejemplo para ambientes de prueba y producción —tratarlos como sensibles.
- En producción el `clientSecret` debe estar gestionado fuera del repo (señalar en el README o usar variables de entorno).

Archivos de referencia rápidos
- `config.ts` (toggle proxy, urls y secrets)
- `vite.config.ts` (proxy dev)
- `proxy-server.js` / `server.js` (implementación de proxy)
- `services/arbaApi.ts` (lógica de negocio para ARBA)
- `contexts/SettingsContext.tsx` (persistencia y shape de settings)
- `components/SettingsModal.tsx` (UI para editar settings)
- `erp-integration/` (ejemplos de integración COBOL / batch)

Si algo está incompleto
- Pide al mantenedor el endpoint real de la API local del ERP (si existe) y ejemplos de CSV reales. También confirma si el proxy debe ejecutarse en modo ESM (`proxy-server.js`) o CommonJS (`server.js`) en los entornos objetivo.

Fin.
