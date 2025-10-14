# Sistema de Procesamiento Automatizado ARBA A-122R

## 1. Introducción y Visión General

Esta aplicación es una interfaz web diseñada para automatizar y simplificar la interacción con la API de Servicios A-122R de ARBA. Su objetivo principal es actuar como un **panel de control para un flujo de trabajo de backend automatizado**, simulando cómo un sistema ERP se integraría de forma transparente para procesar retenciones del Impuesto sobre los Ingresos Brutos.

El sistema está diseñado para:
1.  **Ser configurado** con las credenciales del agente y los parámetros de la API.
2.  **Orquestar el ciclo de vida completo** de una retención a través de una API local simulada.
3.  **Manejar automáticamente las Declaraciones Juradas (DJ)**, incluyendo la consulta, el cierre de períodos anteriores y la apertura de nuevos períodos.
4.  **Proporcionar feedback en tiempo real** sobre cada paso del proceso.

## 2. Arquitectura del Sistema

El ecosistema completo se compone de tres partes:

1.  **Sistema ERP (Ej: basado en COBOL)**: Es el sistema principal donde se registran las retenciones. Su única responsabilidad es generar un archivo `.csv` con los datos de la retención y llamar a la API Local.
2.  **API Local (Backend)**: Es el corazón del sistema. Un servicio (no incluido en este proyecto, pero simulado) que reside en la red local del agente. Recibe la llamada del ERP, lee el archivo `.csv` de una carpeta compartida y orquesta todas las llamadas a la API de ARBA.
3.  **Esta Aplicación Web (Frontend)**: Actúa como la interfaz de configuración y monitorización. Permite definir los parámetros de conexión, las credenciales y ejecutar manualmente el proceso para pruebas o contingencias.

## 3. Flujo de Trabajo y Uso

La aplicación se centra en un flujo de trabajo que imita una integración de backend.

### 3.1. Creación de una Retención

1.  **Generación del Archivo**: Desde el ERP, se genera un archivo `.csv` con un nombre en formato `8.3` (ej: `r0012345.csv`) y se deposita en una carpeta de red configurada.
2.  **Llamada a la API Local**: El ERP invoca un *endpoint* de la API Local, pasándole el nombre del archivo a procesar.
3.  **Proceso en la Interfaz Web**:
    *   Navega a la pestaña **"Crear Retención"**.
    *   Introduce el nombre del archivo (ej: `r0012345.csv`).
    *   Selecciona el archivo `.csv` correspondiente desde tu máquina local (esto simula la lectura que haría el servidor desde la carpeta de red).
    *   Haz clic en **"Iniciar Proceso"**.
4.  **Ejecución Automatizada**: La aplicación simulará la llamada a la API Local, que ejecutará los siguientes pasos:
    *   **Autenticación**: Obtiene un token de acceso de ARBA.
    *   **Gestión de DJ**: Determina la quincena actual, busca una DJ abierta, cierra la del período anterior si es necesario y crea una nueva si no existe.
    *   **Carga del Comprobante**: Envía los datos del `.csv` a la DJ correspondiente.
    *   **Generación del PDF**: Solicita el comprobante en formato PDF.
    *   **Resultado**: Muestra un mensaje de éxito con un enlace para descargar el PDF, o un mensaje de error específico.

### 3.2. Anulación de un Comprobante

1.  Navega a la pestaña **"Anular Retención"**.
2.  Introduce el **ID del comprobante** que deseas anular.
3.  Haz clic en **"Anular Comprobante"**.
4.  El sistema llamará a la API Local, que se autenticará y enviará la solicitud de anulación a ARBA.

### 3.3. Generación Manual de Tokens de Acceso

Para propósitos de desarrollo o pruebas directas con la API de ARBA (usando herramientas como Postman), puedes generar un token de acceso manualmente:

1.  Asegúrate de tener configurado el CUIT y la CIT en **Ajustes**.
2.  Navega a la pestaña **"Generar Token"**.
3.  Haz clic en **"Generar Token de Acceso"**.
4.  El sistema solicitará un token al ambiente seleccionado y lo mostrará en pantalla, junto con su duración y un botón para copiarlo.

## 4. Flujo de Autenticación (Obtención de Token)

La aplicación maneja la autenticación con ARBA de forma automática. Esta sección detalla el proceso técnico subyacente, basado en el flujo **OAuth 2.0 Resource Owner Password Credentials Grant**.

El proceso es el siguiente:

