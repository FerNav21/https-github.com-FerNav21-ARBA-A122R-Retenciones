import React, { useState, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { procesarArchivoLocal, anularComprobanteLocal } from '../services/localApi';

type Mode = 'create' | 'annul';
type CreateStatusStep = 'idle' | 'calling_api' | 'auth' | 'dj_check' | 'dj_close' | 'dj_open' | 'upload' | 'pdf' | 'success' | 'error';
type AnnulStatusStep = 'idle' | 'calling_api' | 'auth' | 'delete' | 'success' | 'error';

const createStatusMessages: Record<CreateStatusStep, string> = {
  idle: 'Esperando para iniciar el proceso de creación.',
  calling_api: 'Paso 1/6: Llamando a API Local...',
  auth: 'Paso 2/6: Autenticando con ARBA...',
  dj_check: 'Paso 3/6: Verificando DJ abierta para el período actual...',
  dj_close: 'Paso 3.1/6: Cerrando DJ del período anterior (simulado)...',
  dj_open: 'Paso 3.2/6: Creando nueva DJ para el período actual...',
  upload: 'Paso 4/6: Subiendo datos del comprobante...',
  pdf: 'Paso 5/6: Generando PDF del comprobante...',
  success: 'Paso 6/6: ¡Proceso de creación completado con éxito!',
  error: 'El proceso de creación ha fallado.',
};

const annulStatusMessages: Record<AnnulStatusStep, string> = {
  idle: 'Esperando para iniciar el proceso de anulación.',
  calling_api: 'Paso 1/3: Llamando a API Local...',
  auth: 'Paso 2/3: Autenticando con ARBA...',
  delete: 'Paso 3/3: Enviando solicitud de anulación a ARBA...',
  success: '¡Proceso de anulación completado con éxito!',
  error: 'El proceso de anulación ha fallado.',
};

const LocalFileProcessor: React.FC = () => {
    const settings = useSettings();
    const [mode, setMode] = useState<Mode>('create');
    
    // State for Creation
    const [fileName, setFileName] = useState('');
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [createStatus, setCreateStatus] = useState<CreateStatusStep>('idle');
    const [createError, setCreateError] = useState<string | null>(null);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for Annulment
    const [idToDelete, setIdToDelete] = useState('');
    const [annulStatus, setAnnulStatus] = useState<AnnulStatusStep>('idle');
    const [annulError, setAnnulError] = useState<string | null>(null);
    const [annulSuccess, setAnnulSuccess] = useState<string | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);

    const resetCreateState = () => {
        setCreateStatus('idle');
        setCreateError(null);
        setPdfBlob(null);
        setFileContent(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const resetAnnulState = () => {
        setAnnulStatus('idle');
        setAnnulError(null);
        setAnnulSuccess(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setFileContent(event.target?.result as string);
            reader.readAsText(file);
        }
    };
    
    const handleCreateSubmit = async () => {
        resetCreateState();
        if (!fileName.trim() || !/^[a-zA-Z0-9]{1,8}\.[a-zA-Z0-9]{1,3}$/.test(fileName)) {
            setCreateError('Por favor, introduce un nombre de archivo válido en formato 8.3 (ej: r12345.csv).');
            return;
        }
        if (!fileContent) {
            setCreateError('Por favor, selecciona el archivo CSV para simular la lectura del servidor.');
            return;
        }

        setIsProcessing(true);
        try {
            const resultBlob = await procesarArchivoLocal(fileContent, settings, setCreateStatus);
            setPdfBlob(resultBlob);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
            setCreateError(msg);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleAnnulSubmit = async () => {
        resetAnnulState();
        if (!idToDelete.trim() || !/^\d+$/.test(idToDelete)) {
            setAnnulError('Por favor, introduce un ID de Comprobante numérico y válido.');
            return;
        }

        setIsProcessing(true);
        try {
            const result = await anularComprobanteLocal(idToDelete, settings, setAnnulStatus);
            setAnnulSuccess(result.message || `El comprobante ${idToDelete} fue anulado.`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
            setAnnulError(msg);
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
        a.click();
        URL.revokeObjectURL(url);
    };

    const TabButton: React.FC<{ currentMode: Mode, targetMode: Mode, children: React.ReactNode }> = ({ currentMode, targetMode, children }) => (
        <button
            onClick={() => setMode(targetMode)}
            disabled={isProcessing}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors disabled:opacity-50 ${
                currentMode === targetMode
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-slate-500 hover:text-slate-700'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div>
            <div className="border-b border-slate-200 mb-6">
                <TabButton currentMode={mode} targetMode="create">Crear Retención</TabButton>
                <TabButton currentMode={mode} targetMode="annul">Anular Retención</TabButton>
            </div>

            {mode === 'create' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Create Form */}
                    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                         <h2 className="text-xl font-bold mb-1">Crear Comprobante</h2>
                        <div>
                            <label htmlFor="fileName" className="block text-sm font-medium text-gray-700">1. Nombre del Archivo</label>
                            <input type="text" id="fileName" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="Ej: r0012345.csv" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" disabled={isProcessing} />
                        </div>
                         <div>
                            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">2. Seleccionar Archivo</label>
                            <input id="file-upload" ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" disabled={isProcessing} />
                        </div>
                        <button onClick={handleCreateSubmit} disabled={isProcessing} className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors">
                            {isProcessing ? 'Procesando...' : 'Procesar Archivo'}
                        </button>
                    </div>
                    {/* Create Status */}
                    <div className="space-y-4 p-4 border rounded-lg min-h-[210px]">
                         <h3 className="font-semibold text-lg">Estado del Proceso de Creación</h3>
                         <div className="p-3 bg-gray-100 rounded-md"><p>{createStatusMessages[createStatus]}</p></div>
                         {createError && (<div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md"><p className="font-bold">Error:</p><p className="text-sm">{createError}</p></div>)}
                         {pdfBlob && createStatus === 'success' && (
                             <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded-md">
                                <p className="font-bold mb-2">PDF generado con éxito.</p>
                                 <button onClick={handleDownloadPdf} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Descargar PDF</button>
                             </div>
                         )}
                    </div>
                </div>
            )}

            {mode === 'annul' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Annul Form */}
                     <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                        <h2 className="text-xl font-bold mb-1">Anular Comprobante</h2>
                        <div>
                            <label htmlFor="idToDelete" className="block text-sm font-medium text-gray-700">ID del Comprobante a Anular</label>
                            <input type="text" id="idToDelete" value={idToDelete} onChange={(e) => setIdToDelete(e.target.value)} placeholder="Ej: 987654321" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" disabled={isProcessing} />
                        </div>
                        <button onClick={handleAnnulSubmit} disabled={isProcessing} className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors">
                            {isProcessing ? 'Anulando...' : 'Anular Comprobante'}
                        </button>
                    </div>
                    {/* Annul Status */}
                    <div className="space-y-4 p-4 border rounded-lg min-h-[210px]">
                         <h3 className="font-semibold text-lg">Estado del Proceso de Anulación</h3>
                         <div className="p-3 bg-gray-100 rounded-md"><p>{annulStatusMessages[annulStatus]}</p></div>
                         {annulError && (<div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md"><p className="font-bold">Error:</p><p className="text-sm">{annulError}</p></div>)}
                         {annulSuccess && annulStatus === 'success' && (<div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded-md"><p className="font-bold">{annulSuccess}</p></div>)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocalFileProcessor;
