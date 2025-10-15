import { getArbaApiConfig } from '../config';
import { Environment } from '../contexts/SettingsContext';
import { AuthCredentials, DJ, DJPayload, DJQuery, VoucherPayload } from '../types';

/**
 * @interface AuthResponse
 * @description Define la estructura de la respuesta del endpoint de autenticación de ARBA.
 * @property {string} access_token - El token de acceso para realizar solicitudes autorizadas.
 * @property {string} token_type - El tipo de token (generalmente 'Bearer').
 * @property {number} expires_in - El tiempo en segundos hasta que el token expire.
 */
interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * @function authenticateARBA
 * @description Autentica a un usuario contra la API de ARBA para obtener un token de acceso.
 * @param {AuthCredentials} credentials - Las credenciales del usuario (clientId, clientSecret, usuario, contraseña).
 * @param {Environment} environment - El entorno de destino (ej: 'test', 'prod').
 * @param {object} [customCredentials] - Credenciales personalizadas para anular la configuración por defecto.
 * @param {string} [customCredentials.clientId] - ID de cliente personalizado.
 * @param {string} [customCredentials.clientSecret] - Secreto de cliente personalizado.
 * @returns {Promise<string>} Una promesa que se resuelve con el token de acceso.
 * @throws {Error} Si la autenticación falla.
 */
export const authenticateARBA = async (
  credentials: AuthCredentials, 
  environment: Environment,
  customCredentials?: { clientId?: string; clientSecret?: string }
): Promise<string> => {
  const config = getArbaApiConfig(environment, customCredentials);

  
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', credentials.clientId);
  params.append('client_secret', credentials.clientSecret);
  params.append('username', credentials.username);
  params.append('password', credentials.password);
  params.append('scope', 'openid');

  const response = await fetch(config.authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error de autenticación desconocido' }));
    throw new Error(`Error de autenticación (${response.status}): ${errorData.error_description || errorData.message || 'Respuesta inválida del servidor'}`);
  }

  const data: AuthResponse = await response.json();
  return data.access_token;
};

/**
 * @function getPreviousPeriod
 * @description Calcula el período (año, mes, quincena) anterior al proporcionado.
 * @private
 * @param {object} period - El período actual.
 * @param {number} period.anio - El año del período actual.
 * @param {number} period.mes - El mes del período actual.
 * @param {number} period.quincena - La quincena del período actual (1 o 2).
 * @returns {object} Un objeto con el año, mes y quincena del período anterior.
 */
const getPreviousPeriod = (period: { anio: number; mes: number; quincena: number }) => {
    let { anio, mes, quincena } = period;
    if (quincena === 2) {
        quincena = 1;
    } else {
        quincena = 2;
        if (mes === 1) {
            mes = 12;
            anio -= 1;
        } else {
            mes -= 1;
        }
    }
    return { anio, mes, quincena };
};

/**
 * @function closeDJ
 * @description Cierra una Declaración Jurada (DJ) existente en la API de ARBA.
 * @param {string} idDj - El ID de la DJ a cerrar.
 * @param {string} token - El token de acceso de autenticación.
 * @param {Environment} environment - El entorno de destino.
 * @returns {Promise<void>} Una promesa que se resuelve cuando la DJ se ha cerrado con éxito.
 * @throws {Error} Si no se puede cerrar la DJ.
 */
export const closeDJ = async (idDj: string, token: string, environment: Environment): Promise<void> => {
    const { apiUrl } = getArbaApiConfig(environment);
    const response = await fetch(`${apiUrl}/declaraciones-juradas/${idDj}/cierre`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error al cerrar DJ (${response.status}): ${errorData.message || 'Error desconocido'}`);
    }
};

/**
 * @function findOrCreateDJ
 * @description Busca una DJ para el período actual. Si no existe, cierra la del período anterior (si está abierta) y crea una nueva.
 * @param {DJPayload} payload - Los datos necesarios para crear la DJ.
 * @param {string} token - El token de acceso de autenticación.
 * @param {Environment} environment - El entorno de destino.
 * @param {object} [customCredentials] - Credenciales personalizadas para anular la configuración por defecto.
 * @returns {Promise<DJ>} Una promesa que se resuelve con la DJ encontrada o creada.
 * @throws {Error} Si ocurre un error durante el proceso.
 */
export const findOrCreateDJ = async (
  payload: DJPayload, 
  token: string, 
  environment: Environment,
  customCredentials?: { clientId?: string; clientSecret?: string }
): Promise<DJ> => {
    const config = getArbaApiConfig(environment, customCredentials);

    const previousPeriod = getPreviousPeriod(payload);
    const previousPeriodQuery: DJQuery = {
        cuit: payload.cuit,
        ...previousPeriod,
    };
    const prevSearchParams = new URLSearchParams(
        Object.entries(previousPeriodQuery).map(([key, value]) => [key, String(value)])
    );
    const findPrevResponse = await fetch(`${config.apiUrl}/declaraciones-juradas?${prevSearchParams.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });

    if (findPrevResponse.ok) {
        const prevDjs: DJ[] = await findPrevResponse.json();
        const openPrevDJ = prevDjs.find(dj => dj.estado !== 'CERRADA');
        if (openPrevDJ) {
            await closeDJ(openPrevDJ.idDj, token, environment);
        }
    }

    const createResponse = await fetch(`${config.apiUrl}/declaracionJurada`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
       const message = errorData.message || 'Error desconocido';
    
    if (message.includes('Posee una DJ iniciada')) {
        throw new Error('DJ_YA_EXISTE: ' + message);
    }
    
    throw new Error(`Error al crear DJ (${createResponse.status}): ${message}`);
}
  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    const message = errorData.message || 'Error desconocido';
    
    if (message.includes('Posee una DJ iniciada')) {
        throw new Error('DJ_YA_EXISTE: ' + message);
    }
    
    throw new Error(`Error al crear DJ (${createResponse.status}): ${message}`);
  }
    return createResponse.json();
};

