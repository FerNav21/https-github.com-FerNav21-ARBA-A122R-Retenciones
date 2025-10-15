import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type Environment = 'test' | 'production';

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
  useCustomCredentials: boolean;      // ➕ NUEVO
  customClientId: string;             // ➕ NUEVO
  customClientSecret: string;         // ➕ NUEVO
}


interface SettingsContextState extends Settings {
  setEnvironment: (env: Environment) => void;
  updateSetting: (key: keyof Omit<Settings, 'environment'>, value: string) => void;
  saveSettings: (newSettings: Omit<Settings, 'environment'>) => void;
}

const SettingsContext = createContext<SettingsContextState | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('arba-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // migrations or validations can be added here if the settings structure changes over time
        return parsedSettings;
      } catch (error) {
        console.error('Error parsing settings from localStorage', error);
        // Return default settings if parsing fails
      }
    }
    return {
      environment: 'test',
      cuit: '',
      cit: '',
      anio: new Date().getFullYear().toString(),
      mes: (new Date().getMonth() + 1).toString(),
      quincena: '0',
      actividadId: '6',

      networkFolderPath: '\\\\servidor\\archivos_erp\\retenciones\\',
      useCustomCredentials: false,      // ➕ NUEVO
      customClientId: '',               // ➕ NUEVO
      customClientSecret: '',           // ➕ NUEVO
    };
  });

  useEffect(() => {
    localStorage.setItem('arba-settings', JSON.stringify(settings));
  }, [settings]);


  const setEnvironment = (env: Environment) => {
    setSettings(s => ({ ...s, environment: env }));
  };

  const updateSetting = (key: keyof Omit<Settings, 'environment'>, value: string | boolean) => {
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