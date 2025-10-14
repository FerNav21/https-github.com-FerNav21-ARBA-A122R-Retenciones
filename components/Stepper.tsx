import React from 'react';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

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
              {index < currentStep ? '✓' : index + 1}
            </div>
            <p className={`ml-3 font-medium ${index <= currentStep ? 'text-indigo-700' : 'text-slate-500'}`}>
              {step}
            </p>
          </div>
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
