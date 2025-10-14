rem Este script (`llamar_api.bat`) es invocado por el programa COBOL. Su única responsabilidad es tomar el nombre del archivo y hacer la llamada de red a la API Local. `curl.exe` viene incluido por defecto en Windows Server 2016 y versiones posteriores.

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
