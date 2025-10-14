// En una aplicación real con un proceso de build (como Vite o Webpack),
// estas variables provendrían de archivos .env (ej: .env.development, .env.production)
// y serían inyectadas en tiempo de compilación.
// Este archivo simula ese comportamiento para esta aplicación estática.

export const credentials = {
  test: {
    clientId: 'test-client-id', // Reemplazar con credenciales de prueba reales
    clientSecret: 'test-client-secret', // Reemplazar con credenciales de prueba reales
  },
  production: {
    clientId: 'prod-client-id', // Reemplazar con credenciales de producción reales
    clientSecret: 'prod-client-secret', // Reemplazar con credenciales de producción reales
  },
};

export const endpoints = {
  test: {
    apiBaseUrl: 'https://app.test.arba.gov.ar/a122rSrv/api/external',
    // La URL del token es una suposición basada en la documentación. Confirmar con ARBA.
    authTokenEndpoint: 'https://id.test.arba.gov.ar/IdP/auth/realms/arba/protocol/openid-connect/token',
  },
  production: {
    // Las URLs de producción son hipotéticas. Reemplazar con las URLs reales de ARBA.
    apiBaseUrl: 'https://www.arba.gov.ar/a122rSrv/api/external',
    authTokenEndpoint: 'https://id.arba.gov.ar/IdP/auth/realms/arba/protocol/openid-connect/token',
  },
};