1.  **Recopilación de Credenciales**: El sistema toma el **CUIT** (`username`) y la **CIT** (`password`) de los ajustes configurados por el usuario. El `client_id` y `client_secret`, que identifican a esta aplicación cliente ante ARBA, están preconfigurados en el código para este ejemplo.
2.  **Solicitud del Token**: Se realiza una petición `POST` al *endpoint* de autenticación de ARBA correspondiente al ambiente seleccionado (Pruebas o Producción).
3.  **Cuerpo de la Petición**: La petición envía los datos en formato `application/x-www-form-urlencoded` con los siguientes parámetros:
    *   `grant_type`: `password`
    *   `client_id`: El identificador de la aplicación cliente (ej: `arbanet-client`).
    *   `client_secret`: La clave secreta de la aplicación cliente.
    *   `username`: El CUIT del agente.
    *   `password`: La CIT del agente.
4.  **Respuesta del Servidor**: Si las credenciales son válidas, el servidor de ARBA responde con un objeto JSON que contiene el `access_token` de corta duración.
5.  **Uso del Token**: La aplicación utiliza este token en el encabezado `Authorization` de todas las llamadas posteriores a la API de ARBA (ej: `Authorization: Bearer <token_recibido>`).

### Ejemplo Manual con cURL (Ambiente de Pruebas)

```bash
curl -X POST https://login.test.arba.gov.ar/Auth/v1/Token \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "grant_type=password" \
-d "client_id=arbanet-client" \
-d "client_secret=arbanet-secret" \
-d "username=SU_CUIT_AQUI" \
-d "password=SU_CIT_AQUI"
```

## 5. Formato del Archivo CSV

El archivo `.csv` o `.txt` a procesar debe tener una estructura simple:
-   **Una línea de encabezado** (será ignorada por el procesador).
-   **Líneas de datos** donde cada línea representa un comprobante.
-   Columnas separadas por comas (`,`).
-   No debe contener comillas en los campos.

**Estructura de las columnas:**
`cuitContribuyente,sucursal,alicuota,baseImponible,importeRetencion,razonSocialContribuyente,fechaOperacion`

**Ejemplo de contenido:**

```csv
cuit_contribuyente,sucursal,alicuota,base_imponible,importe_retencion,razon_social,fecha_operacion
20304050601,1,2.5,10000.00,250.00,Empresa Ejemplo SRL,2024-07-18T10:30:00
```

## 6. Guía de Despliegue (Docker en Windows Server)

Esta aplicación está diseñada para ser desplegada fácilmente como un contenedor de Docker.

### Prerrequisitos
- Windows Server con Docker Desktop o Docker Engine instalado.
- Los archivos de esta aplicación (`Dockerfile`, `docker-compose.yml`, `nginx.conf`, y el resto del código fuente).

### Pasos para el Despliegue

1.  **Clonar o Copiar el Proyecto**: Asegúrate de tener todos los archivos del proyecto en una carpeta dentro de tu servidor (ej: `C:\apps\arba-frontend`).

2.  **Abrir una Terminal**: Abre PowerShell o el Símbolo del sistema en tu servidor.

3.  **Navegar al Directorio del Proyecto**:
    ```powershell
    cd C:\apps\arba-frontend
    ```

4.  **Construir y Ejecutar el Contenedor**: Utiliza `docker-compose` para automatizar el proceso. Este comando leerá el archivo `docker-compose.yml`, construirá la imagen de Docker según las instrucciones del `Dockerfile` y la ejecutará como un contenedor.
    ```powershell
    docker-compose up -d --build
    ```
    -   `-d`: Ejecuta el contenedor en modo "detached" (en segundo plano).
    -   `--build`: Fuerza la reconstrucción de la imagen si ha habido cambios.

5.  **Verificar el Contenedor**: Puedes comprobar que el contenedor se está ejecutando correctamente con el siguiente comando:
    ```powershell
    docker ps
    ```
    Deberías ver un contenedor llamado `arba_frontend_app` en la lista, con el estado "Up".

6.  **Acceder a la Aplicación**:
    -   Abre un navegador web en el servidor o en cualquier máquina de la misma red.
    -   Navega a `http://<IP_DEL_SERVIDOR>:8080`.
    -   Deberías ver la interfaz de la aplicación lista para ser utilizada.

### Detener la Aplicación

Para detener el contenedor, navega al directorio del proyecto en la terminal y ejecuta:
```powershell
docker-compose down
```

## 7. Configuración de la Aplicación

