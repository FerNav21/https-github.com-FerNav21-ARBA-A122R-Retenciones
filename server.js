import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

// Proxy para autenticación
app.post('/api/auth', async (req, res) => {
  console.log('--- NUEVA PETICIÓN A /api/auth ---');
  try {
    console.log('Request Body recibido:', req.body);
    const { username, password, environment } = req.body;
    
    const authUrl = environment === 'production'
      ? 'https://idp.arba.gov.ar/realms/ARBA/protocol/openid-connect/token'
      : 'https://idp.test.arba.gov.ar/realms/ARBA/protocol/openid-connect/token';
    
    const clientSecret = environment === 'production'
      ? 'k1pwZG4dRrK88KpMfK6ACqav1SNDiCa'
      : '44cqahkhERKtkkDGmcqrPApCMtez3Xxt';
    
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', 'A122RServicios');
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

    const data = await response.json();
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
    const { token, payload, environment } = req.body;
    
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

    const data = await response.json();
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
    const { token, payload, environment } = req.body;
    
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

    const data = await response.json();
    console.log('Respuesta de ARBA recibida:', data);
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Error en /api/comprobante:', error);
    res.status(500).json({ error: error.message });
  }
  console.log('--- FIN PETICIÓN A /api/comprobante ---');
});

const PORT = 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Proxy servidor corriendo en puerto ${PORT}`);
  });
}

export default app;