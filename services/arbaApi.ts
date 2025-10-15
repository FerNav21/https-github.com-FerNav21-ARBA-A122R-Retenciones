import { getArbaApiConfig } from '../config';
import { Environment } from '../contexts/SettingsContext';
import { AuthCredentials, DJ, DJPayload, DJQuery, VoucherPayload } from '../types';

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

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
  params.append('scope', 'openid');  // ➕ NUEVO - Requerido según manual

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

export const findOrCreateDJ = async (
  payload: DJPayload, 
  token: string, 
  environment: Environment,
  customCredentials?: { clientId?: string; clientSecret?: string }
): Promise<DJ> => {
    const config = getArbaApiConfig(environment, customCredentials);

    // ✅ Endpoint según manual: POST /declaracionJurada

    // If no open DJ is found for the current period, check and close the previous period's DJ
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

    // Now, create a new one for the current period
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
    
    // ✅ Verificar si ya existe una DJ para el período
    if (message.includes('Posee una DJ iniciada')) {
        throw new Error('DJ_YA_EXISTE: ' + message);
    }
    
    throw new Error(`Error al crear DJ (${createResponse.status}): ${message}`);
}
  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    const message = errorData.message || 'Error desconocido';
    
    // ✅ Verificar si ya existe una DJ para el período
    if (message.includes('Posee una DJ iniciada')) {
        throw new Error('DJ_YA_EXISTE: ' + message);
    }
    
    throw new Error(`Error al crear DJ (${createResponse.status}): ${message}`);
  }
    return createResponse.json();
};
interface SubmitVoucherResponse {
    id: string;
}
 


export const submitVoucher = async (
  payload: VoucherPayload, 
  token: string, 
  environment: Environment,
  customCredentials?: { clientId?: string; clientSecret?: string }
): Promise<SubmitVoucherResponse> => {
    const config = getArbaApiConfig(environment, customCredentials);
    
    // ✅ Endpoint según manual: POST /comprobante
    const response = await fetch(`${config.apiUrl}/comprobante`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // ✅ Sin array, objeto directo
      
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || (Array.isArray(errorData.errors) && errorData.errors.length > 0 && errorData.errors[0].descripcion) || 'Error desconocido';
        throw new Error(`Error al cargar comprobante (${response.status}): ${message}`);
    }

    const result = await response.json();

// ✅ Verificar si el comprobante fue observado (no se da de alta)
if (result.observado === true) {
    throw new Error(`Comprobante observado: ${result.mensaje || 'La alícuota no corresponde'}`);
}

if (result.id || result.idComprobante) {
    return { id: result.id || result.idComprobante };
}

throw new Error('Respuesta inesperada del servidor al cargar comprobante.');

};
export const deleteVoucher = async (
  comprobanteId: string, 
  token: string, 
  environment: Environment,
  customCredentials?: { clientId?: string; clientSecret?: string }
): Promise<void> => {
    const config = getArbaApiConfig(environment, customCredentials);
    
    // Endpoint según manual: DELETE /comprobante?ID={id}
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

export const getVoucherPDF = async (
  comprobanteId: string, 
  token: string, 
  environment: Environment,
  customCredentials?: { clientId?: string; clientSecret?: string }
): Promise<Blob> => {
    const config = getArbaApiConfig(environment, customCredentials);
    
    // Endpoint según manual: GET /comprobantePdf?comprobante={id}
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
