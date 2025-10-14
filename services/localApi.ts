import { getAuthToken, initiateDJ, uploadVoucher, getVoucherPDF, consultarDJ, cerrarDJ, deleteVoucher } from './arbaApi';
import { DJ, DJPayload, VoucherData, VoucherPayload } from '../types';
import { useSettings } from '../contexts/SettingsContext';

type CreateStatusStep = 'auth' | 'dj_check' | 'dj_close' | 'dj_open' | 'upload' | 'pdf' | 'success';
type AnnulStatusStep = 'auth' | 'delete' | 'success';
type CreateStatusCallback = (step: CreateStatusStep) => void;
type AnnulStatusCallback = (step: AnnulStatusStep) => void;


/**
 * Gestiona el ciclo de vida de la Declaración Jurada.
 * Busca una DJ abierta para el período actual. Si no existe,
 * simula el cierre de la anterior y crea una nueva.
 */
const gestionarDeclaracionJurada = async (
  token: string,
  settings: ReturnType<typeof useSettings>,
  onStatusUpdate: CreateStatusCallback
): Promise<DJ> => {
  const ahora = new Date();
  const anioActual = ahora.getFullYear();
  const mesActual = ahora.getMonth() + 1;
  const diaActual = ahora.getDate();
  const quincenaActual = diaActual <= 15 ? 1 : 2;

  const periodoActual = { anio: anioActual, mes: mesActual, quincena: quincenaActual };
  console.log('Período fiscal actual determinado:', periodoActual);

  onStatusUpdate('dj_check');
  const djsAbiertas = await consultarDJ({ cuit: settings.cuit, ...periodoActual }, token, settings.environment);
  const djAbierta = djsAbiertas.find(dj => dj.estado !== 'CERRADA');

  if (djAbierta) {
    console.log(`DJ existente encontrada para el período actual. ID: ${djAbierta.idDj}`);
    return djAbierta;
  }
  
  console.log('No se encontró una DJ abierta. Se creará una nueva.');
  onStatusUpdate('dj_close');
  // Lógica de cierre de DJ anterior...

  onStatusUpdate('dj_open');
  const djPayload: DJPayload = {
    cuit: settings.cuit,
    actividadId: settings.actividadId,
    ...periodoActual,
  };
  
  const nuevaDj = await initiateDJ(djPayload, token, settings.environment);
  if (!nuevaDj || !nuevaDj.idDj) throw new Error('No se pudo obtener el idDj al iniciar la nueva DJ.');
  return nuevaDj;
};

// Simula una API local (backend) que orquesta la creación de un comprobante.
export const procesarArchivoLocal = async (
  csvContent: string,
  settings: ReturnType<typeof useSettings>,
  onStatusUpdate: CreateStatusCallback
): Promise<Blob> => {
  const [line] = csvContent.trim().split('\n');
  if (!line) throw new Error('El archivo CSV está vacío o tiene un formato incorrecto.');

  const fields = line.split(',');
  if (fields.length !== 7) throw new Error(`El CSV debe tener 7 campos, pero se encontraron ${fields.length}.`);

  const voucherData: VoucherData = {
    cuitContribuyente: fields[0].trim(),
    sucursal: fields[1].trim(),
    alicuota: parseFloat(fields[2]),
    baseImponible: parseFloat(fields[3]),
    importeRetencion: parseFloat(fields[4]),
    razonSocialContribuyente: fields[5].trim(),
    fechaOperacion: fields[6].trim(),
  };

  onStatusUpdate('auth');
  const token = await getAuthToken({ username: settings.cuit, password: settings.cit }, settings.environment);

  const dj = await gestionarDeclaracionJurada(token, settings, onStatusUpdate);

  onStatusUpdate('upload');
  const voucherPayload: VoucherPayload = { ...voucherData, idDj: dj.idDj, cuitAgente: settings.cuit, mes: dj.mes };
  const uploadResult = await uploadVoucher(voucherPayload, token, settings.environment);
  if (!uploadResult.idComprobante) throw new Error('No se pudo obtener el idComprobante después de subir el voucher.');

  onStatusUpdate('pdf');
  const pdfBlob = await getVoucherPDF(uploadResult.idComprobante, token, settings.environment);
  onStatusUpdate('success');
  return pdfBlob;
};


// Simula una API local (backend) que orquesta la anulación de un comprobante.
export const anularComprobanteLocal = async (
  idComprobante: string,
  settings: ReturnType<typeof useSettings>,
  onStatusUpdate: AnnulStatusCallback
): Promise<{ message: string }> => {
  // 1. Autenticación
  onStatusUpdate('auth');
  const token = await getAuthToken(
    { username: settings.cuit, password: settings.cit },
    settings.environment
  );

  // 2. Enviar solicitud de anulación
  onStatusUpdate('delete');
  const result = await deleteVoucher(idComprobante, token, settings.environment);
  
  onStatusUpdate('success');
  return result;
};