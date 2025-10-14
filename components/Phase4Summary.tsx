import React from 'react';
import { VoucherResult } from '../types';

interface Phase4SummaryProps {
  results: VoucherResult[];
}

const Phase4Summary: React.FC<Phase4SummaryProps> = ({ results }) => {
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 text-slate-800">Resumen del Procesamiento</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-green-100 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-800">{successCount}</p>
            <p className="text-sm font-medium text-green-700">Comprobantes Exitosos</p>
        </div>
        <div className="p-4 bg-red-100 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-800">{errorCount}</p>
            <p className="text-sm font-medium text-red-700">Comprobantes con Error</p>
        </div>
      </div>

      {errorCount > 0 && (
          <div className="mt-4">
              <h4 className="font-semibold mb-2">Detalle de Errores:</h4>
              <ul className="list-disc pl-5 max-h-48 overflow-y-auto bg-slate-100 p-3 rounded-md">
                  {results.filter(r => r.status === 'error').map((result, index) => (
                      <li key={index} className="text-sm text-red-700 mb-2">
                          <strong>CUIT: {result.originalData.cuitContribuyente}</strong> - {result.message}
                      </li>
                  ))}
              </ul>
          </div>
      )}
    </div>
  );
};

export default Phase4Summary;
