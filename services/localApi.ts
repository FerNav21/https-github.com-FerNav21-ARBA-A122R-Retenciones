import { getAuthToken, initiateDJ, uploadVoucher, getVoucherPDF, consultarDJ, cerrarDJ } from './arbaApi';
import { DJ, DJPayload, VoucherData, VoucherPayload } from '../types';
import { useSettings } from '../contexts/SettingsContext';

type StatusStep = 'auth' | 'dj_check' | 'dj_close' | 'dj_open' | 'upload' | 'pdf';
type StatusCallback = (step: StatusStep) => void;

/**
 * Gestiona el ciclo de vida de la Declaración Jurada.
 * Busca una DJ abierta para el período actual. Si no existe,
 * simula el cierre de la anterior y crea una nueva.
 */
const gestionarDeclaracionJurada = async (
  token: string,
  settings: ReturnType<typeof useSettings>,
  onStatusUpdate: StatusCallback
): Promise<DJ> => {
  const ahora = new Date();
  const anioActual = ahora.getFullYear();
  const mesActual = ahora.getMonth() + 1;
  const diaActual = ahora.getDate();
  const quincenaActual = diaActual <= 15 ? 1 : 2;

  const periodoActual = { anio: anioActual, mes: mesActual, quincena: quincenaActual };
  console.log('Período fiscal actual determinado:', periodoActual);

  // 1. VERIFICAR SI YA EXISTE UNA DJ ABIERTA PARA EL PERÍODO ACTUAL
  onStatusUpdate('dj_check');
  const djsAbiertas = await consultarDJ(
    { cuit: settings.cuit, ...periodoActual },
    token,
    settings.environment
  );

  const djAbierta = djsAbiertas.find(dj => dj.estado !== 'CERRADA'); // Asumiendo que la API devuelve un estado
  if (djAbierta) {
    console.log(`DJ existente encontrada para el período actual. ID: ${djAbierta.idDj}`);
    return djAbierta;
  }
  
  // 2. SI NO HAY DJ ABIERTA, CREAR UNA NUEVA (Y SIMULAR CIERRE DE LA ANTERIOR)
  console.log('No se encontró una DJ abierta para el período actual. Se creará una nueva.');
  
  // En un backend real, aquí iría la lógica para buscar la DJ del período anterior
  // y cerrarla si es necesario. Lo simulamos con una actualización de estado.
  onStatusUpdate('dj_close');
  // await cerrarDJ(idDjAnterior, token, settings.environment);

  onStatusUpdate('dj_open');
  const djPayload: DJPayload = {
    cuit: settings.cuit,
    actividadId: settings.actividadId,
    ...periodoActual,
  };
  
  const nuevaDj = await initiateDJ(djPayload, token, settings.environment);
  if (!nuevaDj || !nuevaDj.idDj) {
    throw new Error('No se pudo obtener el idDj al iniciar la nueva Declaración Jurada.');
  }
  return nuevaDj;
};

// Simula una API local (backend) que orquesta todo el proceso de ARBA.
export const procesarArchivoLocal = async (
  csvContent: string,
  settings: ReturnType<typeof useSettings>,
  onStatusUpdate: StatusCallback
): Promise<Blob> => {
  // 1. Parsear el contenido del CSV
  const [line] = csvContent.trim().split('\n');
  if (!line) {
    throw new Error('El archivo CSV está vacío o tiene un formato incorrecto.');
  }

  const fields = line.split(',');
  if (fields.length !== 7) {
    throw new Error(`El CSV debe tener 7 campos, pero se encontraron ${fields.length}.`);
  }

  const voucherData: VoucherData = {
    cuitContribuyente: fields[0].trim(),
    sucursal: fields[1].trim(),
    alicuota: parseFloat(fields[2]),
    baseImponible: parseFloat(fields[3]),
    importeRetencion: parseFloat(fields[4]),
    razonSocialContribuyente: fields[5].trim(),
    fechaOperacion: fields[6].trim(),
  };

  // 2. Autenticación
  onStatusUpdate('auth');
  const token = await getAuthToken(
    { username: settings.cuit, password: settings.cit },
    settings.environment
  );

  // 3. Gestionar la Declaración Jurada (lógica nueva y mejorada)
  const dj = await gestionarDeclaracionJurada(token, settings, onStatusUpdate);

  // 4. Subir el Comprobante
  onStatusUpdate('upload');
  const voucherPayload: VoucherPayload = {
    ...voucherData,
    idDj: dj.idDj,
    cuitAgente: settings.cuit,
    mes: dj.mes,
  };
  const uploadResult = await uploadVoucher(voucherPayload, token, settings.environment);

  if (!uploadResult.idComprobante) {
      throw new Error('No se pudo obtener el idComprobante después de subir el voucher.');
  }

  // 5. Obtener el PDF
  onStatusUpdate('pdf');
  const pdfBlob = await getVoucherPDF(uploadResult.idComprobante, token, settings.environment);
  
  return pdfBlob;
};