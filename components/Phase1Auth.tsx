import React from 'react';

/**
 * @component Phase1Auth
 * @description
 * Componente visual que se muestra durante la primera fase del proceso: la autenticación.
 *
 * Renderiza un indicador de carga (spinner) y un mensaje de texto para informar
 * al usuario que la aplicación se está comunicando con los servicios de ARBA
 * para obtener un token de acceso.
 *
 * @returns {JSX.Element} El componente renderizado.
 */
const Phase1Auth: React.FC = () => {
  return (
    <div className="flex items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p className="ml-4 text-slate-600">Autenticando con los servicios de ARBA...</p>
    </div>
  );
};

export default Phase1Auth;
