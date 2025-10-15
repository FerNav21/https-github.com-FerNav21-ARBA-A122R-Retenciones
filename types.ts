/**
 * @file types.ts
 * @description
 * Este archivo define las interfaces y tipos de TypeScript clave que se utilizan
 * en toda la aplicación. Centralizar estas definiciones ayuda a mantener la
 * consistencia y la seguridad de tipos.
 */

/**
 * @interface AuthCredentials
 * @description Define la estructura de las credenciales necesarias para la autenticación
 *              contra la API de ARBA.
 * @property {string} clientId - El ID de cliente de OAuth.
 * @property {string} clientSecret - El secreto de cliente de OAuth.
 * @property {string} username - El nombre de usuario, que corresponde al CUIT del agente.
 * @property {string} password - La contraseña, que corresponde a la Clave de Identificación
 *              Tributaria (CIT) del agente.
 */
export interface AuthCredentials {
  clientId: string;
  clientSecret: string;
  username: string; // CUIT
  password: string; // CIT
}

/**
 * @interface DJPayload
 * @description Define la estructura de datos necesaria para crear una nueva Declaración Jurada (DJ).
 * @property {string} cuit - El CUIT del agente.
 * @property {number} quincena - La quincena del período (1 o 2).
 * @property {string} actividadId - El ID de la actividad económica relacionada.
 * @property {number} anio - El año del período.
 * @property {number} mes - El mes del período.
 */
export interface DJPayload {
  cuit: string;
  quincena: number;
  actividadId: string;
  anio: number;
  mes: number;
}

/**
 * @interface DJQuery
 * @description Similar a `DJPayload`, pero se utiliza para consultar DJs existentes.
 *              Omite `actividadId` ya que no es un parámetro de búsqueda.
 */
export interface DJQuery extends Omit<DJPayload, 'actividadId'> {}

/**
 * @interface DJ
 * @description Define la estructura de un objeto de Declaración Jurada (DJ) tal como
 *              lo devuelve la API de ARBA.
 * @property {string} idDj - El identificador único de la DJ.
 * @property {string} cuit - El CUIT del agente asociado a la DJ.
 * @property {number} anio - El año del período de la DJ.
 * @property {number} mes - El mes del período de la DJ.
 * @property {number} quincena - La quincena del período de la DJ.
 * @property {string} [estado] - El estado actual de la DJ (ej: 'ABIERTA', 'CERRADA').
 */
export interface DJ {
  idDj: string;
  cuit: string;
  anio: number;
  mes: number;
  quincena: number;
  estado?: string;
}

/**
 * @interface VoucherData
 * @description Define la estructura de los datos de un comprobante de retención,
 *              generalmente parseado desde un archivo local.
 * @property {string} cuitContribuyente - CUIT del sujeto retenido.
 * @property {string} sucursal - Número de sucursal.
 * @property {number} alicuota - La alícuota aplicada en la retención.
 * @property {number} baseImponible - El monto sobre el cual se calculó la retención.
 * @property {number} importeRetencion - El monto final retenido.
 * @property {string} razonSocialContribuyente - Nombre o razón social del sujeto retenido.
 * @property {string} fechaOperacion - La fecha de la operación en formato ISO (YYYY-MM-DDTHH:MM:SS).
 */
export interface VoucherData {
  cuitContribuyente: string;
  sucursal: string;
  alicuota: number;
  baseImponible: number;
  importeRetencion: number;
  razonSocialContribuyente: string;
  fechaOperacion: string;
}

/**
 * @interface VoucherPayload
 * @description Extiende `VoucherData` con la información adicional necesaria para
 *              enviar un comprobante a la API de ARBA.
 * @property {string} idDj - El ID de la DJ a la que pertenece este comprobante.
 * @property {string} cuitAgente - El CUIT del agente que realiza la retención.
 * @property {number} mes - El mes del período de la DJ.
 */
export interface VoucherPayload extends VoucherData {
  idDj: string;
  cuitAgente: string;
  mes: number;
}

/**
 * @interface VoucherResult
 * @description Define la estructura del objeto de resultado para cada comprobante procesado,
 *              utilizado para mostrar el resumen final.
 * @property {'success' | 'error'} status - Indica si el procesamiento fue exitoso o falló.
 * @property {string} message - Un mensaje descriptivo del resultado (ej: ID del comprobante o mensaje de error).
 * @property {string} [comprobanteId] - El ID del comprobante si fue creado con éxito.
 * @property {VoucherData} originalData - Los datos originales del comprobante, para referencia en caso de error.
 */
export interface VoucherResult {
    status: 'success' | 'error';
    message: string;
    comprobanteId?: string;
    originalData: VoucherData;
}
