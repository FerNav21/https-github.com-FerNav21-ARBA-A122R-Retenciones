import React from 'react';

interface Phase3VoucherProps {
  progress: number;
  total: number;
}

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
