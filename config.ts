export type Environment = 'test' | 'production';

interface ArbaApiConfig {
  apiUrl: string;
  authUrl: string;
  clientId: string;
  clientSecret: string;
}

const arbaConfig: Record<Environment, ArbaApiConfig> = {
  test: {
    // ✅ Endpoints corregidos según Manual de Integración Técnica A122R
    apiUrl: 'https://app.test.arba.gov.ar/a122rSrv/api/external',
    authUrl: 'https://app.test.arba.gov.ar/auth/token',
    // Credenciales de testing - proporcionadas por ARBA
    clientId: 'arbanet-client',
    clientSecret: 'arbanet-secret',
  },
  production: {
    // ✅ Endpoints de producción según Manual
    apiUrl: 'https://app.arba.gov.ar/a122rSrv/api/external',
    authUrl: 'https://app.arba.gov.ar/auth/token',
    // Credenciales de producción - deben ser proporcionadas por ARBA
    clientId: 'arbanet-client',
    clientSecret: 'arbanet-secret',
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