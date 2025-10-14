# Sistema de Procesamiento Automatizado ARBA A-122R

Este proyecto es una aplicación web de front-end diseñada para actuar como una interfaz de control para un sistema automatizado de gestión de retenciones A-122R de ARBA. Simula un flujo de trabajo empresarial en el que un sistema ERP (Planificación de Recursos Empresariales) interactúa de forma transparente con los servicios de ARBA a través de una API local (backend).

El objetivo principal es proporcionar una herramienta para configurar, disparar y monitorear los dos procesos clave: la **creación** y la **anulación** de comprobantes de retención, demostrando un flujo de trabajo de integración completo y robusto.

## Características Principales

- **Flujo Automatizado**: Orquesta todo el proceso (autenticación, gestión de DJ, carga de comprobantes, descarga de PDF) con una sola acción.
- **Gestión Inteligente de DJ**: Determina automáticamente la quincena actual, busca DJs abiertas y simula el cierre de períodos anteriores y la apertura de nuevos.
- **Creación y Anulación**: Soporta tanto la generación de nuevos comprobantes a partir de archivos CSV como la anulación de comprobantes existentes por su ID.
- **Monitor en Tiempo Real**: Proporciona feedback paso a paso del estado del proceso que se estaría ejecutando en el servidor.
- **Configuración Centralizada**: Un panel de ajustes permite gestionar todas las credenciales, URLs de API y parámetros por defecto en un solo lugar.
- **Simulación de Integración ERP**: Incluye un ejemplo completo de cómo un programa COBOL puede generar el archivo de retención y llamar a la API local para un proceso 100% automatizado.

## Arquitectura del Sistema

El sistema está diseñado en torno a tres componentes principales que interactúan entre sí:

1.  **ERP (El Cliente)**: Es el sistema de gestión de la empresa (simulado por nuestro ejemplo en COBOL). Es responsable de:
    -   Generar el archivo `.csv` con los datos de la retención.
    -   Realizar una llamada HTTP a la API Local para iniciar el proceso.

2.  **API Local (El Orquestador / Backend)**: Es un servicio que reside en la red local de la empresa. Su función es:
    -   Recibir peticiones del ERP.
    -   Leer los archivos `.csv` de una carpeta de red compartida.
    -   Contener toda la lógica de negocio para interactuar con ARBA (autenticación, gestión de DJ, etc.).
    -   Guardar los PDFs generados en la carpeta de red.
    -   Responder al ERP con el resultado de la operación.
    *(En esta aplicación, el servicio `services/localApi.ts` simula el comportamiento de esta API).*

3.  **Interfaz Web (Este Proyecto)**: Es una aplicación de front-end que sirve como panel de control para:
    -   Configurar las credenciales y parámetros del sistema.
    -   Disparar manualmente los procesos de creación o anulación (simulando la llamada del ERP).
    -   Monitorear el progreso de las operaciones en tiempo real.

## Guía de Configuración

Antes de utilizar la aplicación, es fundamental configurar los parámetros correctamente. Haz clic en el botón **Ajustes ⚙️** en la esquina superior derecha para abrir el panel de configuración.

-   **Ambiente de ARBA**: Elige entre `Pruebas (Test)` y `Producción`. Esto determina qué URLs de ARBA se utilizarán.
-   **Credenciales de Agente**:
    -   `CUIT del Agente`: Tu Clave Única de Identificación Tributaria.
    -   `Clave de Identificación Tributaria (CIT)`: Tu contraseña para los servicios de ARBA.
-   **Período de DJ por Defecto**:
    -   Estos valores se usan como respaldo o para la lógica de inicio de la DJ. La gestión automática de quincenas usará la fecha actual para determinar el período correcto.
-   **Configuración de Integración Local**:
    -   `URL de API Local`: La dirección de tu servicio de backend. El ejemplo COBOL y los scripts la utilizan para saber a dónde enviar la petición.
    -   `Ruta de Carpeta en Red`: La ubicación de la carpeta compartida donde el ERP deposita los `.csv` y la API Local guarda los `.pdf`.

## Flujo de Trabajo y Uso

La interfaz principal se divide en dos pestañas para las dos operaciones principales.

### 1. Crear una Retención

Este proceso simula la llamada que haría el ERP para procesar un nuevo archivo de retención.

1.  **Nombre del Archivo**: Introduce el nombre del archivo `.csv` que se va a procesar, siguiendo el formato 8.3 (ej: `r0012345.csv`).
2.  **Seleccionar Archivo**: Haz clic para seleccionar el archivo CSV correspondiente de tu disco local. Esto simula el acto de la API Local leyendo el archivo desde la carpeta de red.
3.  **Procesar Archivo**: Haz clic en el botón. La aplicación llamará a la API Local simulada y mostrará el progreso en tiempo real.
4.  **Resultado**: Si el proceso es exitoso, aparecerá un botón para **Descargar PDF**. Si hay un error, se mostrará el mensaje detallado.