/**
 * @interface SubmitVoucherResponse
 * @description Define la estructura de la respuesta al enviar un comprobante.
 * @property {string} id - El ID del comprobante creado o procesado.
 */
interface SubmitVoucherResponse {
    id: string;
}
 
/**
 * @function submitVoucher
 * @description Envía un comprobante a la API de ARBA para ser procesado y añadido a una DJ.
 * @param {VoucherPayload} payload - Los datos del comprobante a enviar.
 * @param {string} token - El token de acceso de autenticación.
 * @param {Environment} environment - El entorno de destino.
 * @param {object} [customCredentials] - Credenciales personalizadas.
 * @returns {Promise<SubmitVoucherResponse>} Una promesa que se resuelve con el ID del comprobante.
 * @throws {Error} Si el envío falla o el comprobante es observado.
 */
export const submitVoucher = async (
  payload: VoucherPayload, 
  token: string, 
  environment: Environment,
  customCredentials?: { clientId?: string; clientSecret?: string }
): Promise<SubmitVoucherResponse> => {
    const config = getArbaApiConfig(environment, customCredentials);
    
    const response = await fetch(`${config.apiUrl}/comprobante`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || (Array.isArray(errorData.errors) && errorData.errors.length > 0 && errorData.errors[0].descripcion) || 'Error desconocido';
        throw new Error(`Error al cargar comprobante (${response.status}): ${message}`);
    }

    const result = await response.json();

if (result.observado === true) {
    throw new Error(`Comprobante observado: ${result.mensaje || 'La alícuota no corresponde'}`);
}

if (result.id || result.idComprobante) {
    return { id: result.id || result.idComprobante };
}

throw new Error('Respuesta inesperada del servidor al cargar comprobante.');

};

/**
 * @function deleteVoucher
 * @description Elimina un comprobante previamente enviado a la API de ARBA.
 * @param {string} comprobanteId - El ID del comprobante a eliminar.
 * @param {string} token - El token de acceso de autenticación.
 * @param {Environment} environment - El entorno de destino.
 * @param {object} [customCredentials] - Credenciales personalizadas.
 * @returns {Promise<void>} Una promesa que se resuelve cuando el comprobante se ha eliminado.
 * @throws {Error} Si la eliminación falla.
 */
export const deleteVoucher = async (
  comprobanteId: string, 
  token: string, 
  environment: Environment,
  customCredentials?: { clientId?: string; clientSecret?: string }
): Promise<void> => {
    const config = getArbaApiConfig(environment, customCredentials);
    
    const response = await fetch(`${config.apiUrl}/comprobante?ID=${comprobanteId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || 'Error desconocido';
        throw new Error(`Error al eliminar comprobante (${response.status}): ${message}`);
    }
};

/**
 * @function getVoucherPDF
 * @description Obtiene la representación en PDF de un comprobante desde la API de ARBA.
 * @param {string} comprobanteId - El ID del comprobante para el que se generará el PDF.
 * @param {string} token - El token de acceso de autenticación.
 * @param {Environment} environment - El entorno de destino.
 * @param {object} [customCredentials] - Credenciales personalizadas.
 * @returns {Promise<Blob>} Una promesa que se resuelve con el PDF del comprobante como un objeto Blob.
 * @throws {Error} Si no se puede obtener el PDF.
 */
export const getVoucherPDF = async (
  comprobanteId: string, 
  token: string, 
  environment: Environment,
  customCredentials?: { clientId?: string; clientSecret?: string }
): Promise<Blob> => {
    const config = getArbaApiConfig(environment, customCredentials);
    
    const response = await fetch(`${config.apiUrl}/comprobantePdf?comprobante=${comprobanteId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || 'Error desconocido';
        throw new Error(`Error al obtener PDF (${response.status}): ${message}`);
    }

    return response.blob();
};
