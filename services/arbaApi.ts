import { getArbaApiConfig } from '../config';
import { Environment } from '../contexts/SettingsContext';
import { AuthCredentials, DJ, DJPayload, DJQuery, VoucherPayload } from '../types';

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export const authenticateARBA = async (credentials: AuthCredentials, environment: Environment): Promise<string> => {
  const { authUrl } = getArbaApiConfig(environment);
  
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', credentials.clientId);
  params.append('client_secret', credentials.clientSecret);
  params.append('username', credentials.username);
  params.append('password', credentials.password);

  const response = await fetch(authUrl, {
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

export const findOrCreateDJ = async (payload: DJPayload, token: string, environment: Environment): Promise<DJ> => {
    const { apiUrl } = getArbaApiConfig(environment);

    // First, try to find an existing DJ
    const query: DJQuery = {
        cuit: payload.cuit,
        anio: payload.anio,
        mes: payload.mes,
        quincena: payload.quincena,
    };

    const searchParams = new URLSearchParams(
      Object.entries(query).map(([key, value]) => [key, String(value)])
    );

    const findResponse = await fetch(`${apiUrl}/declaraciones-juradas?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });

    if (findResponse.ok) {
        const djs: DJ[] = await findResponse.json();
        if (djs.length > 0) {
            // Assuming the first one is the correct one if multiple exist
            return djs[0];
        }
    } else if (findResponse.status !== 404) {
        // Handle errors other than "not found"
        const errorData = await findResponse.json().catch(() => ({}));
        throw new Error(`Error al buscar DJ (${findResponse.status}): ${errorData.message || 'Error desconocido'}`);
    }

    // If not found (status 404 or empty array), create a new one
    const createResponse = await fetch(`${apiUrl}/declaraciones-juradas`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(`Error al crear DJ (${createResponse.status}): ${errorData.message || 'Error desconocido'}`);
    }

    return createResponse.json();
};

interface SubmitVoucherResponse {
    id: string;
}

export const submitVoucher = async (payload: VoucherPayload, token: string, environment: Environment): Promise<SubmitVoucherResponse> => {
    const { apiUrl } = getArbaApiConfig(environment);
    
    // The API endpoint for vouchers expects an array of vouchers.
    const response = await fetch(`${apiUrl}/declaraciones-juradas/${payload.idDj}/comprobantes`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify([payload]), // Wrap single voucher in an array
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || (Array.isArray(errorData.errors) && errorData.errors.length > 0 && errorData.errors[0].descripcion) || 'Error desconocido';
        throw new Error(`Error al cargar comprobante (${response.status}): ${message}`);
    }

    const results = await response.json();
    
    // The response is also an array.
    if (Array.isArray(results) && results.length > 0) {
        const voucherResult = results[0];
        if (voucherResult.estado && voucherResult.estado.toUpperCase() === 'RECHAZADO') {
            const errorMessages = Array.isArray(voucherResult.errores) ? voucherResult.errores.map((e: any) => e.descripcion).join(', ') : 'Razón desconocida';
            throw new Error(`Comprobante rechazado por ARBA: ${errorMessages}`);
        }
        if (voucherResult.idComprobante) {
            return { id: voucherResult.idComprobante };
        }
    }
    
    throw new Error('Respuesta inesperada del servidor al cargar comprobante.');
};