### 2. Anular una Retención

Este proceso permite dar de baja un comprobante previamente generado.

1.  **ID del Comprobante a Anular**: Introduce el identificador numérico del comprobante que ARBA generó durante el proceso de creación.
2.  **Anular Comprobante**: Haz clic en el botón. La aplicación llamará a la API Local simulada para enviar la solicitud de anulación a ARBA.
3.  **Resultado**: El panel de estado mostrará si la anulación fue exitosa o si ocurrió un error.

## Formato del Archivo CSV

Para el proceso de creación, la API Local espera un archivo `.csv` con un formato muy específico:
-   Debe contener **una única línea** sin encabezados.
-   Debe tener **7 campos** separados por comas, en el siguiente orden:

| # | Campo                       | Formato                                | Ejemplo                        |
|---|-----------------------------|----------------------------------------|--------------------------------|
| 1 | CUIT Contribuyente          | Numérico (11 dígitos sin guiones)      | `30112233445`                  |
| 2 | Sucursal                    | Numérico                               | `1`                            |
| 3 | Alícuota                    | Numérico con punto decimal             | `2.5`                          |
| 4 | Base Imponible              | Numérico con punto decimal             | `10000.00`                     |
| 5 | Importe Retención           | Numérico con punto decimal             | `250.00`                       |
| 6 | Razón Social Contribuyente  | Texto                                  | `"Nombre Contribuyente SRL"`   |
| 7 | Fecha Operación             | `YYYY-MM-DDTHH:MM:SS`                  | `2024-07-18T10:30:00`          |

**Ejemplo de línea en CSV:**
`30112233445,1,2.5,10000.00,250.00,"Nombre Contribuyente SRL",2024-07-18T10:30:00`

## Gestión Automática de Declaraciones Juradas (DJ)

Una de las características clave de la API Local simulada es su capacidad para gestionar el ciclo de vida de las Declaraciones Juradas de forma inteligente. Esto elimina la necesidad de intervenciones manuales al cambiar de período fiscal.

El flujo es el siguiente:
1.  **Determinar Período**: La API calcula el período fiscal actual (año, mes y quincena) basándose en la fecha del servidor.
2.  **Consultar DJ Existente**: Se comunica con ARBA para verificar si ya existe una DJ en estado "abierta" para el período actual.
3.  **Reutilizar o Crear**:
    -   **Si existe una DJ abierta**: Se reutiliza su `idDj` para asociar la nueva retención.
    -   **Si no existe**: Se asume que es la primera operación de una nueva quincena. La API simula el proceso de **cerrar la DJ del período anterior** y luego **abrir una nueva DJ** para el período actual, asegurando que las retenciones siempre se imputen al período correcto.

## Integración con ERP (Ejemplo COBOL)

Para demostrar una automatización completa y transparente, a continuación se presenta un ejemplo de cómo un sistema ERP basado en COBOL puede integrarse con este flujo.

El proceso consta de dos partes: un programa COBOL que genera el archivo y un script simple que realiza la llamada a la red.

#### Paso 1: Programa COBOL para Generar el CSV y Llamar al Script

Este programa (`generar_retencion.cbl`) se ejecutaría dentro del ERP justo después de que un usuario guarda una retención.

