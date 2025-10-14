export type Environment = 'test' | 'production';

interface ArbaApiConfig {
  apiUrl: string;
  authUrl: string;
}

const arbaConfig: Record<Environment, ArbaApiConfig> = {
  test: {
    apiUrl: 'https://dfe.test.arba.gov.ar/ARBANet.Retenciones/v1',
    authUrl: 'https://login.test.arba.gov.ar/Auth/v1/Token',
  },
  production: {
    apiUrl: 'https://dfe.arba.gov.ar/ARBANet.Retenciones/v1',
    authUrl: 'https://login.arba.gov.ar/Auth/v1/Token',
  },
};

export const getArbaApiConfig = (env: Environment): ArbaApiConfig => {
  return arbaConfig[env];
};
