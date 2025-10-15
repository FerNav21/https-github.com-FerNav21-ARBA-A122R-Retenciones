# Procesador de Retenciones ARBA

## 1. Introducción

Esta es una aplicación web de React y TypeScript diseñada para simplificar la presentación de retenciones del Impuesto sobre los Ingresos Brutos a través de los servicios web de ARBA (Agencia de Recaudación de la Provincia de Buenos Aires).

La herramienta permite a los agentes de retención procesar archivos de texto (`.csv` o `.txt`) que contienen múltiples comprobantes, automatizando el ciclo completo de comunicación con la API de ARBA, desde la autenticación hasta la carga final.

## 2. Características Principales

- **Procesamiento por Lotes**: Carga de múltiples retenciones desde un único archivo local.
- **Gestión Automática de DJ**: La aplicación busca una Declaración Jurada (DJ) abierta para el período actual. Si no existe, cierra la del período anterior (si es necesario) y crea una nueva automáticamente.
- **Configuración Flexible**: Permite cambiar entre los entornos de **Pruebas** y **Producción** de ARBA.
- **Interfaz Intuitiva**: Guía al usuario a través del proceso paso a paso (Autenticación, DJ, Carga y Resumen).
- **Manejo de Errores**: Proporciona un resumen claro de los comprobantes cargados con éxito y de los que fallaron, mostrando los mensajes de error devueltos por la API.
- **Integración con COBOL**: El proyecto incluye un ejemplo de cómo un sistema ERP basado en COBOL puede generar los archivos de retenciones e invocar un script para una futura API local, demostrando un flujo de trabajo de backend completo.

## 3. Arquitectura y Tecnologías

- **Frontend**:
  - **React**: Biblioteca para construir la interfaz de usuario.
  - **TypeScript**: Para un desarrollo más robusto y seguro.
  - **Tailwind CSS**: Para el diseño de la interfaz.
  - **Vite**: Como herramienta de construcción y servidor de desarrollo.

- **Integración ERP (Ejemplo)**:
  - **COBOL**: Se proporciona un programa de ejemplo (`gen_ret.cbl`) que genera un archivo de retenciones.
  - **Script de Batch**: Un script (`llamar_api.bat`) que es invocado por el programa COBOL para simular una llamada a un backend.

- **Despliegue**:
  - **Docker**: La aplicación está preparada para ser desplegada como un contenedor, facilitando la configuración en servidores Windows.
  - **Nginx**: Se utiliza dentro del contenedor Docker como servidor web para servir la aplicación de React.

## 4. Guía de Inicio Rápido

### Prerrequisitos
- Node.js (versión 18 o superior)
- npm (o un gestor de paquetes compatible como Yarn o pnpm)

### Instalación
1. Clona el repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   ```
2. Navega al directorio del proyecto:
   ```bash
   cd <NOMBRE_DEL_DIRECTORIO>
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```

### Ejecución en Modo Desarrollo
Para iniciar la aplicación en tu máquina local:
```bash
npm run dev
```
Esto iniciará un servidor de desarrollo (generalmente en `http://localhost:5173`).

## 5. Formato del Archivo de Retenciones

Para que la aplicación pueda procesarlo, el archivo (`.csv` o `.txt`) debe seguir el siguiente formato:

- **Separador**: Coma (`,`).
- **Encabezado**: El archivo debe tener una fila de encabezado, que será ignorada por el procesador.
- **Codificación**: UTF-8.

**Columnas requeridas:**
1. `cuitContribuyente`
2. `sucursal`
3. `alicuota`
4. `baseImponible`
5. `importeRetencion`
6. `razonSocialContribuyente`
7. `fechaOperacion` (en formato `YYYY-MM-DDTHH:MM:SS`)

**Ejemplo de contenido:**
```csv
cuit_contribuyente,sucursal,alicuota,base_imponible,importe_retencion,razon_social,fecha_operacion
20112233445,1,2.5,10000.00,250.00,Empresa de Ejemplo SRL,2025-10-14T10:30:00
27556677889,1,2.5,5000.00,125.00,Otra Empresa SA,2025-10-14T11:00:00
```

## 6. Configuración de la Aplicación

Toda la configuración se gestiona desde la interfaz, haciendo clic en el botón **"Ajustes"**:

- **Ambiente de ARBA**: Elige entre `Pruebas (Test)` y `Producción`. Esto cambia automáticamente las URLs de la API a las que apunta la aplicación.
- **Credenciales de Agente**:
  - **CUIT del Agente**: El CUIT del agente de retención.
  - **Clave de Identificación Tributaria (CIT)**: La CIT asociada al CUIT.
- **Credenciales de Cliente OAuth (Avanzado)**: Por defecto, la aplicación utiliza las credenciales `clientId` y `clientSecret` proporcionadas por ARBA. Esta sección permite anularlas si se dispone de credenciales personalizadas.
- **Período de DJ por Defecto**: Define el año, mes, quincena e ID de actividad que se usarán al crear una nueva Declaración Jurada.
- **Configuración de Integración Local**: Campos preparados para una futura integración con una API local que pueda leer archivos directamente desde una carpeta de red.

## 7. Despliegue con Docker

La aplicación incluye archivos `Dockerfile` y `docker-compose.yml` para un despliegue sencillo.

### Prerrequisitos
- Un servidor con Docker instalado.

### Pasos
1. Coloca todos los archivos del proyecto en una carpeta en tu servidor.
2. Abre una terminal en esa carpeta.
3. Ejecuta el siguiente comando para construir la imagen y levantar el contenedor:
   ```bash
   docker-compose up -d --build
   ```
   - `-d` ejecuta el contenedor en segundo plano.
   - `--build` fuerza la reconstrucción de la imagen.

4. La aplicación estará disponible en el puerto `8080` de tu servidor (ej: `http://<IP_DEL_SERVIDOR>:8080`).

Para detener la aplicación, ejecuta `docker-compose down` en el mismo directorio.