**`erp-integration/generar_retencion.cbl`**
```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. GENRET.
       AUTHOR. ERP-System.
      *----------------------------------------------------------------*
      * Este programa simula la generación de un archivo de retención  *
      * en formato CSV y luego llama a un script externo para          *
      * enviarlo a la API Local de procesamiento de ARBA.              *
      *----------------------------------------------------------------*
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT RETENCION-FILE ASSIGN TO DISK RET-FILE-PATH
           ORGANIZATION IS LINE SEQUENTIAL.

       DATA DIVISION.
       FILE SECTION.
       FD  RETENCION-FILE.
       01  RETENCION-RECORD      PIC X(200).

       WORKING-STORAGE SECTION.
       01  WS-RETENCION-DATA.
           05 WS-CUIT-CONTRIB      PIC X(11) VALUE '30112233445'.
           05 WS-SUCURSAL          PIC 9(01) VALUE 1.
           05 WS-ALICUOTA          PIC X(04) VALUE '2.50'.
           05 WS-BASE-IMPONIBLE    PIC X(10) VALUE '10000.00'.
           05 WS-IMPORTE-RET       PIC X(07) VALUE '250.00'.
           05 WS-RAZON-SOCIAL      PIC X(26) VALUE 'Nombre Contribuyente SRL'.
           05 WS-FECHA-OPERACION   PIC X(19) VALUE '2024-07-18T10:30:00'.
       
       01  WS-CSV-RECORD           PIC X(200).
       01  WS-RET-NUMERO           PIC 9(07) VALUE 12345.
       01  WS-FILE-NAME            PIC X(12).
       01  RET-FILE-PATH           PIC X(60).
       
       01  COMMAND-STRING          PIC X(100).

       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
      *--- 1. Preparar el nombre del archivo (ej: r0012345.csv)
           STRING "r"
                  WS-RET-NUMERO DELIMITED BY SIZE
                  ".csv"        DELIMITED BY SIZE
             INTO WS-FILE-NAME.

           STRING "\\servidor-erp\retenciones\" DELIMITED BY SIZE
                  WS-FILE-NAME                  DELIMITED BY SIZE
             INTO RET-FILE-PATH.
             
      *--- 2. Construir el registro CSV
           STRING WS-CUIT-CONTRIB      DELIMITED BY SIZE
                  ","                  DELIMITED BY SIZE
                  WS-SUCURSAL          DELIMITED BY SIZE
                  ","                  DELIMITED BY SIZE
                  WS-ALICUOTA          DELIMITED BY SIZE
                  ","                  DELIMITED BY SIZE
                  WS-BASE-IMPONIBLE    DELIMITED BY SIZE
                  ","                  DELIMITED BY SIZE
                  WS-IMPORTE-RET       DELIMITED BY SIZE
                  ","                  DELIMITED BY SIZE
                  '"'                  DELIMITED BY SIZE
                  WS-RAZON-SOCIAL      DELIMITED BY SIZE
                  '"'                  DELIMITED BY SIZE
                  ","                  DELIMITED BY SIZE
                  WS-FECHA-OPERACION   DELIMITED BY SIZE
             INTO WS-CSV-RECORD.

      *--- 3. Escribir el archivo CSV en la carpeta de red
           OPEN OUTPUT RETENCION-FILE.
           MOVE WS-CSV-RECORD TO RETENCION-RECORD.
           WRITE RETENCION-RECORD.
           CLOSE RETENCION-FILE.

           DISPLAY "Archivo " WS-FILE-NAME " generado con éxito.".

      *--- 4. Preparar y ejecutar el script para llamar a la API
           STRING "llamar_api.bat " WS-FILE-NAME
                  DELIMITED BY SIZE
             INTO COMMAND-STRING.
      *    (En Linux/Unix, se usaría: "sh llamar_api.sh ")
           
           DISPLAY "Llamando a la API Local...".
           CALL "SYSTEM" USING COMMAND-STRING.

           DISPLAY "Proceso finalizado.".
           STOP RUN.
```

#### Paso 2: Script para Llamar a la API Local

Este script es invocado por el programa COBOL. Su única responsabilidad es tomar el nombre del archivo y hacer la llamada de red a la API Local. Se proporcionan versiones para Windows y Linux/Unix.

**`erp-integration/llamar_api.bat` (Para Windows)**
```batch
@echo off
REM Script para llamar a la API Local de procesamiento de retenciones.
REM Recibe el nombre del archivo como primer parámetro.

SETLOCAL

IF "%1"=="" (
    ECHO Error: No se proporcionó un nombre de archivo.
    ECHO Uso: llamar_api.bat nombre_archivo.csv
    EXIT /B 1
)

SET FILENAME=%1
SET API_URL="http://localhost:3000/api/process-file"
SET JSON_PAYLOAD="{\"fileName\": \"%FILENAME%\"}"

ECHO Llamando a la API en %API_URL% con el archivo %FILENAME%...

curl -X POST -H "Content-Type: application/json" -d %JSON_PAYLOAD% %API_URL%

ECHO.
ECHO Llamada a la API completada.

ENDLOCAL
```

**`erp-integration/llamar_api.sh` (Para Linux/Unix)**
```sh
#!/bin/bash
# Script para llamar a la API Local de procesamiento de retenciones.
# Recibe el nombre del archivo como primer parámetro.

if [ -z "$1" ]; then
    echo "Error: No se proporcionó un nombre de archivo."
    echo "Uso: ./llamar_api.sh nombre_archivo.csv"
    exit 1
fi

FILENAME=$1
API_URL="http://localhost:3000/api/process-file"
JSON_PAYLOAD="{\"fileName\": \"$FILENAME\"}"

echo "Llamando a la API en $API_URL con el archivo $FILENAME..."

curl -X POST -H "Content-Type: application/json" -d "$JSON_PAYLOAD" "$API_URL"

echo ""
echo "Llamada a la API completada."
```