Todos los parámetros se configuran a través de la interfaz gráfica, haciendo clic en el botón **"Ajustes"**.

-   **Ambiente de ARBA**: Permite cambiar entre los *endpoints* de Pruebas y Producción.
-   **Credenciales de Agente**: Aquí debes introducir el CUIT y la CIT del agente de retención.
-   **Período de DJ por Defecto**: Valores que se usarán para crear nuevas Declaraciones Juradas.
-   **Integración Local**:
    -   **URL de API Local**: El *endpoint* del servicio de backend que orquesta el proceso.
    -   **Ruta de Carpeta en Red**: La ruta UNC donde el ERP deposita los archivos `.csv`.

## 8. Integración con ERP (Ejemplo COBOL)

Para lograr una automatización completa, el sistema ERP debe generar el archivo `.csv` y llamar a la API Local. A continuación, se muestra un ejemplo conceptual en **RM/COBOL-85 para un entorno Windows**.

### Flujo de Trabajo

1.  **Programa COBOL (`generar_retencion.cbl`)**:
    *   Se ejecuta cuando un usuario guarda una retención.
    *   Recopila los datos de la retención.
    *   Formatea y escribe el archivo `.csv` en una ruta de salida.
    *   Utiliza la instrucción `CALL "SYSTEM"` para ejecutar un script `.bat`, pasándole el nombre del archivo como parámetro.
2.  **Script Batch (`llamar_api.bat`)**:
    *   Recibe el nombre del archivo del programa COBOL.
    *   Utiliza una herramienta como `curl` para realizar la llamada `HTTP POST` a la API Local, enviando el nombre del archivo en formato JSON.

### Ejemplo: `generar_retencion.cbl` (Conceptual)

```cobol
IDENTIFICATION DIVISION.
PROGRAM-ID. GENRET.
*... (Environment Division, etc.)
DATA DIVISION.
FILE-SECTION.
FD  RET-FILE.
01  RET-RECORD              PIC X(255).

WORKING-STORAGE SECTION.
01  WS-RET-DATA.
    05 WS-CUIT-CONTRIB      PIC X(11).
    05 FILLER               PIC X(1) VALUE ",".
    *... (resto de los campos del CSV)
    05 WS-FECHA-OPER        PIC X(19).

01  WS-FILE-PATH            PIC X(100).
01  WS-FILE-NAME            PIC X(12).
01  WS-COMMAND              PIC X(200).
01  WS-RET-NUMBER           PIC 9(8).

PROCEDURE DIVISION.
MAIN-LOGIC.
    *--- 1. Obtener datos de la retención del ERP.
    MOVE "20304050601"       TO WS-CUIT-CONTRIB.
    MOVE "2024-07-18T10:30:00" TO WS-FECHA-OPER.
    *... (mover el resto de los datos)
    MOVE 12345              TO WS-RET-NUMBER.

    *--- 2. Construir el nombre del archivo CSV.
    STRING "r" FUNCTION ZEROFill(WS-RET-NUMBER) ".csv"
        DELIMITED BY SIZE
        INTO WS-FILE-NAME.
    
    STRING "C:\TEMP\" WS-FILE-NAME
        DELIMITED BY SIZE
        INTO WS-FILE-PATH.

    *--- 3. Escribir el archivo CSV.
    OPEN OUTPUT RET-FILE.
    * Escribir encabezado (opcional, el parser lo salta)
    STRING "cuit,...fecha" DELIMITED BY SIZE INTO RET-RECORD.
    WRITE RET-RECORD.
    * Escribir datos
    MOVE WS-RET-DATA TO RET-RECORD.
    WRITE RET-RECORD.
    CLOSE RET-FILE.

    *--- 4. Llamar al script para invocar la API.
    STRING "llamar_api.bat " WS-FILE-NAME
        DELIMITED BY SIZE
        INTO WS-COMMAND.

    CALL "SYSTEM" USING WS-COMMAND.

    STOP RUN.
```

### Ejemplo: `llamar_api.bat`

```batch
@echo off
SETLOCAL

REM El primer argumento (%1) es el nombre del archivo pasado desde COBOL
SET FILENAME=%1
SET API_URL="http://localhost:3000/api/process-file"

echo Procesando archivo: %FILENAME%

REM Utilizar curl para llamar a la API Local
curl -X POST %API_URL% ^
-H "Content-Type: application/json" ^
-d "{\"fileName\": \"%FILENAME%\"}"

ENDLOCAL
```
