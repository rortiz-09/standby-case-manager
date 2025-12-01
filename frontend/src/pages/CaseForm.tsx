import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save, ArrowLeft, Clock, Maximize2, FileText, Trash2, Download } from 'lucide-react';
import FileUploader from '../components/ui/FileUploader';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { clsx } from 'clsx';
import { Timeline } from '../components/Timeline';
import { TimelineModal } from '../components/ui/TimelineModal';

interface CaseFormData {
    codigo?: string;
    servicio_o_plataforma: string;
    prioridad: string;
    estado: string;
    sby_responsable: string;
    novedades_y_comentarios: string;
    observaciones: string;
}

export default function CaseForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const { register, handleSubmit, setValue, formState: { errors } } = useForm<CaseFormData>();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    // Get current user ID from local storage for "Me" bubble
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const currentUserId = user?.id;

    // Fetch Timeline
    const { data: timeline = [] } = useQuery({
        queryKey: ['timeline', id],
        queryFn: async () => {
            if (!isEdit) return [];
            const res = await api.get(`/cases/${id}/timeline`);
            return res.data;
        },
        enabled: isEdit,
        refetchInterval: 10000 // Poll for chat updates
    });

    // Fetch case data if editing
    // Fetch case data if editing
    const { data: caseData } = useQuery({
        queryKey: ['case', id],
        queryFn: async () => {
            if (!isEdit) return null;
            const res = await api.get(`/cases/${id}`);
            return res.data;
        },
        enabled: isEdit,
        retry: false,
    });

    useEffect(() => {
        if (caseData) {
            setValue('codigo', caseData.codigo);
            setValue('servicio_o_plataforma', caseData.servicio_o_plataforma);
            setValue('prioridad', caseData.prioridad);
            setValue('estado', caseData.estado);
            setValue('sby_responsable', caseData.sby_responsable || '');
            setValue('novedades_y_comentarios', caseData.novedades_y_comentarios || '');
            // setExistingObservations(caseData.observaciones || '');
            // Observations are handled by timeline query now
        }
    }, [caseData, setValue]);

    const createCaseMutation = useMutation({
        mutationFn: (data: CaseFormData) => api.post('/cases/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            showToast('success', 'Caso creado', 'El nuevo caso ha sido registrado.');
            navigate('/');
        },
        onError: (error: any) => {
            showToast('error', 'Error', error.response?.data?.detail || 'Error al crear caso');
        }
    });

    const updateCaseMutation = useMutation({
        mutationFn: (data: CaseFormData) => api.patch(`/cases/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['case', id] });
            queryClient.invalidateQueries({ queryKey: ['timeline', id] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            showToast('success', 'Caso actualizado', 'Los cambios han sido guardados correctamente.');
            navigate('/');
        },
        onError: (error: any) => {
            showToast('error', 'Error', error.response?.data?.detail || 'Error al actualizar caso');
        }
    });

    // Refresh attachments after upload
    const handleUploadComplete = () => {
        queryClient.invalidateQueries({ queryKey: ['case', id] });
    };

    const handleDeleteAttachment = async (attachmentId: number) => {
        if (!confirm('¿Estás seguro de eliminar este archivo?')) return;
        try {
            await api.delete(`/cases/attachments/${attachmentId}`);
            showToast('success', 'Archivo eliminado', 'El archivo ha sido eliminado correctamente.');
            queryClient.invalidateQueries({ queryKey: ['case', id] });
        } catch (error) {
            console.error(error);
            showToast('error', 'Error', 'No se pudo eliminar el archivo.');
        }
    };

    const onSubmit = (data: CaseFormData) => {
        if (isEdit) {
            updateCaseMutation.mutate(data);
        } else {
            createCaseMutation.mutate(data);
        }
    };

    const loading = createCaseMutation.isPending || updateCaseMutation.isPending;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                    <ArrowLeft size={22} className="text-slate-600 dark:text-slate-300" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {isEdit ? 'Editar Caso' : 'Nuevo Caso'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {isEdit ? `Actualizando información del caso` : 'Complete el formulario para registrar un nuevo caso'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-vscode-sidebar p-8 rounded-xl shadow-sm border border-slate-200 dark:border-vscode-border space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Manual ID Input - Mandatory */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-vscode-text mb-1">
                            ID del Caso <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('codigo', { required: "El ID del caso es obligatorio" })}
                            disabled={isEdit}
                            placeholder="Ej: CASO-1001"
                            className={clsx(
                                "w-full rounded-lg border bg-slate-50 dark:bg-vscode-activity p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white disabled:opacity-60 disabled:cursor-not-allowed",
                                errors.codigo ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-vscode-border"
                            )}
                        />
                        {errors.codigo && <span className="text-xs text-red-500 mt-1">{errors.codigo.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-vscode-text mb-1">Servicio / Plataforma</label>
                        <input
                            {...register('servicio_o_plataforma', { required: true })}
                            className="w-full rounded-lg border-slate-300 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-vscode-text mb-1">Prioridad</label>
                        <select
                            {...register('prioridad')}
                            className="w-full rounded-lg border-slate-300 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                        >
                            <option value="BAJO">BAJO</option>
                            <option value="MEDIO">MEDIO</option>
                            <option value="ALTO">ALTO</option>
                            <option value="CRITICO">CRITICO</option>
                        </select>
                    </div>

                    {isEdit && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-vscode-text mb-1">Estado</label>
                            <select
                                {...register('estado')}
                                className="w-full rounded-lg border-slate-300 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                            >
                                <option value="ABIERTO">ABIERTO</option>
                                <option value="STANDBY">STANDBY</option>
                                <option value="EN_MONITOREO">EN_MONITOREO</option>
                                <option value="CERRADO">CERRADO</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-vscode-text mb-1">Responsable SBY</label>
                        <input
                            {...register('sby_responsable')}
                            className="w-full rounded-lg border-slate-300 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-vscode-text mb-2">
                        Motivo <span className="text-slate-400 font-normal">(Novedades y comentarios)</span>
                    </label>
                    <textarea
                        {...register('novedades_y_comentarios')}
                        rows={4}
                        className="w-full rounded-lg border-slate-300 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-mono text-sm"
                        placeholder="Descripción detallada del caso..."
                    />
                </div>

                {/* Evidence Vault */}
                {isEdit && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-vscode-text mb-4">
                            Bóveda de Evidencias
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* List of attachments */}
                            <div className="space-y-3">
                                {caseData?.attachments && caseData.attachments.length > 0 ? (
                                    caseData.attachments.map((file: any) => (
                                        <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-vscode-activity rounded-lg border border-slate-200 dark:border-vscode-border group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {file.content_type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.filename) ? (
                                                    <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                                        <img
                                                            src={`http://localhost:8000/${file.file_path.replace(/\\/g, '/')}`}
                                                            alt={file.filename}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                                                        <FileText size={20} />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={file.filename}>
                                                        {file.filename}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {(file.file_size / 1024).toFixed(1)} KB • {new Date(file.uploaded_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <a
                                                    href={`http://localhost:8000/${file.file_path.replace(/\\/g, '/')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-md transition-colors"
                                                    title="Ver/Descargar"
                                                >
                                                    {file.content_type.startsWith('image/') ? <Maximize2 size={16} /> : <Download size={16} />}
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteAttachment(file.id)}
                                                    className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-md transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm italic border border-dashed border-slate-200 dark:border-vscode-border rounded-lg">
                                        No hay evidencias adjuntas
                                    </div>
                                )}
                            </div>

                            {/* Uploader */}
                            <div>
                                <FileUploader caseId={Number(id)} onUploadComplete={handleUploadComplete} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-vscode-text mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Clock size={14} /> Historial de Observaciones</span>
                            <button
                                type="button"
                                onClick={() => setIsHistoryOpen(true)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                title="Ver pantalla completa"
                            >
                                <Maximize2 size={12} /> Ampliar
                            </button>
                        </label>
                        <div className="w-full h-96 rounded-lg border border-slate-300 dark:border-vscode-border bg-slate-50/50 dark:bg-vscode-bg p-4 overflow-y-auto custom-scrollbar">
                            <Timeline items={timeline} currentUserId={currentUserId} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-vscode-text mb-2">
                            Agregar Observación
                        </label>
                        <textarea
                            {...register('observaciones')}
                            rows={6}
                            className="w-full rounded-lg border-slate-300 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                            placeholder="Escriba una nueva observación para agregar al historial..."
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            * Se agregará automáticamente la fecha y hora al guardar.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-vscode-border">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="px-6 py-2.5 border border-slate-300 dark:border-vscode-border text-slate-700 dark:text-vscode-text rounded-lg hover:bg-slate-50 dark:hover:bg-vscode-hover transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-lg shadow-indigo-500/20"
                    >
                        <Save size={16} />
                        {loading ? 'Guardando...' : 'Guardar Caso'}
                    </button>
                </div>
            </form>

            <TimelineModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                items={timeline}
                currentUserId={currentUserId}
            />
        </div>
    );
}
