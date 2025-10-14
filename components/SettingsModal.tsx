import React, { useState } from 'react';
import { useSettings, Environment } from '../contexts/SettingsContext';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const settings = useSettings();
  const [localSettings, setLocalSettings] = useState({
    environment: settings.environment,
    cuit: settings.cuit,
    cit: settings.cit,
    anio: settings.anio,
    mes: settings.mes,
    quincena: settings.quincena,
    actividadId: settings.actividadId,
    localApiUrl: settings.localApiUrl,
    networkFolderPath: settings.networkFolderPath,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    settings.setEnvironment(localSettings.environment as Environment);
    const { environment, ...otherSettings } = localSettings;
    settings.saveSettings(otherSettings);
    onClose();
  };

  const renderInput = (label: string, name: keyof typeof localSettings, type = 'text', placeholder = '') => (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        id={name}
        name={name}
        value={localSettings[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">Ajustes de Configuración</h2>

        {/* --- Sección de Ambiente --- */}
        <div className="mb-4 p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-3 text-slate-700">Ambiente de ARBA</h3>
          <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">Ambiente API</label>
          <select
            id="environment"
            name="environment"
            value={localSettings.environment}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="test">Pruebas (Test)</option>
            <option value="production">Producción</option>
          </select>
        </div>

        {/* --- Sección de Credenciales --- */}
        <div className="mb-4 p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-3 text-slate-700">Credenciales de Agente</h3>
          {renderInput('CUIT del Agente', 'cuit', 'text', 'Ej: 20123456789')}
          {renderInput('Clave de Identificación Tributaria (CIT)', 'cit', 'password')}
        </div>
        
        {/* --- Sección de DJ --- */}
        <div className="mb-4 p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-3 text-slate-700">Período de DJ por Defecto</h3>
           <div className="grid grid-cols-2 gap-4">
            {renderInput('Año', 'anio', 'text', 'Ej: 2024')}
            {renderInput('Mes', 'mes', 'text', 'Ej: 7')}
            {renderInput('Quincena', 'quincena', 'text', '1 o 2')}
            {renderInput('ID de Actividad', 'actividadId', 'text', 'Ej: 123456')}
          </div>
        </div>

        {/* --- Sección de Integración Local --- */}
        <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-slate-700">Configuración de Integración Local</h3>
            {renderInput('URL de API Local', 'localApiUrl', 'text', 'http://localhost/api/process')}
            {renderInput('Ruta de Carpeta en Red', 'networkFolderPath', 'text', '\\\\servidor\\retenciones')}
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
