/**
 * @file config.ts
 * @description
 * Este archivo centraliza la configuración para la comunicación con la API de ARBA.
 * Define los endpoints, Client IDs y Client Secrets para los entornos de 'test' y 'production'.
 * También proporciona una función para obtener la configuración correcta según el entorno
 * y permite anular las credenciales por defecto con valores personalizados.
 */

/**
 * @typedef {'test' | 'production'} Environment
 * @description Define los posibles entornos de ejecución.
 */
export type Environment = 'test' | 'production';

/**
 * @interface ArbaApiConfig
 * @description Define la estructura del objeto de configuración para un entorno de la API de ARBA.
 * @property {string} apiUrl - La URL base para las operaciones principales de la API.
 * @property {string} authUrl - La URL del endpoint de autenticación para obtener tokens.
 * @property {string} clientId - El ID de cliente de OAuth proporcionado por ARBA.
 * @property {string} clientSecret - El secreto de cliente de OAuth proporcionado por ARBA.
 */
interface ArbaApiConfig {
  apiUrl: string;
  authUrl: string;
  clientId: string;
  clientSecret: string;
}

/**
 * @const {boolean} USE_PROXY
 * @description
 * Un interruptor para habilitar o deshabilitar el uso de un proxy local.
 * Si es `true`, las solicitudes se dirigirán a `http://localhost:3001` en lugar de a los
 * servidores de ARBA directamente. Útil para desarrollo y depuración.
 */
const USE_PROXY = false;

/**
 * @const {Record<Environment, ArbaApiConfig>} arbaConfig
 * @description
 * Un objeto que almacena la configuración específica para cada entorno.
 */
const arbaConfig: Record<Environment, ArbaApiConfig> = {
  test: {
    apiUrl: USE_PROXY
      ? 'http://localhost:3001/api/arba'
      : 'https://app.test.arba.gov.ar/a122rSrv/api/external',
    authUrl: USE_PROXY
      ? 'http://localhost:3001/api/arba/auth'
      : 'https://idp.test.arba.gov.ar/realms/ARBA/protocol/openid-connect/token',
    clientId: 'A122RServicios',
    clientSecret: '44cqahkhERKtkkDGmcqrPApCMtez3Xxt',
  },
  production: {
    apiUrl: USE_PROXY
      ? 'http://localhost:3001/api/arba'
      : 'https://app.arba.gov.ar/a122rSrv/api/external',
    authUrl: USE_PROXY
      ? 'http://localhost:3001/api/arba/auth'
      : 'https://idp.arba.gov.ar/realms/ARBA/protocol/openid-connect/token',
    clientId: 'A122RServicios',
    clientSecret: 'k1pwZG4dRrK88KpMfK6ACqav1SNDiCa',
  },
};

/**
 * @function getArbaApiConfig
 * @description
 * Obtiene la configuración de la API para un entorno específico.
 * Permite anular las credenciales por defecto (clientId y clientSecret) si se
 * proporcionan credenciales personalizadas.
 *
 * @param {Environment} env - El entorno deseado ('test' o 'production').
 * @param {object} [customCredentials] - Un objeto opcional para anular las credenciales.
 * @param {string} [customCredentials.clientId] - El Client ID personalizado.
 * @param {string} [customCredentials.clientSecret] - El Client Secret personalizado.
 * @returns {ArbaApiConfig} La configuración completa para el entorno especificado.
 */
export const getArbaApiConfig = (
  env: Environment,
  customCredentials?: { clientId?: string; clientSecret?: string }
): ArbaApiConfig => {
  const baseConfig = arbaConfig[env];
  
  // Si se proporcionan credenciales personalizadas y son válidas, se usan.
  if (customCredentials?.clientId && customCredentials?.clientSecret) {
    return {
      ...baseConfig,
      clientId: customCredentials.clientId,
      clientSecret: customCredentials.clientSecret,
    };
  }
  
  return baseConfig;
};
