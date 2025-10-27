import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Proxy para autenticación
app.post('/api/auth', async (req, res) => {
  console.log('--- NUEVA PETICIÓN A /api/auth ---');
  try {
  console.log('Request Body recibido:', req.body);
  const body = req.body || {};
    const username = body.username || req.query.username;
    const password = body.password || req.query.password;
    const environment = body.environment || req.query.environment || 'test';
    // allow overriding client credentials from the request (useful for testing/custom creds)
    const bodyClientId = body.clientId || req.query.clientId;
    const bodyClientSecret = body.clientSecret || req.query.clientSecret;
    const defaultClientId = 'A122RServicios';
    const defaultClientSecret = environment === 'production'
      ? 'k1pwZG4dRrK88KpMfK6ACqav1SNDiCa'
      : '44cqahkhERKtkkDGmcqrPApCMtez3Xxt';
    const clientId = bodyClientId || defaultClientId;
    const clientSecret = bodyClientSecret || defaultClientSecret;
    if (bodyClientId) console.log('Usando clientId provisto en request (override)');
    
    const authUrl = environment === 'production'
      ? 'https://idp.arba.gov.ar/realms/ARBA/protocol/openid-connect/token'
      : 'https://idp.test.arba.gov.ar/realms/ARBA/protocol/openid-connect/token';
    
    
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
    params.append('username', username);
    params.append('password', password);
    params.append('scope', 'openid');

    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    };

    console.log('Enviando petición a ARBA:', { url: authUrl, options: fetchOptions });

    const response = await fetch(authUrl, fetchOptions);
    let data;
    try {
      data = await response.json();
    } catch (err) {
      // fallback a texto si la respuesta no es JSON
      const text = await response.text().catch(() => null);
      console.warn('Respuesta de ARBA no-JSON para /api/auth, status:', response.status);
      console.warn('Raw response snippet:', (typeof text === 'string' && text.length > 0) ? text.slice(0, 500) : text);
      if (text) {
        // intentar extraer mensaje legible
        return res.status(response.status).json({ message: text });
      }
      return res.status(response.status).json({ message: 'Respuesta inválida del servidor' });
    }
    console.log('Respuesta de ARBA recibida:', data);
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Error en /api/auth:', error);
    res.status(500).json({ error: error.message });
  }
  console.log('--- FIN PETICIÓN A /api/auth ---');
});

// Proxy para DJ
app.post('/api/dj', async (req, res) => {
  console.log('--- NUEVA PETICIÓN A /api/dj ---');
  try {
  console.log('Request Body recibido:', req.body);
  const body = req.body || {};
  const token = body.token || req.query.token;
  const payload = body.payload || body || {};
  const environment = body.environment || req.query.environment || 'test';
    
    const apiUrl = environment === 'production'
      ? 'https://app.arba.gov.ar/a122rSrv/api/external'
      : 'https://app.test.arba.gov.ar/a122rSrv/api/external';
    
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    const url = `${apiUrl}/declaracionJurada`;
    console.log('Enviando petición a ARBA:', { url, options: fetchOptions });

    const response = await fetch(url, fetchOptions);
    let data;
    try {
      data = await response.json();
    } catch (err) {
      const text = await response.text().catch(() => null);
      console.warn('Respuesta de ARBA no-JSON para /api/dj, status:', response.status);
      if (text) return res.status(response.status).json({ message: text });
      return res.status(response.status).json({ message: 'Respuesta inválida del servidor' });
    }
    console.log('Respuesta de ARBA recibida:', data);
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Error en /api/dj:', error);
    res.status(500).json({ error: error.message });
  }
  console.log('--- FIN PETICIÓN A /api/dj ---');
});

// Proxy para comprobantes
app.post('/api/comprobante', async (req, res) => {
  console.log('--- NUEVA PETICIÓN A /api/comprobante ---');
  try {
  console.log('Request Body recibido:', req.body);
  const body = req.body || {};
  const token = body.token || req.query.token;
  const payload = body.payload || body || {};
  const environment = body.environment || req.query.environment || 'test';
    
    const apiUrl = environment === 'production'
      ? 'https://app.arba.gov.ar/a122rSrv/api/external'
      : 'https://app.test.arba.gov.ar/a122rSrv/api/external';
    
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    const url = `${apiUrl}/comprobante`;
    console.log('Enviando petición a ARBA:', { url, options: fetchOptions });

    const response = await fetch(url, fetchOptions);
    let data;
    try {
      data = await response.json();
    } catch (err) {
      const text = await response.text().catch(() => null);
      console.warn('Respuesta de ARBA no-JSON para /api/comprobante, status:', response.status);
      if (text) return res.status(response.status).json({ message: text });
      return res.status(response.status).json({ message: 'Respuesta inválida del servidor' });
    }
    console.log('Respuesta de ARBA recibida:', data);
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Error en /api/comprobante:', error);
    res.status(500).json({ error: error.message });
  }
  console.log('--- FIN PETICIÓN A /api/comprobante ---');
});

