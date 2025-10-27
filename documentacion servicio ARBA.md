El siguiente documento está estructurado en formato Markdown (.md) y detalla la información necesaria para desarrollar una aplicación de comunicación con la API A122R Servicios Externos de ARBA, basándose en la documentación proporcionada.
--------------------------------------------------------------------------------
Documentación de Integración: API A122R Servicios Externos
1. Introducción y Contexto Normativo
La API A122R Servicios Externos es la implementación técnica de la Resolución Normativa 22/25
, la cual establece un nuevo procedimiento para que los agentes de retención generen y emitan comprobantes del Impuesto sobre los Ingresos Brutos de manera íntegramente digital
.
El objetivo principal de esta API es permitir que los sistemas de gestión (propios o "software enlatados") de los agentes de recaudación interactúen de forma directa y segura con los servicios de ARBA
. Los datos ingresados quedan registrados en las bases de ARBA, lo que facilita la confección posterior de las Declaraciones Juradas (DDJJ) y reduce la carga administrativa
.
• Vigencia: La RN 22/25 comenzó a regir a partir del 1° de diciembre de 2025
.
• Alcance: Aplica a sujetos obligados a actuar como agentes de recaudación conforme al Régimen General de Retención de IIBB y Regímenes Especiales de Retención
.
• Excepción: El procedimiento regulado no aplica a Bancos y Entidades Financieras
.
2. Autenticación y Seguridad (OAuth 2.0/OIDC)
El acceso a los servicios de la API A122R está protegido mediante los estándares de seguridad OAuth 2.0/OpenID Connect (OIDC)
. Todos los endpoints funcionales requieren la inclusión de un access_token válido y vigente
.
2.1. Requisitos Previos
Para utilizar la API, el agente de recaudación debe cumplir con los siguientes requisitos
:
• Poseer una Clave Única de Identificación Tributaria (CUIT)
.
• Tener una Clave de Identificación Tributaria (CIT) activa y asociada a dicha CUIT (utilizada como password en el flujo de autenticación)
.
2.2. Flujo de Obtención del Access Token (Password Grant)
El flujo de autenticación soportado es el Password Grant
. El cliente debe solicitar el access token al Authorization Server de ARBA, enviando sus credenciales y las del cliente (la aplicación)
.
Parámetro
	
Descripción
	
Valor Requerido
	
Fuente
client_id
	
Identificador único del sistema cliente.
	
Valor especificado por ARBA según ambiente
	
client_secret
	
Clave secreta asociada al client_id.
	
Valor especificado por ARBA según ambiente
	
username
	
CUIT de la empresa Agente de Recaudación.
	
CUIT de la empresa
	
password
	
Clave de Identificación Tributaria (CIT) del agente.
	
CIT
	
grant_type
	
Tipo de concesión de autorización.
	
password
	
scope
	
Alcance de los permisos solicitados.
	
openid
	
Endpoint de Autenticación (Testing):
• URL del Token Endpoint: https://app.test.arba.gov.ar/auth/token
2.3. Uso del Access Token
El servidor retorna un access_token (y opcionalmente, un refresh_token)
. Este token debe ser enviado en el header de cada request a la API, utilizando el formato estándar Bearer
:

Authorization: Bearer <access_token>

Consideración de Seguridad: El CUIT del agente que generó el token debe coincidir con el campo cuitAgente enviado en el payload de las peticiones a la API
. Si el token expira o es inválido, debe solicitarse uno nuevo
.
3. Especificación de la API REST (Endpoints Funcionales)
La API A122R expone los siguientes endpoints para el consumo externo, bajo la URL base /a122rSrv/api
.
URL de Documentación Interactiva (Swagger - Ambiente Testing): https://app.test.arba.gov.ar/a122rSrv/api/swagger-ui/index.html
3.1. Inicio de Declaración Jurada (/external/declaracionJurada)
Atributo
	
Valor
	
Fuente
Propósito
	
Iniciar una DJ y obtener un identificador único (idDj) necesario para asociar los comprobantes posteriores
.
	
Método HTTP
	
POST
	
URL Testing
	
https://app.test.arba.gov.ar/a122rSrv/api/external/declaracionJurada
	
URL Producción
	
https://app.arba.gov.ar/a122rSrv/api/external/declaracionJurada
	
Security
	
bearerAuth
	
