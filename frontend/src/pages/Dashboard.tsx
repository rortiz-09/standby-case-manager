import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { clsx } from 'clsx';

interface Case {
    id: number;
    codigo: string;
    estado: string;
    prioridad: string;
    servicio_o_plataforma: string;
    sby_responsable: string;
    ultima_actualizacion: string;
}

export default function Dashboard() {
    const [cases, setCases] = useState<Case[]>([]);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        service: '',
        sby_responsable: '',
        search: ''
    });

    const [error, setError] = useState('');

    const fetchCases = async () => {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.service) params.append('service', filters.service);
        if (filters.sby_responsable) params.append('sby_responsable', filters.sby_responsable);
        if (filters.search) params.append('search', filters.search);

        try {
            setError('');
            const res = await api.get(`/cases/?${params.toString()}`);
            setCases(res.data);
        } catch (error) {
            console.error("Error fetching cases", error);
            setError('No se pudieron cargar los casos. Por favor intente más tarde.');
        }
    };

    useEffect(() => {
        fetchCases();
    }, [filters]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CRITICO': return 'text-red-600 font-bold';
            case 'ALTO': return 'text-orange-600 font-bold';
            case 'CERRADO': return 'text-green-600';
            case 'STANDBY': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Tablero de Casos</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded shadow mb-6 flex gap-4 flex-wrap">
                <select
                    className="border p-2 rounded"
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="">Todos los Estados</option>
                    <option value="ABIERTO">Abierto</option>
                    <option value="STANDBY">Standby</option>
                    <option value="EN_MONITOREO">En Monitoreo</option>
                    <option value="CERRADO">Cerrado</option>
                </select>

                <select
                    className="border p-2 rounded"
                    value={filters.priority}
                    onChange={e => setFilters({ ...filters, priority: e.target.value })}
                >
                    <option value="">Todas las Prioridades</option>
                    <option value="CRITICO">Crítico</option>
                    <option value="ALTO">Alto</option>
                    <option value="MEDIO">Medio</option>
                    <option value="BAJO">Bajo</option>
                </select>

                <input
                    type="text"
                    placeholder="Servicio..."
                    className="border p-2 rounded"
                    value={filters.service}
                    onChange={e => setFilters({ ...filters, service: e.target.value })}
                />

                <input
                    type="text"
                    placeholder="Responsable..."
                    className="border p-2 rounded"
                    value={filters.sby_responsable}
                    onChange={e => setFilters({ ...filters, sby_responsable: e.target.value })}
                />

                <input
                    type="text"
                    placeholder="Buscar..."
                    className="border p-2 rounded flex-1"
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded shadow overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-4">Código</th>
                            <th className="p-4">Servicio</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4">Prioridad</th>
                            <th className="p-4">Responsable</th>
                            <th className="p-4">Actualizado</th>
                            <th className="p-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cases.map((c) => (
                            <tr key={c.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-mono">{c.codigo}</td>
                                <td className="p-4">{c.servicio_o_plataforma}</td>
                                <td className={clsx("p-4", getStatusColor(c.estado))}>{c.estado}</td>
                                <td className={clsx("p-4", getStatusColor(c.prioridad))}>{c.prioridad}</td>
                                <td className="p-4">{c.sby_responsable || '-'}</td>
                                <td className="p-4 text-sm text-gray-500">{new Date(c.ultima_actualizacion).toLocaleString()}</td>
                                <td className="p-4">
                                    <Link to={`/cases/${c.id}`} className="text-indigo-600 hover:underline">Ver/Editar</Link>
                                </td>
                            </tr>
                        ))}
                        {cases.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500">No se encontraron casos</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
