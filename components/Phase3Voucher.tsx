import React from 'react';

/**
 * @interface Phase3VoucherProps
 * @description Define las propiedades para el componente `Phase3Voucher`.
 * @property {number} progress - El progreso de la carga de comprobantes, como un porcentaje (0-100).
 * @property {number} total - El número total de comprobantes a procesar.
 */
interface Phase3VoucherProps {
  progress: number;
  total: number;
}

/**
 * @component Phase3Voucher
 * @description
 * Componente visual para la tercera fase del proceso: la carga de comprobantes.
 *
 * Muestra una barra de progreso que se actualiza a medida que se envían los
 * comprobantes a la API. También muestra un contador del número de
 * comprobantes procesados frente al total.
 *
 * @param {Phase3VoucherProps} props - Las propiedades del componente.
 * @returns {JSX.Element} El componente renderizado.
 */
const Phase3Voucher: React.FC<Phase3VoucherProps> = ({ progress, total }) => {
    const processedCount = Math.round((progress / 100) * total);
  return (
    <div>
      <p className="mb-2 text-slate-600">
        Cargando comprobantes... {processedCount} de {total}
      </p>
      <div className="w-full bg-slate-200 rounded-full h-4">
        <div
          className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Phase3Voucher;
