@echo off
rem --------------------------------------------------------------------
rem OBJETIVO:
rem     Este script es invocado por el programa COBOL `gen_ret.cbl`.
rem     Su responsabilidad es tomar un nombre de archivo como argumento
rem     y enviar una solicitud POST a la API local para procesarlo.
rem
rem PARÁMETROS:
rem     %1 - El nombre del archivo CSV generado (ej: r0012345.csv).
rem
rem HERRAMIENTAS:
rem     - `curl.exe`: Utilidad de línea de comandos para transferir
rem       datos con URLs. Viene incluida en Windows Server 2016 y
rem       versiones posteriores.
rem --------------------------------------------------------------------

SETLOCAL
REM --- Valida que se haya pasado un nombre de archivo.
IF "%1"=="" (
    ECHO Error: No se proporcionó un nombre de archivo.
    ECHO Uso: llamar_api.bat nombre_archivo.csv
    EXIT /B 1
)

REM --- Asigna variables.
SET "FILENAME=%1"
SET "API_URL=http://localhost:3000/api/process-file"
SET "JSON_PAYLOAD={\"fileName\": \"%FILENAME%\"}"

ECHO.
ECHO Llamando a la API en %API_URL% con el archivo %FILENAME%...
ECHO.

REM --- Ejecuta la llamada a la API usando cURL.
rem     -X POST: Especifica que la solicitud es de tipo POST.
rem     -H "Content-Type: application/json": Define el tipo de contenido.
rem     -d %JSON_PAYLOAD%: Envía el cuerpo de la solicitud en formato JSON.
rem     %API_URL%: La URL de destino.
curl -X POST -H "Content-Type: application/json" -d %JSON_PAYLOAD% %API_URL%

ECHO.
ECHO Llamada a la API completada.

ENDLOCAL
