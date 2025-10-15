import React from 'react';

/**
 * @interface StepperProps
 * @description Define las propiedades para el componente `Stepper`.
 * @property {string[]} steps - Un array de strings, donde cada string es la etiqueta para un paso.
 * @property {number} currentStep - El índice (basado en cero) del paso actual.
 */
interface StepperProps {
  steps: string[];
  currentStep: number;
}

/**
 * @component Stepper
 * @description
 * Un componente de interfaz de usuario que muestra una guía visual de progreso
 * a través de una secuencia de pasos.
 *
 * Resalta el paso actual, marca los pasos completados con un tic y deja
 * los pasos futuros en un estado inactivo. Es útil para guiar al usuario
 * a través de flujos de trabajo de varias etapas.
 *
 * @param {StepperProps} props - Las propiedades del componente.
 * @returns {JSX.Element} El componente stepper renderizado.
 */
const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                index <= currentStep ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-600'
              }`}
            >
              {/* Muestra un tic si el paso fue completado, sino el número del paso */}
              {index < currentStep ? '✓' : index + 1}
            </div>
            <p className={`ml-3 font-medium ${index <= currentStep ? 'text-indigo-700' : 'text-slate-500'}`}>
              {step}
            </p>
          </div>
          {/* Renderiza una línea de conexión entre los pasos */}
          {index < steps.length - 1 && (
            <div className={`flex-auto border-t-2 transition-colors duration-500 ease-in-out mx-4 ${
                index < currentStep ? 'border-indigo-600' : 'border-slate-300'
            }`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Stepper;
