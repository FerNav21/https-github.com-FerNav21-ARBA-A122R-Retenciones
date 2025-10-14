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
