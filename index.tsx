import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SettingsProvider } from './contexts/SettingsContext';

/**
 * @file index.tsx
 * @description
 * Punto de entrada principal de la aplicación React.
 *
 * Este archivo se encarga de:
 * 1. Localizar el elemento `div` raíz en el `index.html`.
 * 2. Crear el árbol de renderizado de React en ese elemento.
 * 3. Renderizar el componente principal `App`.
 * 4. Envolver toda la aplicación con el `SettingsProvider` para que todos los
 *    componentes hijos puedan acceder al contexto de configuración.
 * 5. Usar `React.StrictMode` para activar comprobaciones y advertencias adicionales
 *    durante el desarrollo.
 */

// Busca el elemento raíz en el DOM.
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("No se pudo encontrar el elemento raíz para montar la aplicación");
}

// Crea la raíz de React y renderiza la aplicación.
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </React.StrictMode>
);