// Proxy para cerrar DJ (POST /external/declaraciones-juradas/{id}/cierre)
app.post('/api/arba/closeDJ', async (req, res) => {
  console.log('--> NUEVA PETICIÓN A /api/arba/closeDJ ---');
  try {
    const { token, idDj, environment } = req.body;
    const apiUrl = environment === 'production'
      ? 'https://app.arba.gov.ar/a122rSrv/api/external'
      : 'https://app.test.arba.gov.ar/a122rSrv/api/external';
    const url = `${apiUrl}/declaraciones-juradas/${idDj}/cierre`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    let data;
    try {
      data = await response.json();
    } catch (err) {
      const text = await response.text().catch(() => null);
      console.warn('Respuesta de ARBA no-JSON para /api/arba/closeDJ, status:', response.status);
      if (text) return res.status(response.status).json({ message: text });
      return res.status(response.status).json({ message: 'Respuesta inválida del servidor' });
    }
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error en /api/arba/closeDJ:', error);
    res.status(500).json({ error: error.message });
  }
  console.log('--> FIN PETICIÓN A /api/arba/closeDJ ---');
});

// Proxy para consultar DJ (GET /external/declaraciones-juradas?{params})
app.get('/api/arba/declaraciones-juradas', async (req, res) => {
  console.log('--> NUEVA PETICIÓN A /api/arba/declaraciones-juradas ---');
  try {
    const { token, environment } = req.query;
    const apiUrl = environment === 'production'
      ? 'https://app.arba.gov.ar/a122rSrv/api/external'
      : 'https://app.test.arba.gov.ar/a122rSrv/api/external';
    const queryString = new URLSearchParams(req.query).toString();
    const url = `${apiUrl}/declaraciones-juradas?${queryString}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    let data;
    try {
      data = await response.json();
    } catch (err) {
      const text = await response.text().catch(() => null);
      console.warn('Respuesta de ARBA no-JSON para /api/arba/declaraciones-juradas, status:', response.status);
      if (text) return res.status(response.status).json({ message: text });
      return res.status(response.status).json({ message: 'Respuesta inválida del servidor' });
    }
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error en /api/arba/declaraciones-juradas:', error);
    res.status(500).json({ error: error.message });
  }
  console.log('--> FIN PETICIÓN A /api/arba/declaraciones-juradas ---');
});

// Proxy para obtener PDF de comprobante (GET /external/comprobantePdf?comprobante={id})
app.get('/api/arba/comprobantePdf', async (req, res) => {
  console.log('--> NUEVA PETICIÓN A /api/arba/comprobantePdf ---');
  try {
    const { token, environment, comprobante } = req.query;
    const apiUrl = environment === 'production'
      ? 'https://app.arba.gov.ar/a122rSrv/api/external'
      : 'https://app.test.arba.gov.ar/a122rSrv/api/external';
    const url = `${apiUrl}/comprobantePdf?comprobante=${comprobante}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    // If content-type is json/text, attempt to forward parsed JSON or text
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json') || contentType.includes('text/')) {
      try {
        const data = await response.json();
        return res.status(response.status).json(data);
      } catch (err) {
        const text = await response.text().catch(() => null);
        if (text) return res.status(response.status).send(text);
      }
    }
    // Otherwise stream binary (PDF)
    res.status(response.status);
    response.body.pipe(res);
  } catch (error) {
    console.error('Error en /api/arba/comprobantePdf:', error);
    res.status(500).json({ error: error.message });
  }
  console.log('--> FIN PETICIÓN A /api/arba/comprobantePdf ---');
});

// Simple stub para API local (ERP) utilizada por el frontend en pruebas.
// Endpoint: POST /api/process-file
// Body esperado: { filePath: string, settings: { ... } }
app.post('/api/process-file', async (req, res) => {
  console.log('--> PETICIÓN A /api/process-file (stub) ---');
  try {
    const { filePath, settings } = req.body || {};
    // Respuesta de ejemplo (VoucherResult[])
    const results = [
      {
        fileName: filePath || 'r0000001.csv',
        success: true,
        comprobanteId: 'CMP-EXAMPLE-1',
        message: 'Procesado (stub)'
      }
    ];
    res.json({ results });
  } catch (error) {
    console.error('Error en /api/process-file (stub):', error);
    res.status(500).json({ error: error.message });
  }
  console.log('--> FIN PETICIÓN A /api/process-file ---');
});

const PORT = 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Proxy servidor corriendo en puerto ${PORT}`);
  });
}

export default app;