Request Body (Esquema InicioDDJJDTO)
:
Parámetro
	
Requerido
	
Tipo de Dato
	
Observación
	
Fuente
cuitAgente
	
Sí
	
integer (int64/N11)
	
Debe coincidir con el CUIT del usuario autenticado
.
	
quincena
	
Sí
	
integer (int32/N2)
	
Valores: 1 o 2. Usar 0 para actividades mensuales
.
	
actividadId
	
Sí
	
integer (int32/N2)
	
Código de la actividad de retención (Ver Anexo 5.1/Tabla de Actividades)
.
	
anio
	
Sí
	
integer (int32/N4)
	
Año del Periodo, debe ser >= 2025
.
	
mes
	
Sí
	
integer (int32/N2)
	
Mes del Período (1 a 12)
.
	
Respuestas Exitosas: Código 200 (OK) con un example {'codigo':'0','estado': 'ok'}
.
3.2. Alta de Comprobante (/external/comprobante)
Atributo
	
Valor
	
Fuente
Propósito
	
Registrar un nuevo comprobante de retención A122R y asociarlo al idDj
.
	
Método HTTP
	
POST
	
URL Testing
	
https://app.test.arba.gov.ar/a122rSrv/api/external/comprobante
	
URL Producción
	
https://app.arba.gov.ar/a122rSrv/api/external/comprobante
	
Security
	
bearerAuth
	
Requisitos Clave: El campo idDj debe contener el ID devuelto por el servicio de declaracionJurada. La fechaOperacion debe estar dentro del período y quincena de la DJ iniciada
.
Request Body (Esquema ComprobanteReqDTO)
:
Parámetro
	
Requerido
	
Tipo de Dato
	
Observación
	
Fuente
idDj
	
Sí
	
integer (int64)
	
ID de la DJ, tomado de la respuesta de InicioDJ
.
	
cuitContribuyente
	
Sí
	
integer (int64/N11)
	
CUIT del contribuyente retenido (debe ser válido)
.
	
cuitAgente
	
Sí
	
integer (int64/N11)
	
Debe coincidir con el CUIT de inicio de la DJ y el CUIT del token
.
	
sucursal
	
Sí
	
string (<= 5)
	
Debe ser numérico
.
	
alicuota
	
Sí
	
number (1, 2 decimales)
	
Si no es la esperada, puede salir observada (NO se da de alta)
.
	
baseImponible
	
Sí
	
number (N15,2)
	
Monto base
.
	
importeRetencion
	
Sí
	
number (N15,2)
	
Monto retenido
.
	
razonSocialContribuyente
	
Sí
	
string (50)
	
Apellido y Nombre o Razón Social
.
	
fechaOperacion
	
Sí
	
string (date-time)
	
Formato YYYY-MM-DDTHH:MM:SS.ms. Debe pertenecer al período/quincena de la DJ
.
	
direccion (objeto)
	
No
	
object (DireccionDTO)
	
Contiene campos opcionales como calle, numero, piso, etc.
.
	
3.3. Baja de Comprobante (/external/comprobante/{id})
Atributo
	
Valor
	
Fuente
Propósito
	
Dar de baja un comprobante por ID, solo si la DJ se encuentra abierta
.
	
Método HTTP
	
DELETE
	
URL Testing
	
https://app.test.arba.gov.ar/a122rSrv/api/external/comprobante
	
URL Producción
	
https://app.arba.gov.ar/a122rSrv/api/external/comprobante
	
Security
	
bearerAuth
	
Parámetro Requerido (Path Parameter - as described in OpenAPI path
):
Nombre
	
Descripción
	
Tipo de Dato
	
Fuente
id
	
Identificador único del comprobante a dar de baja
.
	
integer (int32/Numérico)
	
Consideraciones sobre la Baja: Este servicio es para eliminaciones individuales, no para procesamiento masivo (batch)
. Tras la eliminación, se envía una notificación al Domicilio Fiscal Electrónico (DFE) del contribuyente retenido
.
3.4. Consulta de Comprobante en PDF (/external/comprobantePdf)
Atributo
	
Valor
	
Fuente
Propósito
	
Generar y devolver el comprobante en formato PDF
.
	
Método HTTP
	
GET
	
URL Testing
	
https://app.test.arba.gov.ar/a122rSrv/api/external/comprobantePdf
	
