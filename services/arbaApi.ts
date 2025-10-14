import { AuthCredentials, DJPayload, VoucherPayload, DJ, DJQuery } from '../types';
import { endpoints, credentials } from '../config';
import { Environment } from '../contexts/SettingsContext';

// ==================================================================
// REAL API IMPLEMENTATION - Conecta con los endpoints de ARBA
// Esta versión es consciente del entorno (Pruebas/Producción).
// ==================================================================

/**
 * Maneja las respuestas de la API, parseando JSON o Blobs y lanzando errores estandarizados.
 * @param response La respuesta del objeto fetch.
 * @returns La data parseada (JSON, Blob, etc.).
 */
const handleResponse = async (response: Response) => {
  if (response.ok) {
    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('application/json')) {
      // Manejar el caso de una respuesta vacía que de alguna manera tiene el content-type json
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }
    if (contentType?.includes('application/pdf')) {
      return response.blob();
    }
    // Si la respuesta es exitosa pero no tiene contenido (ej. 204 No Content)
    return;
  } else {
    // Intenta leer el cuerpo del error para un mensaje más detallado.
    const errorBody = await response.text();
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      // ARBA podría devolver un error JSON estructurado.
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.message || errorJson.error_description || JSON.stringify(errorJson);
    } catch (e) {
      // Si el cuerpo no es JSON, usa el texto crudo si existe.
      if (errorBody) {
        errorMessage = errorBody;
      }
    }
    throw new Error(errorMessage);
  }
};

export const getAuthToken = async (
  userCredentials: Omit<AuthCredentials, 'clientId' | 'clientSecret'>,
  environment: Environment
): Promise<string> => {
  const envConfig = endpoints[environment];
  const envCredentials = credentials[environment];
  console.log(`Solicitando token para ambiente [${environment.toUpperCase()}]`);

  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('scope', 'openid');
  params.append('client_id', envCredentials.clientId);
  params.append('client_secret', envCredentials.clientSecret);
  params.append('username', userCredentials.username);
  params.append('password', userCredentials.password);

  const response = await fetch(envConfig.authTokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  
  const data = await handleResponse(response);
  
  if (!data?.access_token) {
    throw new Error("No se recibió el 'access_token' en la respuesta de autenticación.");
  }

  console.log('Token obtenido con éxito.');
  return data.access_token;
};

// --- NUEVAS FUNCIONES PARA GESTIÓN DE DJ ---

/**
 * Consulta si existe una DJ para un período específico.
 * NOTA: El endpoint es una suposición basada en prácticas REST.
 * Se asume que devuelve un array de DJs que coinciden con la consulta.
 */
export const consultarDJ = async (params: DJQuery, token: string, environment: Environment): Promise<DJ[]> => {
  console.log(`Consultando DJ en [${environment.toUpperCase()}] con parámetros:`, params);
  const envConfig = endpoints[environment];
  const url = new URL(`${envConfig.apiBaseUrl}/declaracionJurada`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, String(value)));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const data = await handleResponse(response);
  // Se asume que la API devuelve un array, incluso si está vacío.
  return Array.isArray(data) ? data : [];
};

/**
 * Cierra una Declaración Jurada existente.
 * NOTA: El endpoint es una suposición. Se asume un método POST a un sub-recurso 'cerrar'.
 */
export const cerrarDJ = async (idDj: string, token: string, environment: Environment): Promise<void> => {
    console.log(`Cerrando DJ [${idDj}] en [${environment.toUpperCase()}]`);
    const envConfig = endpoints[environment];
    const response = await fetch(`${envConfig.apiBaseUrl}/declaracionJurada/${idDj}/cerrar`, {
        method: 'POST', // O podría ser PUT
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'CERRADA' }) // El cuerpo podría no ser necesario
    });
    await handleResponse(response);
    console.log(`DJ [${idDj}] cerrada con éxito.`);
};


// --- FUNCIONES EXISTENTES ---

export const initiateDJ = async (payload: DJPayload, token: string, environment: Environment): Promise<DJ> => {
  console.log(`Iniciando DJ en [${environment.toUpperCase()}] con payload:`, payload);
  const envConfig = endpoints[environment];

  const response = await fetch(`${envConfig.apiBaseUrl}/declaracionJurada`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const djData = await handleResponse(response);
  console.log('DJ iniciada con éxito:', djData);
  return djData;
};

export const uploadVoucher = async (payload: VoucherPayload, token: string, environment: Environment): Promise<{ idComprobante: string }> => {
  console.log(`Subiendo comprobante en [${environment.toUpperCase()}] con payload:`, payload);
  const envConfig = endpoints[environment];
  
  const response = await fetch(`${envConfig.apiBaseUrl}/comprobante`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await handleResponse(response);
  console.log('Comprobante subido con éxito. ID:', result.idComprobante);
  return result;
};

export const getVoucherPDF = async (comprobanteId: string, token: string, environment: Environment): Promise<Blob> => {
  console.log(`Solicitando PDF en [${environment.toUpperCase()}] para comprobante ${comprobanteId}`);
  const envConfig = endpoints[environment];
  
  const url = new URL(`${envConfig.apiBaseUrl}/comprobantePdf`);
  url.searchParams.append('idComprobante', comprobanteId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const blob = await handleResponse(response);
  if (!(blob instanceof Blob)) {
    throw new Error('La respuesta no fue un archivo PDF válido.');
  }
  console.log('PDF generado exitosamente.');
  return blob;
};