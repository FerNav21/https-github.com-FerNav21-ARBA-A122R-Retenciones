import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

// Proxy para autenticación
app.post('/api/arba/auth', async (req, res) => {
  try {
    const { username, password, clientId, clientSecret, environment } = req.body;
    
    const authUrl = environment === 'production'
      ? 'https://app.arba.gov.ar/auth/token'
      : 'https://idp.test.arba.gov.ar/realms/ARBA/protocol/openid-connect/token';
    
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', 'A122RServicios');
    params.append('client_secret', '44cqahkhERKtkkDGmcqrPApCMtez3Xxt');
    params.append('username', username);
    params.append('password', password);
    params.append('scope', 'openid');

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy para otros endpoints
app.post('/api/arba/dj', async (req, res) => {
  try {
    const { token, payload, environment } = req.body;
    
    const apiUrl = environment === 'production'
      ? 'https://app.arba.gov.ar/a122rSrv/api/external'
      : 'https://app.test.arba.gov.ar/a122rSrv/api/external';
    
    const response = await fetch(`${apiUrl}/declaracionJurada`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy para comprobantes
app.post('/api/arba/comprobante', async (req, res) => {
  try {
    const { token, payload, environment } = req.body;
    
    const apiUrl = environment === 'production'
      ? 'https://app.arba.gov.ar/a122rSrv/api/external'
      : 'https://app.test.arba.gov.ar/a122rSrv/api/external';
    
    const response = await fetch(`${apiUrl}/comprobante`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});