export type Environment = 'test' | 'production';

interface ArbaApiConfig {
  apiUrl: string;
  authUrl: string;
  clientId: string;
  clientSecret: string;
}
const USE_PROXY = true; // Cambiar según necesidad

const arbaConfig: Record<Environment, ArbaApiConfig> = {
  test: {
    apiUrl: USE_PROXY ? 'http://localhost:3001/api' : 'https://app.test.arba.gov.ar/a122rSrv/api/external',
    authUrl: USE_PROXY ? 'http://localhost:3001/api/auth' : 'https://idp.test.arba.gov.ar/realms/ARBA/protocol/openid-connect/token',
    clientId: 'A122RServicios',
    clientSecret: '44cqahkhERKtkkDGmcqrPApCMtez3Xxt',
  },
  production: {
    // ✅ Endpoints de producción según Manual
     apiUrl: USE_PROXY
      ? 'http://localhost:3001/api/arba'
      : 'https://app.arba.gov.ar/a122rSrv/api/external',
    authUrl: USE_PROXY
      ? 'http://localhost:3001/api/arba/auth'
      : 'https://idp.arba.gov.ar/realms/ARBA/protocol/openid-connect/token',
    
    // Credenciales de producción - deben ser proporcionadas por ARBA
    clientId: 'A122RServicios',
    clientSecret: 'k1pwZG4dRrK88KpMfK6ACqav1SNDiCa',
  },
};

export const getArbaApiConfig = (
  env: Environment,
  customCredentials?: { clientId?: string; clientSecret?: string }
): ArbaApiConfig => {
  const baseConfig = arbaConfig[env];
  
  // Si se proporcionan credenciales personalizadas, usarlas
  if (customCredentials?.clientId && customCredentials?.clientSecret) {
    return {
      ...baseConfig,
      clientId: customCredentials.clientId,
      clientSecret: customCredentials.clientSecret,
    };
  }
  
  return baseConfig;
};