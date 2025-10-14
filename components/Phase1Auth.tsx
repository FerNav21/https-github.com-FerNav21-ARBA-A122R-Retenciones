import React from 'react';

const Phase1Auth: React.FC = () => {
  return (
    <div className="flex items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p className="ml-4 text-slate-600">Autenticando con los servicios de ARBA...</p>
    </div>
  );
};

export default Phase1Auth;
