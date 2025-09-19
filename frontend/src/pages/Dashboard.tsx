import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, AlertCircle, ArrowRight, Activity, Upload, Download, RefreshCw, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { clsx } from 'clsx';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/Skeleton';
import { StatsOverview } from '../components/StatsOverview';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Switch } from '@headlessui/react';

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
    const [autoRefresh, setAutoRefresh] = useState(false);

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

            // Send timezone offset in minutes
            const offset = new Date().getTimezoneOffset();
            params.append('timezone_offset', offset.toString());

            const res = await api.get(`/cases/?${params.toString()}`);
            return res.data as Case[];
        },
        staleTime: 60000, // 1 minute
        refetchInterval: autoRefresh ? 30000 : false, // 30s auto-refresh
    });

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'CRITICO': return 'danger';
            case 'ALTO': return 'warning';
            case 'CERRADO': return 'success';
            case 'STANDBY': return 'warning';
            case 'EN_MONITOREO': return 'info';
            default: return 'default';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'CRITICO': return 'text-red-600 dark:text-red-500 font-bold';
            case 'ALTO': return 'text-orange-600 dark:text-orange-500 font-bold';
            case 'MEDIO': return 'text-yellow-600 dark:text-yellow-500 font-medium';
            case 'BAJO': return 'text-emerald-600 dark:text-emerald-500 font-medium';
            default: return 'text-slate-500 dark:text-slate-400';
        }
    };

    const handleExport = async (format: 'tsv' | 'xlsx' | 'csv' = 'tsv') => {
        try {
            const response = await api.get(`/cases-io/export?format=${format}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `cases_export.${format}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error('Error exporting cases:', error);
            // Ideally show a toast here
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/cases-io/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Refresh cases
            window.location.reload(); // Simple reload for now, or invalidate queries
        } catch (error) {
            console.error('Error importing cases:', error);
            alert('Error importing cases. Please check the file format.');
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Reporte de Casos - Standby Manager", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);

        const tableColumn = ["Código", "Servicio", "Estado", "Prioridad", "Responsable", "Actualizado"];
        const tableRows: any[] = [];

        cases.forEach((c) => {
            const caseData = [
                c.codigo,
                c.servicio_o_plataforma,
                c.estado,
                c.prioridad,
                c.sby_responsable || '-',
                new Date(c.ultima_actualizacion || new Date()).toLocaleDateString()
            ];
            tableRows.push(caseData);
        });

        // @ts-ignore
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] } // Indigo
        });

        doc.save("reporte_casos.pdf");
    };

    return (
        <div className="space-y-6">
            <StatsOverview />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tablero de Casos</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Monitoreo y gestión de incidentes en tiempo real.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <Activity size={14} className="text-indigo-500" />
                        <span>{cases.length} casos encontrados</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Auto Refresh Toggle */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-9 px-3 flex items-center gap-2 mr-2">
                            <RefreshCw size={14} className={clsx("text-slate-500", autoRefresh && "animate-spin text-indigo-500")} />
                            <Switch
                                checked={autoRefresh}
                                onChange={setAutoRefresh}
                                className={`${autoRefresh ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                    } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none`}
                            >
                                <span
                                    className={`${autoRefresh ? 'translate-x-5' : 'translate-x-1'
                                        } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                                />
                            </Switch>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Auto</span>
                        </div>

                        <input
                            type="file"
                            id="import-file"
                            className="hidden"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleImport}
                        />
                        <label
                            htmlFor="import-file"
                            className="flex items-center justify-center w-9 h-9 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                            title="Importar"
                        >
                            <Download size={16} />
                        </label>

                        <Button
                            variant="outline"
                            className="h-9 px-3 gap-2"
                            onClick={() => handleExport('xlsx')}
                            title="Exportar Excel"
                        >
                            <Upload size={16} />
                            <span className="hidden sm:inline">Excel</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-9 px-3 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:border-red-900/30"
                            onClick={handleExportPDF}
                            title="Exportar PDF"
                        >
                            <FileText size={16} />
                            <span className="hidden sm:inline">PDF</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium mb-2">
                    <Filter size={16} /> Filtros de Búsqueda
                </div>

                {/* Date Filters - Top Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="relative">
                        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1 ml-1">Fecha Inicio</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
                            <Input
                                type="date"
                                className="pl-10"
                                value={filters.start_date}
                                onChange={e => setFilters({ ...filters, start_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1 ml-1">Fecha Fin</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
                            <Input
                                type="date"
                                className="pl-10"
                                value={filters.end_date}
                                onChange={e => setFilters({ ...filters, end_date: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Other Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <div className="relative lg:col-span-2 xl:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
                        <Input
                            type="text"
                            placeholder="Buscar por código o motivo..."
                            className="pl-10"
                            value={filters.search}
                            onChange={e => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    <select
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-blue-500/50"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="" className="bg-white text-slate-900 dark:bg-gray-900 dark:text-white">Todos los Estados</option>
                        <option value="ABIERTO" className="bg-white text-slate-900 dark:bg-gray-900 dark:text-white">Abierto</option>
                        <option value="STANDBY" className="bg-white text-slate-900 dark:bg-gray-900 dark:text-white">Standby</option>
                        <option value="EN_MONITOREO" className="bg-white text-slate-900 dark:bg-gray-900 dark:text-white">En Monitoreo</option>
                        <option value="CERRADO" className="bg-white text-slate-900 dark:bg-gray-900 dark:text-white">Cerrado</option>
                    </select>

                    <select
                        className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                        value={filters.priority}
                        onChange={e => setFilters({ ...filters, priority: e.target.value })}
                    >
                        <option value="" className="bg-gray-900">Todas las Prioridades</option>
                        <option value="CRITICO" className="bg-gray-900">Crítico</option>
                        <option value="ALTO" className="bg-gray-900">Alto</option>
                        <option value="MEDIO" className="bg-gray-900">Medio</option>
                        <option value="BAJO" className="bg-gray-900">Bajo</option>
                    </select>

                    <Input
                        type="text"
                        placeholder="Servicio..."
                        value={filters.service}
                        onChange={e => setFilters({ ...filters, service: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        type="text"
                        placeholder="Responsable..."
                        value={filters.sby_responsable}
                        onChange={e => setFilters({ ...filters, sby_responsable: e.target.value })}
                    />
                </div>
            </Card>

            {/* Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 dark:text-gray-300 text-sm">Código</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-gray-300 text-sm">Servicio</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-gray-300 text-sm">Estado</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-gray-300 text-sm">Prioridad</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-gray-300 text-sm">Motivo</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-gray-300 text-sm">Responsable</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-gray-300 text-sm">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
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
                                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="p-4 font-mono text-sm font-medium text-slate-900 dark:text-white">{c.codigo}</td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-gray-300">{c.servicio_o_plataforma}</td>
                                    <td className="p-4">
                                        <Badge variant={getStatusVariant(c.estado) as any}>
                                            {c.estado}
                                        </Badge>
                                    </td>
                                    <td className="p-4">
                                        <span className={clsx("text-sm", getPriorityColor(c.prioridad))}>
                                            {c.prioridad}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-gray-400 max-w-xs truncate" title={c.novedades_y_comentarios}>
                                        {c.novedades_y_comentarios || '-'}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-gray-400">{c.sby_responsable || '-'}</td>
                                    <td className="p-4">
                                        <Link
                                            to={`/cases/${c.id}`}
                                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
                                        >
                                            Ver <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && !isError && (!cases || cases.length === 0) && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <AlertCircle size={43} className="mb-2 opacity-50" />
                                            <p className="text-lg font-medium text-gray-400">No se encontraron casos</p>
                                            <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
