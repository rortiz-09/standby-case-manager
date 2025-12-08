import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save, ArrowLeft, Clock, Edit2, X, Check } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { clsx } from 'clsx';

interface CaseFormData {
    codigo?: string;
    servicio_o_plataforma: string;
    prioridad: string;
    estado: string;
    sby_responsable: string;
    novedades_y_comentarios: string;
    observaciones: string;
}

interface Observation {
    id: number;
    content: string;
    created_at: string;
    created_by_id: number;
}

export default function CaseForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const { register, handleSubmit, setValue, formState: { errors } } = useForm<CaseFormData>();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [existingObservations, setExistingObservations] = useState('');
    const [observationList, setObservationList] = useState<Observation[]>([]);
    const [editingObsId, setEditingObsId] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState('');

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
            setExistingObservations(caseData.observaciones || '');
            if (caseData.observaciones_list && Array.isArray(caseData.observaciones_list)) {
                setObservationList(caseData.observaciones_list);
            } else {
                setObservationList([]);
            }
        }
    }, [caseData, setValue]);

    const createCaseMutation = useMutation({
        mutationFn: (data: CaseFormData) => api.post('/cases/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            showToast('success', 'Caso creado', 'El nuevo caso ha sido registrado.');
            navigate('/');
        },
        onError: (error: any) => {
            showToast('error', 'Error', error.response?.data?.detail || 'Error al crear caso');
        }
    });

    const updateObservationMutation = useMutation({
        mutationFn: ({ id, content }: { id: number, content: string }) => api.patch(`/cases/observations/${id}`, { content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['case', id] });
            showToast('success', 'Observación actualizada', 'El comentario ha sido modificado.');
            setEditingObsId(null);
            setEditingContent('');
        },
        onError: (error: any) => {
            showToast('error', 'Error', error.response?.data?.detail || 'Error al actualizar observación');
        }
    });

    const handleEditObservation = (obs: Observation) => {
        setEditingObsId(obs.id);
        setEditingContent(obs.content);
    };

    const handleSaveObservation = (id: number) => {
        if (!editingContent.trim()) return;
        updateObservationMutation.mutate({ id, content: editingContent });
    };

    const handleCancelEdit = () => {
        setEditingObsId(null);
        setEditingContent('');
    };

    const updateCaseMutation = useMutation({
        mutationFn: (data: CaseFormData) => api.patch(`/cases/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['case', id] });
            showToast('success', 'Caso actualizado', 'Los cambios han sido guardados correctamente.');
            navigate('/');
        },
        onError: (error: any) => {
            showToast('error', 'Error', error.response?.data?.detail || 'Error al actualizar caso');
        }
    });

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-vscode-text mb-2 flex items-center gap-2">
                            <Clock size={14} /> Historial de Observaciones
                        </label>
                        <div className="w-full h-48 rounded-lg border border-slate-300 dark:border-vscode-border bg-slate-100 dark:bg-vscode-bg p-3 overflow-y-auto font-mono text-sm text-slate-600 dark:text-vscode-text whitespace-pre-wrap space-y-3">
                            {/* Legacy Observations */}
                            {existingObservations && (
                                <div className="p-2 bg-white dark:bg-vscode-activity rounded border border-slate-200 dark:border-vscode-border">
                                    <p className="text-xs text-slate-400 mb-1">Notas Antiguas:</p>
                                    {existingObservations}
                                </div>
                            )}

                            {/* New Observations List */}
                            {observationList.length > 0 ? (
                                observationList.map((obs) => (
                                    <div key={obs.id} className="p-3 bg-white dark:bg-vscode-activity rounded border border-slate-200 dark:border-vscode-border group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs text-slate-400 font-mono">
                                                {(() => {
                                                    // Ensure date is treated as UTC
                                                    let dateStr = obs.created_at;
                                                    if (!dateStr.endsWith('Z')) dateStr += 'Z';
                                                    return new Date(dateStr).toLocaleString('es-ES', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    });
                                                })()}
                                            </span>
                                            {editingObsId !== obs.id && (
                                                <button
                                                    onClick={() => handleEditObservation(obs)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-vscode-hover rounded transition-all text-slate-500"
                                                    title="Editar observación"
                                                    type="button"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                            )}
                                        </div>

                                        {editingObsId === obs.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editingContent}
                                                    onChange={(e) => setEditingContent(e.target.value)}
                                                    className="w-full p-2 text-sm border rounded dark:bg-vscode-bg dark:border-vscode-border dark:text-white"
                                                    rows={3}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        id={`cancel-obs-${obs.id}`}
                                                        onClick={handleCancelEdit}
                                                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        id={`save-obs-${obs.id}`}
                                                        onClick={() => handleSaveObservation(obs.id)}
                                                        className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{obs.content}</p>
                                        )}
                                    </div>
                                ))
                            ) : !existingObservations && (
                                <p className="text-slate-400 italic text-sm p-2">No hay observaciones registradas.</p>
                            )}
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
        </div>
    );
}
