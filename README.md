# Sistema de Procesamiento Automatizado ARBA A-122R

## 1. Descripción General

Este proyecto es una aplicación web diseñada para actuar como una interfaz de control para un sistema automatizado de procesamiento de retenciones **ARBA A-122R**. La aplicación simula un flujo de trabajo empresarial (ERP) donde un archivo de retención, generado en un formato específico, es procesado de manera transparente a través de las APIs de ARBA.

La interfaz no procesa los archivos directamente en el navegador. En su lugar, invoca a una **API local (backend)** que es responsable de:
1.  Leer un archivo CSV desde una carpeta de red compartida.
2.  Orquestar el flujo completo de llamadas a la API de ARBA (Autenticación, **Gestión de DJ**, Alta de Comprobante).
3.  Descargar el comprobante en formato PDF.
4.  Guardar el PDF en la misma carpeta de red, renombrándolo para que coincida con el archivo CSV original.

Esta arquitectura separa la interfaz de usuario de la lógica de negocio y el manejo de archivos, creando un sistema robusto y seguro.

## 2. Características Principales

-   **Interfaz de Control**: Permite iniciar y monitorear el procesamiento de un único archivo de retención a la vez.
-   **Gestión de DJ Inteligente**: Determina automáticamente la quincena correcta, reutiliza DJs abiertas y simula el cierre y apertura de nuevas DJs al cambiar de período.
-   **Flujo Automatizado**: Orquesta todo el proceso de ARBA con un solo clic, desde la autenticación hasta la generación del PDF.
-   **Configuración Centralizada**: Un panel de ajustes permite configurar todos los parámetros necesarios (credenciales, ambiente, URLs, etc.).
-   **Monitor de Progreso en Tiempo Real**: Muestra el estado de cada paso del proceso (Autenticación, Verificación de DJ, Alta, PDF).
-   **Manejo de Errores**: Exhibe mensajes de error claros si alguna etapa del proceso falla.

## 3. Gestión Automática de Declaraciones Juradas (DJ)

Una de las características más importantes de este sistema es su capacidad para gestionar el ciclo de vida de las Declaraciones Juradas de forma automática, asegurando que cada retención se impute al período fiscal correcto.

El proceso es el siguiente:

1.  **Cálculo del Período Actual**: Antes de procesar una retención, el sistema determina el período fiscal actual basándose en la fecha del día (Año, Mes y Quincena).
    -   **Primera Quincena**: Días 1 al 15 del mes.
    -   **Segunda Quincena**: Días 16 hasta el final del mes.

2.  **Verificación de DJ Existente**: El sistema consulta a la API de ARBA para ver si ya existe una DJ abierta para el CUIT y el período fiscal actual.

3.  **Toma de Decisiones**:
    -   **Si ya existe una DJ abierta**: El sistema la reutiliza, obteniendo su `idDj` para asociar la nueva retención. Esto evita crear múltiples DJs para un mismo período.
    -   **Si no existe una DJ**: Esto indica el inicio de un nuevo período fiscal. El sistema entonces:
        1.  **Simula el Cierre de la DJ Anterior**: En un entorno real, la API Local buscaría la DJ del período anterior (ej., la primera quincena si ahora estamos en la segunda) y enviaría una solicitud a ARBA para cerrarla.
        2.  **Abre una Nueva DJ**: Procede a crear una nueva Declaración Jurada para el período actual y utiliza el `idDj` recién generado.

Este flujo automatizado elimina la necesidad de intervención manual para abrir y cerrar períodos, reduce errores y garantiza el cumplimiento con las normativas de ARBA.

## 4. Guía de Configuración

Antes de usar la aplicación, es crucial configurar todos los parámetros correctamente. Haz clic en el botón **Ajustes ⚙️** en la esquina superior derecha para abrir el panel de configuración.

### Secciones de Configuración

1.  **Ambiente de ARBA**:
    -   `Ambiente API`: Selecciona entre `Pruebas (Test)` o `Producción`.

2.  **Credenciales de Agente**:
    -   `CUIT del Agente`: El CUIT de la empresa que actúa como agente de retención.
    -   `Clave de Identificación Tributaria (CIT)`: La contraseña (CIT) asociada a ese CUIT.

3.  **Período de DJ por Defecto**:
    -   `Año`, `Mes`, `Quincena`: **Estos valores ahora se usan como referencia y pueden ser sobreescritos por la lógica automática de gestión de DJ.**
    -   `ID de Actividad`: El código de actividad correspondiente (este sí se usa al crear una nueva DJ).

4.  **Configuración de Integración Local**:
    -   `URL de API Local`: La URL completa del endpoint en tu servidor backend.
    -   `Ruta de Carpeta en Red`: La ruta UNC donde el backend buscará los archivos CSV y guardará los PDF.

## 5. Flujo de Trabajo y Uso

1.  **Ingresar Nombre del Archivo**: Escribe el nombre exacto del archivo CSV (ej: `r0012345.csv`).
2.  **Simular Lectura del Servidor**: Haz clic en "Seleccionar Archivo" y elige el mismo archivo CSV desde tu máquina.
3.  **Iniciar Proceso**: Haz clic en **"Procesar Archivo"**.
4.  **Monitorear Progreso**: La sección de estado se actualizará en tiempo real, mostrando el nuevo flujo:
    -   `Llamando a API Local...`
    -   `Paso 1/5: Autenticando con ARBA...`
    -   `Paso 2/5: Verificando DJ abierta para el período actual...`
    -   `Paso 3/5: Subiendo datos del comprobante...`
    -   `Paso 4/5: Generando PDF del comprobante...`
    -   `¡Proceso completado con éxito!`
5.  **Ver Resultados**:
    -   **Éxito**: Se mostrará un mensaje de éxito y un botón **"Descargar PDF"**.
    -   **Error**: Se mostrará un mensaje de error detallado.

## 6. Formato del Archivo CSV

El archivo CSV a procesar debe contener **una única retención** y no debe tener una fila de encabezado.

`cuitContribuyente,sucursal,alicuota,baseImponible,importeRetencion,razonSocialContribuyente,fechaOperacion`

**Ejemplo:**
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


## 7. Despliegue con Docker

Para ejecutar esta aplicación en un contenedor Docker, sigue estos pasos.

**1. Crear el `Dockerfile`:**
Crea un archivo llamado `Dockerfile` en el mismo directorio que los archivos de la aplicación.
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
Una vez construida la imagen, ejecuta el contenedor:
```bash
docker run -p 8080:80 --name app-arba -d sistema-arba
```

La aplicación estará disponible en `http://localhost:8080`.