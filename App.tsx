import React, { useState } from 'react';
import LocalFileProcessor from './components/LocalFileProcessor';
import SettingsModal from './components/SettingsModal';
import { useSettings } from './contexts/SettingsContext';

/**
 * @component App
 * @description
 * El componente raíz principal de la aplicación.
 *
 * Es responsable de renderizar la estructura general de la página, incluyendo
 * el encabezado, el componente principal de procesamiento de archivos (`LocalFileProcessor`),
 * y el pie de página. También gestiona la visibilidad del modal de configuración (`SettingsModal`).
 *
 * @returns {JSX.Element} El componente de la aplicación renderizado.
 */
const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { environment } = useSettings();

  return (
    <div className="font-sans p-4 max-w-4xl mx-auto text-slate-800">
      <header className="flex justify-between items-center border-b border-slate-300 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-700">Procesador de Retenciones ARBA</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium py-1 px-3 bg-slate-200 text-slate-600 rounded-full">
            Ambiente: <strong className="uppercase">{environment}</strong>
          </span>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
            aria-label="Abrir panel de ajustes"
          >
            Ajustes ⚙️
          </button>
        </div>
      </header>

      <main>
        <div className="mt-4 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
          <LocalFileProcessor />
        </div>
      </main>

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      <footer className="text-center mt-8 text-sm text-slate-500">
        <p>Sistema de Procesamiento Automatizado ARBA A-122R</p>
      </footer>
    </div>
  );
};

export default App;
