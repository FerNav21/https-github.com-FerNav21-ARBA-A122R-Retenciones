import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { DJ, VoucherData, VoucherResult, VoucherPayload } from '../types';
import * as arbaApi from '../services/arbaApi';

import Stepper from './Stepper';
import Phase1Auth from './Phase1Auth';
import Phase2DJ from './Phase2DJ';
import Phase3Voucher from './Phase3Voucher';
import Phase4Summary from './Phase4Summary';

type ProcessingPhase = 'idle' | 'auth' | 'dj' | 'voucher' | 'summary' | 'error';

const STEPS = ['Autenticación', 'Declaración Jurada', 'Carga de Comprobantes', 'Resumen'];

// Helper to parse a simple CSV/TXT file.
// Expects comma-separated values and a header row to be skipped.
// Format: cuitContribuyente,sucursal,alicuota,baseImponible,importeRetencion,razonSocialContribuyente,fechaOperacion
const parseVoucherFile = (fileContent: string): VoucherData[] => {
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) {
        return []; // No data rows
    }
    
    const vouchers: VoucherData[] = [];
    // Start from 1 to skip header
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 7) continue; // Skip malformed lines

        try {
            const voucher: VoucherData = {
                cuitContribuyente: parts[0].trim(),
                sucursal: parts[1].trim(),
                alicuota: parseFloat(parts[2]),
                baseImponible: parseFloat(parts[3]),
                importeRetencion: parseFloat(parts[4]),
                razonSocialContribuyente: parts[5].trim(),
                fechaOperacion: parts[6].trim(), // Expects YYYY-MM-DDTHH:MM:SS format
            };
            // Basic validation
            if (!voucher.cuitContribuyente || isNaN(voucher.baseImponible)) {
                console.warn(`Skipping invalid line: ${lines[i]}`);
                continue;
            }
            vouchers.push(voucher);
        } catch (error) {
            console.error(`Error parsing line: ${lines[i]}`, error);
        }
    }
    return vouchers;
};

const LocalFileProcessor: React.FC = () => {
    const settings = useSettings();
    const [file, setFile] = useState<File | null>(null);
    const [phase, setPhase] = useState<ProcessingPhase>('idle');
    const [currentStep, setCurrentStep] = useState<number>(-1);
    const [dj, setDj] = useState<DJ | null>(null);
    const [voucherProgress, setVoucherProgress] = useState(0);
    const [results, setResults] = useState<VoucherResult[]>([]);
    const [vouchersToProcess, setVouchersToProcess] = useState<VoucherData[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const resetState = () => {
        setFile(null);
        setPhase('idle');
        setCurrentStep(-1);
        setDj(null);
        setVoucherProgress(0);
        setResults([]);
        setVouchersToProcess([]);
        setError(null);
        // Also reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleProcess = async () => {
        if (!file) {
            setError('Por favor, seleccione un archivo.');
            return;
        }

        if (!settings.cuit || !settings.cit) {
            setError('El CUIT y la CIT del agente deben estar configurados en Ajustes.');
            return;
        }

        setError(null);
        
        const fileContent = await file.text();
        const parsedVouchers = parseVoucherFile(fileContent);

        if (parsedVouchers.length === 0) {
            setError('El archivo está vacío o no tiene el formato correcto. Asegúrese de que tenga un encabezado y datos separados por comas.');
            return;
        }
        setVouchersToProcess(parsedVouchers);
        
        let token: string;
        let obtainedDj: DJ;
        
        try {
            // Phase 1: Authentication
            setPhase('auth');
            setCurrentStep(0);
            token = await arbaApi.authenticateARBA({
                // These should be provided by ARBA for your application
                clientId: 'arbanet-client',
                clientSecret: 'arbanet-secret',
                username: settings.cuit,
                password: settings.cit,
            }, settings.environment);

            // Phase 2: Get or Create DJ
            setPhase('dj');
            setCurrentStep(1);
            obtainedDj = await arbaApi.findOrCreateDJ({
                cuit: settings.cuit,
                anio: parseInt(settings.anio, 10),
                mes: parseInt(settings.mes, 10),
                quincena: parseInt(settings.quincena, 10),
                actividadId: settings.actividadId,
            }, token, settings.environment);
            setDj(obtainedDj);

            // Phase 3: Submit Vouchers
            setPhase('voucher');
            setCurrentStep(2);
            const newResults: VoucherResult[] = [];
            for (let i = 0; i < parsedVouchers.length; i++) {
                const voucher = parsedVouchers[i];
                try {
                    const voucherPayload: VoucherPayload = {
                        ...voucher,
                        idDj: obtainedDj.idDj,
                        cuitAgente: settings.cuit,
                        mes: obtainedDj.mes,
                    };
                    const result = await arbaApi.submitVoucher(voucherPayload, token, settings.environment);
                    newResults.push({
                        status: 'success',
                        message: `Comprobante ID: ${result.id}`,
                        comprobanteId: result.id,
                        originalData: voucher,
                    });
                } catch (e: any) {
                    newResults.push({
                        status: 'error',
                        message: e.message || 'Error desconocido',
                        originalData: voucher,
                    });
                }
                setVoucherProgress(((i + 1) / parsedVouchers.length) * 100);
            }
            setResults(newResults);

            // Phase 4: Summary
            setPhase('summary');
            setCurrentStep(3);

        } catch (e: any) {
            setError(e.message || 'Ocurrió un error inesperado durante el proceso.');
            setPhase('error');
        }
    };
    
    const isProcessing = ['auth', 'dj', 'voucher'].includes(phase);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-700">Procesamiento de Archivo Local</h2>
            
            {phase === 'idle' || (phase === 'error' && !isProcessing && results.length === 0) ? (
                <div className="flex flex-col gap-4">
                     <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-700 mb-2">
                            Seleccione el archivo de retenciones (.txt o .csv):
                        </label>
                        <input 
                            id="file-upload" 
                            type="file" 
                            accept=".txt,.csv" 
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100"
                        />
                    </div>
                    <button
                        onClick={handleProcess}
                        disabled={!file}
                        className="self-start bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        Iniciar Procesamiento
                    </button>
                    {error && <p className="mt-4 text-red-600 p-3 bg-red-100 rounded-md">{error}</p>}
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <Stepper steps={STEPS} currentStep={currentStep} />
                    <div className="p-4 border rounded-lg bg-slate-50 min-h-[80px]">
                        {phase === 'auth' && <Phase1Auth />}
                        {phase === 'dj' && <Phase2DJ dj={dj} />}
                        {phase === 'voucher' && <Phase3Voucher progress={voucherProgress} total={vouchersToProcess.length} />}
                        {(phase === 'summary' || phase === 'error') && results.length > 0 && <Phase4Summary results={results} />}
                    </div>
                     {(phase === 'summary' || phase === 'error') && (
                         <div>
                            {error && phase === 'error' && <p className="text-red-600 mb-4 p-3 bg-red-100 rounded-md">{error}</p>}
                            <button
                                onClick={resetState}
                                className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                                Procesar Otro Archivo
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocalFileProcessor;
