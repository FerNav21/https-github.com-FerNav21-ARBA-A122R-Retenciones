import { getAuthToken, initiateDJ, uploadVoucher, getVoucherPDF } from './arbaApi';
import { DJPayload, VoucherData, VoucherPayload } from '../types';
import { useSettings } from '../contexts/SettingsContext';

type StatusCallback = (step: 'auth' | 'dj' | 'upload' | 'pdf') => void;

// Simula una API local (backend) que orquesta todo el proceso de ARBA.
export const procesarArchivoLocal = async (
  csvContent: string,
  settings: ReturnType<typeof useSettings>,
  onStatusUpdate: StatusCallback
): Promise<Blob> => {
  // 1. Parsear el contenido del CSV (debe contener una sola línea)
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

  // 3. Iniciar Declaración Jurada (DJ)
  onStatusUpdate('dj');
  const djPayload: DJPayload = {
    cuit: settings.cuit,
    anio: parseInt(settings.anio, 10),
    mes: parseInt(settings.mes, 10),
    quincena: parseInt(settings.quincena, 10),
    actividadId: settings.actividadId,
  };
  const dj = await initiateDJ(djPayload, token, settings.environment);

  if (!dj.idDj) {
    throw new Error('No se pudo obtener el idDj al iniciar la Declaración Jurada.');
  }

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
