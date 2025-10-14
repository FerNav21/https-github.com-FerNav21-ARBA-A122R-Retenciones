
export interface AuthCredentials {
  clientId: string;
  clientSecret: string;
  username: string; // CUIT
  password: string; // CIT
}

export interface DJPayload {
  cuit: string;
  quincena: number;
  actividadId: string;
  anio: number;
  mes: number;
}

export interface DJQuery extends Omit<DJPayload, 'actividadId'> {}

export interface DJ {
  idDj: string;
  cuit: string;
  anio: number;
  mes: number;
  quincena: number;
  // Se asume que la API puede devolver más campos, como el estado.
  estado?: string;
}

export interface VoucherData {
  cuitContribuyente: string;
  sucursal: string;
  alicuota: number;
  baseImponible: number;
  importeRetencion: number;
  razonSocialContribuyente: string;
  fechaOperacion: string; // YYYY-MM-DDTHH:MM:SS.ms
}

export interface VoucherPayload extends VoucherData {
  idDj: string;
  cuitAgente: string;
  mes: number;
}

export interface VoucherResult {
    status: 'success' | 'error';
    message: string;
    comprobanteId?: string;
    originalData: VoucherData;
}