import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

/**
 * @typedef {'test' | 'production'} Environment
 * @description Define los posibles entornos de ejecución para la API.
 */
export type Environment = 'test' | 'production';

/**
 * @interface Settings
 * @description Define la estructura del objeto de configuración de la aplicación.
 * @property {Environment} environment - El entorno de la API (test o producción).
 * @property {string} cuit - CUIT del agente de retención.
 * @property {string} cit - Clave de Identificación Tributaria.
 * @property {string} anio - Año para la declaración jurada.
 * @property {string} mes - Mes para la declaración jurada.
 * @property {string} quincena - Quincena para la declaración jurada.
 * @property {string} actividadId - ID de la actividad económica.
 * @property {string} localApiUrl - URL de la API local para procesamiento automatizado.
 * @property {string} networkFolderPath - Ruta de la carpeta de red donde se leen los archivos.
 * @property {boolean} useCustomCredentials - Indica si se deben usar credenciales personalizadas.
 * @property {string} customClientId - Client ID personalizado.
 * @property {string} customClientSecret - Client Secret personalizado.
 */
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
  useCustomCredentials: boolean;
  customClientId: string;
  customClientSecret: string;
}

/**
 * @interface SettingsContextState
 * @description Extiende la interfaz `Settings` para incluir las funciones que manipulan el estado.
 * @property {(env: Environment) => void} setEnvironment - Función para cambiar el entorno.
 * @property {(key: keyof Omit<Settings, 'environment'>, value: string) => void} updateSetting - Función para actualizar un campo específico de la configuración.
 * @property {(newSettings: Omit<Settings, 'environment'>) => void} saveSettings - Función para guardar múltiples cambios en la configuración.
 */
interface SettingsContextState extends Settings {
  setEnvironment: (env: Environment) => void;
  updateSetting: (key: keyof Omit<Settings, 'environment'>, value: string) => void;
  saveSettings: (newSettings: Omit<Settings, 'environment'>) => void;
}

/**
 * @const {React.Context<SettingsContextState | undefined>} SettingsContext
 * @description El Context de React que almacena el estado de la configuración.
 */
const SettingsContext = createContext<SettingsContextState | undefined>(undefined);

/**
 * @function SettingsProvider
 * @description Proveedor de contexto que envuelve la aplicación y proporciona acceso al estado de configuración.
 *              También se encarga de persistir la configuración en `localStorage`.
 * @param {object} props - Propiedades del componente.
 * @param {ReactNode} props.children - Los componentes hijos que tendrán acceso al contexto.
 * @returns {JSX.Element} El componente proveedor.
 */
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('arba-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        return parsedSettings;
      } catch (error) {
        console.error('Error al parsear la configuración desde localStorage', error);
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
      localApiUrl: 'http://localhost:3001/process',
      networkFolderPath: '\\\\servidor\\archivos_erp\\retenciones\\',
      useCustomCredentials: false,
      customClientId: '',
      customClientSecret: '',
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

/**
 * @function useSettings
 * @description Hook personalizado para acceder fácilmente al contexto de configuración.
 * @returns {SettingsContextState} El estado y las funciones del contexto de configuración.
 * @throws {Error} Si se usa fuera de un `SettingsProvider`.
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings debe ser usado dentro de un SettingsProvider');
  }
  return context;
};
