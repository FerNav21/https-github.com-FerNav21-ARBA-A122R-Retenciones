# Sistema de Procesamiento Automatizado ARBA A-122R

Este proyecto es una aplicación web de front-end diseñada para actuar como una interfaz de control para un sistema automatizado de gestión de retenciones A-122R de ARBA. Simula un flujo de trabajo empresarial en el que un sistema ERP (Planificación de Recursos Empresariales) interactúa de forma transparente con los servicios de ARBA a través de una API local (backend).

El objetivo principal es proporcionar una herramienta para configurar, disparar y monitorear los dos procesos clave: la **creación** y la **anulación** de comprobantes de retención, demostrando un flujo de trabajo de integración completo y robusto.

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

---

## Despliegue (Docker en Windows Server)

La forma recomendada de desplegar esta interfaz web en un entorno de producción como Windows Server 2025 es a través de Docker. Esto asegura un entorno consistente y facilita la gestión.

### Prerrequisitos
-   Tener Docker Desktop o Docker Engine instalado y funcionando en su Windows Server.
-   Haber clonado o descargado todos los archivos de este proyecto en una carpeta del servidor.

### Pasos para el Despliegue

1.  **Abrir una Terminal**: Abre PowerShell o el Símbolo del sistema (CMD) en la carpeta raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`).

2.  **Construir y Ejecutar el Contenedor**: Ejecuta el siguiente comando. Docker se encargará de construir la imagen del servidor web y ponerlo en marcha en segundo plano.

    ```bash
    docker-compose up -d --build
    ```

3.  **Verificar el Estado**: Puedes comprobar que el contenedor se está ejecutando correctamente con:

    ```bash
    docker-compose ps
    ```
    Deberías ver un servicio llamado `arba_frontend_app` con el estado `running`.

4.  **Acceder a la Aplicación**: ¡Listo! La aplicación ahora está disponible en el navegador web accediendo a la siguiente URL:

    `http://localhost:8080`

    *(Si estás accediendo desde otra máquina en la misma red, reemplaza `localhost` con la dirección IP del servidor).*

### Gestión del Contenedor
-   **Para detener la aplicación**: `docker-compose down`
-   **Para reiniciar la aplicación**: `docker-compose restart`

---

## Guía de Configuración

Antes de utilizar la aplicación, es fundamental configurar los parámetros correctamente. Haz clic en el botón **Ajustes ⚙️** en la esquina superior derecha para abrir el panel de configuración.

-   **Ambiente de ARBA**: Elige entre `Pruebas (Test)` y `Producción`. Esto determina qué URLs de ARBA se utilizarán.
-   **Credenciales de Agente**:
    -   `CUIT del Agente`: Tu Clave Única de Identificación Tributaria.
    -   `Clave de Identificación Tributaria (CIT)`: Tu contraseña para los servicios de ARBA.
-   **Configuración de Integración Local**:
    -   `URL de API Local`: La dirección de tu servicio de backend. El ejemplo COBOL y los scripts la utilizan para saber a dónde enviar la petición.
    -   `Ruta de Carpeta en Red`: La ubicación de la carpeta compartida donde el ERP deposita los `.csv` y la API Local guarda los `.pdf`. Formato UNC de Windows (ej: `\\servidor\retenciones`).

## Flujo de Trabajo y Uso

La interfaz principal se divide en dos pestañas para las dos operaciones principales.

### 1. Crear una Retención
1.  **Nombre del Archivo**: Introduce el nombre del archivo `.csv` (ej: `r0012345.csv`).
2.  **Seleccionar Archivo**: Selecciona el archivo CSV correspondiente de tu disco.
3.  **Procesar Archivo**: Haz clic para iniciar el proceso. La aplicación llamará a la API Local simulada y mostrará el progreso.
4.  **Resultado**: Si es exitoso, aparecerá un botón para **Descargar PDF**.

### 2. Anular una Retención
1.  **ID del Comprobante a Anular**: Introduce el identificador numérico del comprobante.
2.  **Anular Comprobante**: Haz clic para iniciar la anulación.
3.  **Resultado**: El panel de estado mostrará si la anulación fue exitosa.

## Formato del Archivo CSV
El archivo `.csv` debe contener una única línea sin encabezados, con 7 campos separados por comas.

**Ejemplo:** `30112233445,1,2.5,10000.00,250.00,"Nombre Contribuyente SRL",2024-07-18T10:30:00`

## Gestión Automática de Declaraciones Juradas (DJ)
La API Local simulada gestiona el ciclo de vida de las Declaraciones Juradas de forma inteligente, determinando el período fiscal actual, cerrando la DJ anterior si es necesario y abriendo una nueva.

## Integración con ERP (Ejemplo COBOL en Windows)

A continuación se presenta un ejemplo de cómo un sistema ERP basado en COBOL y corriendo en Windows puede integrarse con este flujo.

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

      *    Ruta de red en formato UNC para Windows
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
      *    Se asume que el sistema operativo es Windows.
      *    Por lo tanto, se llama al script de batch (.bat).
           STRING "llamar_api.bat " WS-FILE-NAME
                  DELIMITED BY SIZE
             INTO COMMAND-STRING.
           
           DISPLAY "Llamando a la API Local (Entorno Windows)...".
           CALL "SYSTEM" USING COMMAND-STRING.

           DISPLAY "Proceso finalizado.".
           STOP RUN.
```

#### Paso 2: Script Batch para Llamar a la API Local
Este script (`llamar_api.bat`) es invocado por el programa COBOL. Su única responsabilidad es tomar el nombre del archivo y hacer la llamada de red a la API Local. `curl.exe` viene incluido por defecto en Windows Server 2016 y versiones posteriores.

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
