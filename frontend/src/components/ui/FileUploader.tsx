import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

interface FileUploaderProps {
    caseId?: number;
    onUploadComplete: () => void;
}

export default function FileUploader({ caseId, onUploadComplete }: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const { showToast } = useToast();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!caseId) return;
        setUploading(true);

        // Upload one by one
        for (const file of acceptedFiles) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                await api.post(`/cases/${caseId}/attachments`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showToast('success', 'Archivo subido', `${file.name} se ha subido correctamente.`);
            } catch (error) {
                console.error(error);
                showToast('error', 'Error', `No se pudo subir ${file.name}`);
            }
        }

        setUploading(false);
        onUploadComplete();
    }, [caseId, showToast, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <div
            {...getRootProps()}
            className={clsx(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isDragActive
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/50"
            )}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
                {uploading ? (
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                ) : (
                    <Upload className={clsx("text-slate-400", isDragActive && "text-indigo-500")} size={32} />
                )}
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {uploading ? "Subiendo archivos..." : isDragActive ? "Suelta los archivos aquí..." : "Arrastra archivos o haz clic para subir"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Soporta imágenes, PDFs y logs (Máx 10MB)
                </p>
            </div>
        </div>
    );
}
