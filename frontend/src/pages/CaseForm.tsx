import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/axios';

interface CaseFormData {
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
    const { register, handleSubmit, setValue } = useForm<CaseFormData>();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            api.get(`/cases/${id}`).then(res => {
                const data = res.data;
                setValue('servicio_o_plataforma', data.servicio_o_plataforma);
                setValue('prioridad', data.prioridad);
                setValue('estado', data.estado);
                setValue('sby_responsable', data.sby_responsable || '');
                setValue('novedades_y_comentarios', data.novedades_y_comentarios || '');
                setValue('observaciones', data.observaciones || '');
            }).catch(error => {
                console.error("Error loading case", error);
                if (error.response && error.response.status === 404) {
                    alert("El caso no existe.");
                    navigate('/');
                }
            });
        }
    }, [id, isEdit, setValue]);

    const onSubmit = async (data: CaseFormData) => {
        setLoading(true);
        try {
            if (isEdit) {
                await api.patch(`/cases/${id}`, data);
            } else {
                await api.post('/cases/', data);
            }
            navigate('/');
        } catch (error: any) {
            console.error("Error saving case", error);
            if (error.response && error.response.data && error.response.data.detail) {
                alert(`Error: ${JSON.stringify(error.response.data.detail)}`);
            } else {
                alert("Error al guardar el caso. Verifique su conexión.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">{isEdit ? 'Editar Caso' : 'Nuevo Caso'}</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded shadow space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Servicio / Plataforma</label>
                        <input
                            {...register('servicio_o_plataforma', { required: true })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                        <select
                            {...register('prioridad')}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        >
                            <option value="BAJO">BAJO</option>
                            <option value="MEDIO">MEDIO</option>
                            <option value="ALTO">ALTO</option>
                            <option value="CRITICO">CRITICO</option>
                        </select>
                    </div>

                    {isEdit && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Estado</label>
                            <select
                                {...register('estado')}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            >
                                <option value="ABIERTO">ABIERTO</option>
                                <option value="STANDBY">STANDBY</option>
                                <option value="EN_MONITOREO">EN_MONITOREO</option>
                                <option value="CERRADO">CERRADO</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Responsable SBY</label>
                        <input
                            {...register('sby_responsable')}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Novedades y Comentarios</label>
                    <textarea
                        {...register('novedades_y_comentarios')}
                        rows={6}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm"
                        placeholder="Bitácora de eventos..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                    <textarea
                        {...register('observaciones')}
                        rows={4}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Guardar Caso'}
                    </button>
                </div>
            </form>
        </div>
    );
}
