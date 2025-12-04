import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, AlertCircle, ArrowRight, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { clsx } from 'clsx';
import { Skeleton } from '../components/Skeleton';

interface Case {
    id: number;
    codigo: string;
    estado: string;
    prioridad: string;
    servicio_o_plataforma: string;
    sby_responsable: string;
    novedades_y_comentarios: string;
    ultima_actualizacion: string;
}

export default function Dashboard() {
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        service: '',
        sby_responsable: '',
        search: '',
        start_date: '',
        end_date: ''
    });

    const { data: cases = [], isLoading, isError } = useQuery({
        queryKey: ['cases', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.service) params.append('service', filters.service);
            if (filters.sby_responsable) params.append('sby_responsable', filters.sby_responsable);
            if (filters.search) params.append('search', filters.search);
            if (filters.start_date) params.append('start_date', filters.start_date);
            if (filters.end_date) params.append('end_date', filters.end_date);

            const res = await api.get(`/cases/?${params.toString()}`);
            return res.data as Case[];
        },
        staleTime: 60000, // 1 minute
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CRITICO': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case 'ALTO': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
            case 'CERRADO': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
            case 'STANDBY': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
            case 'EN_MONITOREO': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'CRITICO': return 'text-red-600 dark:text-red-400 font-bold';
            case 'ALTO': return 'text-orange-600 dark:text-orange-400 font-bold';
            case 'MEDIO': return 'text-yellow-600 dark:text-yellow-400';
            case 'BAJO': return 'text-emerald-600 dark:text-emerald-400';
            default: return 'text-slate-600 dark:text-slate-400';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tablero de Casos</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Monitoreo y gestión de incidentes en tiempo real.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <Activity size={14} className="text-indigo-500" />
                    <span>{cases.length} casos encontrados</span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-vscode-sidebar p-5 rounded-xl shadow-sm border border-slate-200 dark:border-vscode-border space-y-4">
                <div className="flex items-center gap-2 text-slate-700 dark:text-vscode-text font-medium mb-2">
                    <Filter size={16} /> Filtros de Búsqueda
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por código o motivo..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm placeholder-slate-400"
                            value={filters.search}
                            onChange={e => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    <select
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
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
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
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
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm placeholder-slate-400"
                        value={filters.service}
                        onChange={e => setFilters({ ...filters, service: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-vscode-border">
                    <input
                        type="text"
                        placeholder="Responsable..."
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm placeholder-slate-400"
                        value={filters.sby_responsable}
                        onChange={e => setFilters({ ...filters, sby_responsable: e.target.value })}
                    />

                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="date"
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
                            value={filters.start_date}
                            onChange={e => setFilters({ ...filters, start_date: e.target.value })}
                        />
                    </div>

                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="date"
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
                            value={filters.end_date}
                            onChange={e => setFilters({ ...filters, end_date: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-vscode-sidebar rounded-xl shadow-sm border border-slate-200 dark:border-vscode-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-vscode-activity border-b border-slate-200 dark:border-vscode-border">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 dark:text-vscode-text text-sm">Código</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-vscode-text text-sm">Servicio</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-vscode-text text-sm">Estado</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-vscode-text text-sm">Prioridad</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-vscode-text text-sm">Motivo</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-vscode-text text-sm">Responsable</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-vscode-text text-sm">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-vscode-border">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                                        <td className="p-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-48" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-12" /></td>
                                    </tr>
                                ))
                            ) : isError ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-red-500">
                                        Error al cargar los casos. Por favor intente nuevamente.
                                    </td>
                                </tr>
                            ) : Array.isArray(cases) && cases.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-vscode-hover transition-colors group">
                                    <td className="p-4 font-mono text-sm font-medium text-slate-700 dark:text-white">{c.codigo}</td>
                                    <td className="p-4 text-sm text-slate-700 dark:text-vscode-text">{c.servicio_o_plataforma}</td>
                                    <td className="p-4">
                                        <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium border", getStatusColor(c.estado))}>
                                            {c.estado}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={clsx("text-sm", getPriorityColor(c.prioridad))}>
                                            {c.prioridad}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-vscode-text max-w-xs truncate" title={c.novedades_y_comentarios}>
                                        {c.novedades_y_comentarios || '-'}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-vscode-text">{c.sby_responsable || '-'}</td>
                                    <td className="p-4">
                                        <Link
                                            to={`/cases/${c.id}`}
                                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-vscode-blue dark:hover:text-blue-400 font-medium text-sm transition-colors"
                                        >
                                            Ver <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && !isError && (!cases || cases.length === 0) && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <AlertCircle size={43} className="mb-2 opacity-50" />
                                            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No se encontraron casos</p>
                                            <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
