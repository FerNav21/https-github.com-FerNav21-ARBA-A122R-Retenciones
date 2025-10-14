# Sistema de Procesamiento Automatizado ARBA A-122R

## 1. Descripción General

Este proyecto es una aplicación web diseñada para actuar como una interfaz de control para un sistema automatizado de procesamiento de retenciones **ARBA A-122R**. La aplicación simula un flujo de trabajo empresarial (ERP) donde un archivo de retención, generado en un formato específico, es procesado de manera transparente a través de las APIs de ARBA.

La interfaz no procesa los archivos directamente en el navegador. En su lugar, invoca a una **API local (backend)** que es responsable de:
1.  Leer un archivo CSV desde una carpeta de red compartida.
2.  Orquestar el flujo completo de llamadas a la API de ARBA (Autenticación, Inicio de DJ, Alta de Comprobante).
3.  Descargar el comprobante en formato PDF.
4.  Guardar el PDF en la misma carpeta de red, renombrándolo para que coincida con el archivo CSV original.

Esta arquitectura separa la interfaz de usuario de la lógica de negocio y el manejo de archivos, creando un sistema robusto y seguro.

## 2. Características Principales

-   **Interfaz de Control**: Permite iniciar y monitorear el procesamiento de un único archivo de retención a la vez.
-   **Flujo Automatizado**: Orquesta todo el proceso de ARBA con un solo clic, desde la autenticación hasta la generación del PDF.
-   **Configuración Centralizada**: Un panel de ajustes permite configurar todos los parámetros necesarios (credenciales, ambiente, URLs, etc.).
-   **Monitor de Progreso en Tiempo Real**: Muestra el estado de cada paso del proceso (Autenticación, DJ, Alta, PDF).
-   **Manejo de Errores**: Exhibe mensajes de error claros si alguna etapa del proceso falla.
-   **Simulación de Entorno Real**: El flujo de la aplicación simula fielmente la interacción entre un ERP, un servicio backend y las APIs de ARBA.

## 3. Guía de Configuración

Antes de usar la aplicación, es crucial configurar todos los parámetros correctamente. Haz clic en el botón **Ajustes ⚙️** en la esquina superior derecha para abrir el panel de configuración.

### Secciones de Configuración

1.  **Ambiente de ARBA**:
    -   `Ambiente API`: Selecciona entre `Pruebas (Test)` o `Producción`. Esto determina qué conjunto de URLs de ARBA se utilizarán.

2.  **Credenciales de Agente**:
    -   `CUIT del Agente`: El CUIT de la empresa que actúa como agente de retención.
    -   `Clave de Identificación Tributaria (CIT)`: La contraseña (CIT) asociada a ese CUIT.

3.  **Período de DJ por Defecto**:
    -   `Año`: El año fiscal para el cual se declarará la retención (ej: `2024`).
    -   `Mes`: El mes del período fiscal (ej: `7` para Julio).
    -   `Quincena`: La quincena del mes (`1` o `2`).
    -   `ID de Actividad`: El código de actividad correspondiente.

4.  **Configuración de Integración Local**:
    -   `URL de API Local`: La URL completa del endpoint en tu servidor backend que recibe la solicitud de procesamiento (ej: `http://localhost:3000/api/procesar-retencion`).
    -   `Ruta de Carpeta en Red`: La ruta UNC donde el backend buscará los archivos CSV y guardará los PDF resultantes (ej: `\\servidor-erp\retenciones\`).

## 4. Flujo de Trabajo y Uso

El objetivo es procesar un archivo de retención que ya existe en la carpeta de red configurada.

1.  **Ingresar Nombre del Archivo**: En el campo "Nombre del Archivo", escribe el nombre exacto del archivo CSV que tu API local debe procesar. Debe seguir el formato 8.3 (ej: `r0012345.csv`).
2.  **Simular Lectura del Servidor**: Dado que un navegador no puede acceder a rutas de red locales, debes ayudar a la simulación. Haz clic en "Seleccionar Archivo" y elige el mismo archivo CSV desde tu máquina. La aplicación usará el contenido de este archivo para la simulación.
3.  **Iniciar Proceso**: Haz clic en el botón **"Procesar Archivo"**.
4.  **Monitorear Progreso**: La sección de estado se actualizará en tiempo real, mostrando cada paso del flujo:
    -   `Llamando a API Local...`
    -   `Paso 1/4: Autenticando con ARBA...`
    -   `Paso 2/4: Iniciando Declaración Jurada...`
    -   `Paso 3/4: Subiendo datos del comprobante...`
    -   `Paso 4/4: Generando PDF del comprobante...`
    -   `¡Proceso completado con éxito!`
5.  **Ver Resultados**:
    -   **Éxito**: Se mostrará un mensaje de éxito y un botón **"Descargar PDF"**. El archivo descargado tendrá el mismo nombre que el CSV pero con extensión `.pdf`.
    -   **Error**: Se mostrará un mensaje de error detallando en qué paso falló el proceso y por qué.

## 5. Formato del Archivo CSV

El archivo CSV a procesar debe contener **una única retención** y no debe tener una fila de encabezado. La estructura debe ser la siguiente, con valores separados por comas:

`cuitContribuyente,sucursal,alicuota,baseImponible,importeRetencion,razonSocialContribuyente,fechaOperacion`

**Ejemplo de contenido para `r0012345.csv`:**
```csv
20304050601,001,3.5,10000.00,350.00,Empresa de Ejemplo S.A.,2024-07-31T15:30:00.000
```

| Campo                     | Descripción                                         | Formato / Ejemplo         |
| ------------------------- | --------------------------------------------------- | ------------------------- |
| `cuitContribuyente`       | CUIT del sujeto retenido.                           | `20304050601`             |
| `sucursal`                | Código de sucursal.                                 | `001`                     |
| `alicuota`                | Alícuota aplicada.                                  | `3.5`                     |
| `baseImponible`           | Monto sobre el cual se calcula la retención.        | `10000.00`                |
| `importeRetencion`        | Monto final retenido.                               | `350.00`                  |
| `razonSocialContribuyente`| Nombre o razón social del sujeto retenido.          | `Empresa de Ejemplo S.A.` |
| `fechaOperacion`          | Fecha y hora de la operación.                       | `YYYY-MM-DDTHH:MM:SS.ms`  |


## 6. Despliegue con Docker

Para ejecutar esta aplicación en un contenedor Docker, sigue estos pasos. Esta configuración utiliza un servidor web Nginx ligero para servir los archivos estáticos.

**1. Crear el `Dockerfile`:**
Crea un archivo llamado `Dockerfile` en el mismo directorio que los archivos de la aplicación. Copia y pega el siguiente contenido:

```dockerfile
# Usar una imagen ligera de Nginx para servir el contenido estático
FROM nginx:alpine

# Copiar todos los archivos de la aplicación al directorio raíz del servidor web
COPY . /usr/share/nginx/html

# Exponer el puerto 80 para el servidor Nginx
EXPOSE 80

# Comando para ejecutar Nginx en primer plano cuando el contenedor se inicie
CMD ["nginx", "-g", "daemon off;"]
```

**2. Construir la Imagen Docker:**
Abre una terminal, navega al directorio de tu proyecto y ejecuta:
```bash
docker build -t sistema-arba .
```

**3. Ejecutar el Contenedor Docker:**
Una vez construida la imagen, ejecuta el contenedor con el siguiente comando:
```bash
docker run -p 8080:80 --name app-arba -d sistema-arba
```

La aplicación estará disponible en tu navegador web en la dirección `http://localhost:8080`.
