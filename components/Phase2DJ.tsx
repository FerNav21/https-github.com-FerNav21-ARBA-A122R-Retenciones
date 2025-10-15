import React from 'react';
import { DJ } from '../types';

/**
 * @interface Phase2DJProps
 * @description Define las propiedades que recibe el componente `Phase2DJ`.
 * @property {DJ | null} dj - El objeto de la Declaración Jurada obtenida. Es `null` mientras la operación está en curso.
 */
interface Phase2DJProps {
  dj: DJ | null;
}

/**
 * @component Phase2DJ
 * @description
 * Componente visual para la segunda fase del proceso: obtención de la Declaración Jurada (DJ).
 *
 * Muestra un indicador de carga mientras busca o crea la DJ. Una vez que la DJ
 * se obtiene con éxito, muestra la información clave de la misma, como su ID y período.
 *
 * @param {Phase2DJProps} props - Las propiedades del componente.
 * @returns {JSX.Element} El componente renderizado.
 */
const Phase2DJ: React.FC<Phase2DJProps> = ({ dj }) => {
  return (
    <div>
      <div className="flex items-center mb-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-slate-600">Buscando o creando Declaración Jurada...</p>
      </div>
      {dj && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md text-sm text-green-800">
          <p>
            Declaración Jurada obtenida con éxito. <strong>ID: {dj.idDj}</strong>
          </p>
          <p>
            Período: {dj.anio}-{String(dj.mes).padStart(2, '0')}, Quincena {dj.quincena}
          </p>
        </div>
      )}
    </div>
  );
};

export default Phase2DJ;
