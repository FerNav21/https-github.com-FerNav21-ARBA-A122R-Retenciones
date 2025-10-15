       IDENTIFICATION DIVISION.
       PROGRAM-ID. GENRET.
       AUTHOR. ERP-System.
      *----------------------------------------------------------------*
      * Este programa simula la generación de un archivo de retención  *
      * en formato CSV y luego llama a un script externo para          *
      * enviarlo a la API Local de procesamiento de ARBA.              *
      *----------------------------------------------------------------*
      * OBJETIVO:
      *     Crear un archivo .csv con datos de una retención impositiva
      *     y pasarlo como argumento a un script que se encarga de
      *     la comunicación con una API.
      *
      * ENTRADA:
      *     Ninguna. Los datos están definidos en WORKING-STORAGE.
      *
      * SALIDA:
      *     - Un archivo .csv en la ruta de red '\\jaque\rc.220\'.
      *     - Mensajes de estado en la consola.
      *
      * MODIFICACIONES:
      *     Fecha       Autor           Descripción
      *     ----------  --------------  --------------------------------
      *     2023-10-26  ERP-System      Versión inicial.
      *----------------------------------------------------------------*
       ENVIRONMENT DIVISION.
      *================================================================*
      * Define el entorno en el que se ejecuta el programa.
      *================================================================*
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
      *--- Asocia el nombre lógico del archivo (RETENCION-FILE) con un
      *--- archivo físico en disco (definido por la variable RET-FILE-PATH).
           SELECT RETENCION-FILE ASSIGN TO DISK RET-FILE-PATH
           ORGANIZATION IS LINE SEQUENTIAL.

       DATA DIVISION.
      *================================================================*
      * Declara las variables y estructuras de datos.
      *================================================================*
       FILE SECTION.
      *--- Define la estructura de los registros del archivo.
       FD  RETENCION-FILE.
       01  RETENCION-RECORD      PIC X(200).

       WORKING-STORAGE SECTION.
      *--- Variables y datos temporales que usa el programa.
       01  WS-RETENCION-DATA.
      *--- Datos de ejemplo para una retención.
           05 WS-CUIT-CONTRIB      PIC X(11) VALUE '30112233445'.
           05 WS-SUCURSAL          PIC 9(01) VALUE 1.
           05 WS-ALICUOTA          PIC X(04) VALUE '2.50'.
           05 WS-BASE-IMPONIBLE    PIC X(10) VALUE '10000.00'.
           05 WS-IMPORTE-RET       PIC X(07) VALUE '250.00'.
           05 WS-RAZON-SOCIAL      PIC X(26)
              VALUE 'Nombre Contribuyente SRL'.
           05 WS-FECHA-OPERACION   PIC X(19)
              VALUE '2025-10-14T10:30:00'.
       
       01  WS-CSV-RECORD           PIC X(200).
      *--- Variable para almacenar la línea completa del CSV.
       01  WS-RET-NUMERO           PIC 9(07) VALUE 12345.
      *--- Número de retención para el nombre del archivo.
       01  WS-FILE-NAME            PIC X(12).
      *--- Nombre del archivo CSV (ej: r0012345.csv).
       01  RET-FILE-PATH           PIC X(60).
      *--- Ruta completa del archivo CSV, incluyendo el nombre.
       
       01  COMMAND-STRING          PIC X(100).
      *--- Comando a ejecutar en el sistema operativo.

       PROCEDURE DIVISION.
      *================================================================*
      * Lógica principal del programa.
      *================================================================*
       MAIN-PROCEDURE.
      *--- 1. Preparar el nombre del archivo (ej: r0012345.csv)
      *---    Concatena 'r', el número de retención y '.csv'.
           STRING "r"
                  WS-RET-NUMERO DELIMITED BY SIZE
                  ".csv"        DELIMITED BY SIZE
             INTO WS-FILE-NAME.

      *---    Construye la ruta completa del archivo en la carpeta de red.
           STRING "\jaque\rc.220\" DELIMITED BY SIZE
                  WS-FILE-NAME                  DELIMITED BY SIZE
             INTO RET-FILE-PATH.
             
      *--- 2. Construir el registro CSV
      *---    Concatena todos los campos de WS-RETENCION-DATA
      *---    separados por comas para formar una línea de CSV.
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
      *---    Abre el archivo, escribe el registro y lo cierra.
           OPEN OUTPUT RETENCION-FILE.
           MOVE WS-CSV-RECORD TO RETENCION-RECORD.
           WRITE RETENCION-RECORD.
           CLOSE RETENCION-FILE.

           DISPLAY "Archivo " WS-FILE-NAME " generado con éxito.".

      *--- 4. Preparar y ejecutar el script para llamar a la API
      *---    Construye el comando a ejecutar, pasando el nombre
      *---    del archivo como parámetro al script.
           STRING "llamar_api.bat " WS-FILE-NAME
                  DELIMITED BY SIZE
             INTO COMMAND-STRING.

           
           DISPLAY "Llamando a la API Local...".
      *---    Ejecuta el comando en el sistema operativo.
           CALL "SYSTEM" USING COMMAND-STRING.

           DISPLAY "Proceso finalizado.".
           STOP RUN.
