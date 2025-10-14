import React, { useState, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { procesarArchivoLocal } from '../services/localApi';
import { VoucherData } from '../types';

type StatusStep = 'idle' | 'calling_api' | 'auth' | 'dj_check' | 'dj_close' | 'dj_open' | 'upload' | 'pdf' | 'success' | 'error';

const statusMessages: Record<StatusStep, string> = {
  idle: 'Esperando para iniciar el proceso.',
  calling_api: 'Paso 1/6: Llamando a API Local...',
  auth: 'Paso 2/6: Autenticando con ARBA...',
  dj_check: 'Paso 3/6: Verificando DJ abierta para el período actual...',
  dj_close: 'Paso 3.1/6: Cerrando DJ del período anterior (simulado)...',
  dj_open: 'Paso 3.2/6: Creando nueva DJ para el período actual...',
  upload: 'Paso 4/6: Subiendo datos del comprobante...',
  pdf: 'Paso 5/6: Generando PDF del comprobante...',
  success: 'Paso 6/6: ¡Proceso completado con éxito!',
  error: 'El proceso ha fallado.',
};

const LocalFileProcessor: React.FC = () => {
    const settings = useSettings();
    const [fileName, setFileName] = useState('');
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [status, setStatus] = useState<StatusStep>('idle');
    const [error, setError] = useState<string | null>(null);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStatus('idle');
        setError(null);
        setPdfBlob(null);
        setIsProcessing(false);
        setFileContent(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFileContent(event.target?.result as string);
                setError(null); // Limpiar error si se carga un nuevo archivo
            };
            reader.readAsText(file);
        }
    };
    
    const validateForm = () => {
        if (!fileName.trim() || !/^[a-zA-Z0-9]{1,8}\.[a-zA-Z0-9]{1,3}$/.test(fileName)) {
            setError('Por favor, introduce un nombre de archivo válido en formato 8.3 (ej: r12345.csv).');
            return false;
        }
        if (!fileContent) {
            setError('Por favor, selecciona el archivo CSV para simular la lectura del servidor.');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        resetState();
        if (!validateForm()) return;

        setIsProcessing(true);
        setStatus('calling_api');

        try {
            const resultBlob = await procesarArchivoLocal(
                fileContent!,
                settings,
                (step: StatusStep) => setStatus(step)
            );
            setPdfBlob(resultBlob);
            setStatus('success');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
            setError(errorMessage);
            setStatus('error');
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleDownloadPdf = () => {
        if (!pdfBlob) return;
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        const pdfFileName = fileName.substring(0, fileName.lastIndexOf('.')) + '.pdf';
        a.download = pdfFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-1">Procesador de Archivo Local</h2>
            <p className="text-sm text-slate-600 mb-6">Esta herramienta simula una llamada a una API en su red local para procesar un archivo de retención.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Columna de Formulario */}
                <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                    <div>
                        <label htmlFor="fileName" className="block text-sm font-medium text-gray-700">1. Nombre del Archivo a Procesar en el Servidor</label>
                        <input
                            type="text"
                            id="fileName"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="Ej: r0012345.csv"
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            disabled={isProcessing}
                        />
                    </div>
                     <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">2. Simular Lectura del Servidor (Seleccionar Archivo)</label>
                        <input
                            id="file-upload"
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            disabled={isProcessing}
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
                    >
                        {isProcessing ? 'Procesando...' : 'Procesar Archivo'}
                    </button>
                </div>
                
                {/* Columna de Estado y Resultados */}
                <div className="space-y-4 p-4 border rounded-lg min-h-[210px]">
                     <h3 className="font-semibold text-lg">Estado del Proceso</h3>
                     <div className="p-3 bg-gray-100 rounded-md">
                        <p className="text-gray-800">{statusMessages[status]}</p>
                     </div>
                     {error && (
                         <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
                            <p className="font-bold">Error:</p>
                            <p className="text-sm">{error}</p>
                         </div>
                     )}
                     {pdfBlob && status === 'success' && (
                         <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded-md">
                            <p className="font-bold mb-2">Comprobante PDF generado con éxito.</p>
                             <button
                                onClick={handleDownloadPdf}
                                className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700"
                            >
                                Descargar PDF
                            </button>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default LocalFileProcessor;