URL Producción
	
https://app.arba.gov.ar/a122rSrv/api/external/comprobantePdf
	
Security
	
bearerAuth
	
Content Type Respuesta
	
application/pdf
.
	
Parámetro Requerido (Query Parameter)
:
Nombre
	
Descripción
	
Tipo de Dato
	
Fuente
comprobante
	
ID del comprobante que se desea consultar
.
	
integer (int32/Numérico)
	
Restricciones: El comprobante debe haber sido generado por el mismo usuario/agente que realiza la consulta y debe ser válido (no tener observaciones)
.
4. Flujo de Comunicación Esencial (App)
Para que su aplicación cumpla con el proceso de generación de comprobantes, se debe seguir el siguiente flujo secuencial utilizando la API REST:
1. Autenticación: Obtener un access_token vigente utilizando el flujo Password Grant (CUIT/CIT)
.
2. Inicio de Período Fiscal (DJ): Invocar el servicio declaracionJurada (POST) para iniciar la DJ del período y actividad específica, recibiendo el idDj como identificador clave
. El cuitAgente enviado debe coincidir con el CUIT del token
.
3. Carga de Comprobantes: Por cada retención efectuada, invocar el servicio comprobante (POST), utilizando el idDj para vincular la retención a la DJ
.
4. Gestión de Errores/Bajas: Si un comprobante se generó erróneamente, se puede eliminar utilizando el servicio comprobante/{id} (DELETE), siempre que la DJ no haya sido cerrada
. La eliminación notifica al contribuyente retenido vía DFE
.
5. Generación de Constancia: Si se requiere la constancia, consultar el comprobante por su ID a través de comprobantePdf (GET)
.
6. Presentación Final de la DDJJ: Una vez cargadas y confirmadas todas las operaciones, el agente debe cerrar y presentar la DDJJ a través de la aplicación informática, la cual se integra con los datos registrados vía API
.
5. Carga de Datos por Lotes (Método Alternativo)
Además de la interacción en tiempo real a través de la API REST, el sistema A122R ofrece la modalidad de Carga por Lotes para grandes volúmenes de operaciones
. Este proceso se realiza subiendo un archivo, generalmente a través de la aplicación web de ARBA
.
5.1. Nomenclatura del Archivo ZIP
El archivo debe ser un .ZIP que contenga un archivo .TXT con los registros
. La nomenclatura del archivo .ZIP es obligatoria
:
ER-CUIT-PERIODO-ACTIVIDAD-LOTEXXXXX.ZIP
Componente
	
Descripción
	
Formato
	
Fuente
ER-
	
Prefijo fijo
	
Texto
	
CUIT
	
CUIT del Agente de Recaudación (sin guiones)
	
Numérico
	
PERIODO
	
Período fiscal de las retenciones
	
aaaammq (Año, mes, quincena)
	
ACTIVIDAD
	
Código numérico de la actividad (Ej: 6 para Régimen General)
	
Numérico
	
-LOTE
	
Separador fijo
	
Texto
	
XXXXX
	
Identificador adicional alfanumérico definido por el usuario
	
Alfanumérico
	
Ejemplo de Nomenclatura: ER-30123456781-2025011-6-LOTE001.ZIP (Período: 2025, Mes 01, Quincena 1, Actividad 6)
.
5.2. Códigos de Actividad Relevantes
Estos códigos se usan tanto en el actividadId del inicio de DJ por API como en la nomenclatura del lote
:
Código
	
Descripción de Actividad
	
Fuente
1
	
REGIMEN DE RETEN.EMPRESAS CONSTRUCTORAS
	
6
	
REGIMEN GENERAL DE RETENCIONES
	
10
	
ACTIVIDAD AGROPECUARIA
	
13
	
MUNICIPALIDAD
	
15
	
ESTADO PROVINCIAL
	
17
	
FINANCIERAS/BANCOS (Nota: El procedimiento A122R no aplica a bancos)
	
23
	
HONORARIOS
	
6. Recursos y Contacto
• Contacto por Consultas Técnicas: servicioA122R@arba.gov.ar
.
• Soporte Externo (General): soporte@arba.gov.ar
.
• Swagger URL (Ambiente Testing): https://app.test.arba.gov.ar/a122rSrv/api/swagger-ui/index.html
.
