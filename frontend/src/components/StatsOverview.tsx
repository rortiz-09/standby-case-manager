import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Card } from './ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface StatsData {
    total_cases: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    cases_last_24h: number;
}

interface StatsOverviewProps {
    autoRefresh?: boolean;
}

export function StatsOverview({ autoRefresh = false }: StatsOverviewProps) {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['stats'],
        queryFn: async () => {
            const res = await api.get('/stats');
            return res.data as StatsData;
        },
        staleTime: 30000,
        refetchInterval: autoRefresh ? 30000 : false,
    });

    if (isLoading || !stats) {
        return <div className="animate-pulse h-64 bg-slate-100 dark:bg-white/5 rounded-xl mb-6"></div>;
    }

    // Transform for Recharts
    const statusData = Object.entries(stats.by_status).map(([name, value]) => ({ name, value }));
    const priorityData = Object.entries(stats.by_priority).map(([name, value]) => ({ name, value }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    const PRIORITY_COLORS: Record<string, string> = {
        'CRITICO': '#ef4444', // red-500
        'ALTO': '#f97316', // orange-500
        'MEDIO': '#eab308', // yellow-500
        'BAJO': '#10b981', // emerald-500
    };

    return (
        <div className="space-y-6 mb-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-indigo-500">
                    <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-500">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Casos</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total_cases}</h3>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
                    <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Últimas 24h</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.cases_last_24h}</h3>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-red-500">
                    <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Críticos Activos</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.by_priority['CRITICO'] || 0}</h3>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-emerald-500">
                    <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Cerrados</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.by_status['CERRADO'] || 0}</h3>
                    </div>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Distribución por Estado</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Volumen por Prioridad</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priorityData}>
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#cbd5e1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
