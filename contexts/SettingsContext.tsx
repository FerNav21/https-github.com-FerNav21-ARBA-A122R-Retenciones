import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Environment = 'test' | 'production';

// FIX: Export the 'Settings' interface to make it available for import in other files.
export interface Settings {
  environment: Environment;
  cuit: string;
  cit: string;
  anio: string;
  mes: string;
  quincena: string;
  actividadId: string;
  localApiUrl: string;
  networkFolderPath: string;
}

interface SettingsContextState extends Settings {
  setEnvironment: (env: Environment) => void;
  updateSetting: (key: keyof Omit<Settings, 'environment'>, value: string) => void;
  saveSettings: (newSettings: Omit<Settings, 'environment'>) => void;
}

const SettingsContext = createContext<SettingsContextState | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    environment: 'test',
    cuit: '',
    cit: '',
    anio: new Date().getFullYear().toString(),
    mes: (new Date().getMonth() + 1).toString(),
    quincena: '1',
    actividadId: '123456',
    localApiUrl: 'http://localhost:3000/api/process-file',
    networkFolderPath: '\\\\servidor\\archivos_erp\\retenciones\\',
  });

  const setEnvironment = (env: Environment) => {
    setSettings(s => ({ ...s, environment: env }));
  };

  const updateSetting = (key: keyof Omit<Settings, 'environment'>, value: string) => {
    setSettings(s => ({ ...s, [key]: value }));
  };
  
  const saveSettings = (newSettings: Omit<Settings, 'environment'>) => {
    setSettings(s => ({ ...s, ...newSettings }));
  };

  const value = {
    ...settings,
    setEnvironment,
    updateSetting,
    saveSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings debe ser usado dentro de un SettingsProvider');
  }
  return context;
};