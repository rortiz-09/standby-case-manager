import { Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { format, subMonths, subYears, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface DateRangeFilterProps {
    startDate: string;
    endDate: string;
    onRangeChange: (start: string, end: string) => void;
}

export function DateRangeFilter({ startDate, endDate, onRangeChange }: DateRangeFilterProps) {
    // Presets
    const presets = [
        { label: 'Último Mes', getValue: () => ({ start: subMonths(new Date(), 1), end: new Date() }) },
        { label: 'Últimos 3 Meses', getValue: () => ({ start: subMonths(new Date(), 3), end: new Date() }) },
        { label: 'Últimos 6 Meses', getValue: () => ({ start: subMonths(new Date(), 6), end: new Date() }) },
        { label: 'Último Año', getValue: () => ({ start: subYears(new Date(), 1), end: new Date() }) },
    ];

    const handlePresetClick = (getPreset: () => { start: Date; end: Date }, close: () => void) => {
        const { start, end } = getPreset();
        onRangeChange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
        close();
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const date = parseISO(dateStr);
        return isValid(date) ? format(date, 'dd MMM, yyyy', { locale: es }) : dateStr;
    };

    const hasActiveRange = !!startDate || !!endDate;

    return (
        <Popover className="relative">
            {({ open, close }) => (
                <>
                    <Popover.Button
                        className={clsx(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all outline-none",
                            hasActiveRange
                                ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10",
                            open && "ring-2 ring-indigo-500/50"
                        )}
                    >
                        <CalendarIcon size={16} className={hasActiveRange ? "text-indigo-500" : "text-slate-400"} />
                        <span className="font-medium">
                            {hasActiveRange
                                ? `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate) || 'Hoy'}`
                                : 'Filtrar por Fecha'}
                        </span>
                        <ChevronDown size={14} className={clsx("opacity-50 transition-transform", open && "rotate-180")} />
                    </Popover.Button>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <Popover.Panel className="absolute left-0 top-full mt-2 w-80 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 ring-1 ring-black/5">
                            <div className="space-y-4">
                                {/* Presets Grid */}
                                <div className="grid grid-cols-2 gap-2">
                                    {presets.map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => handlePresetClick(preset.getValue, close)}
                                            className="text-xs px-3 py-2 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 dark:bg-slate-700/50 dark:hover:bg-indigo-900/30 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors text-left font-medium"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-700" />

                                {/* Custom Range Inputs */}
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Desde</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => onRangeChange(e.target.value, endDate)}
                                                className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Hasta</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => onRangeChange(startDate, e.target.value)}
                                                className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
                                        <span>Rango personalizado</span>
                                        <button
                                            onClick={() => {
                                                onRangeChange('', '');
                                                close();
                                            }}
                                            className="text-red-500 hover:text-red-600 hover:underline"
                                        >
                                            Limpiar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Popover.Panel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}
