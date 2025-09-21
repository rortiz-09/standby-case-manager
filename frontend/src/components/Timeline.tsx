import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle, User, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx } from 'clsx';

interface TimelineItem {
    type: 'OBSERVATION' | 'AUDIT';
    id: number;
    content?: string; // For observation
    action?: string; // For audit
    details?: Record<string, any>; // For audit
    created_at: string;
    user_name?: string;
    user_id?: number;
}

interface TimelineProps {
    items: TimelineItem[];
    currentUserId?: number;
}

export function Timeline({ items, currentUserId }: TimelineProps) {
    if (items.length === 0) {
        return <div className="text-center text-slate-400 py-8 italic">No hay historial disponible.</div>;
    }

    return (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent dark:before:via-slate-700">
            {items.map((item, index) => (
                <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={clsx(
                        "relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group",
                        item.type === 'OBSERVATION' ? "is-active" : ""
                    )}
                >
                    {/* Icon / Dot */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-gray-900 bg-slate-50 dark:bg-slate-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {item.type === 'OBSERVATION' ? (
                            <MessageSquare size={16} className="text-indigo-500" />
                        ) : item.action === 'UPDATE' ? (
                            <ArrowRight size={16} className="text-blue-500" />
                        ) : item.action === 'BULK_UPDATE' ? (
                            <AlertTriangle size={16} className="text-orange-500" />
                        ) : (
                            <User size={16} className="text-emerald-500" />
                        )}
                    </div>

                    {/* Content Card */}
                    <div className={clsx(
                        "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border shadow-sm",
                        item.type === 'OBSERVATION'
                            ? (item.user_id === currentUserId
                                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700")
                            : "bg-transparent border-transparent shadow-none"
                    )}>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-1">
                            <span className={clsx(
                                "text-xs font-bold",
                                item.type === 'OBSERVATION' ? "text-slate-700 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"
                            )}>
                                {item.user_name || (item.user_id === currentUserId ? 'Yo' : 'Usuario')}
                            </span>
                            <time className="text-[10px] text-slate-400 font-mono">
                                {new Date(item.created_at).toLocaleString()}
                            </time>
                        </div>

                        {/* Body */}
                        {item.type === 'OBSERVATION' ? (
                            <div className="text-sm text-slate-600 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{item.content || ''}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700">
                                <strong className="block text-slate-600 dark:text-slate-300 mb-1">{item.action}</strong>
                                {item.details && Object.entries(item.details).map(([key, diff]: [string, any]) => (
                                    <div key={key} className="flex items-center gap-1 font-mono">
                                        <span className="font-semibold">{key}:</span>
                                        <span className="text-red-500 line-through">{diff.old}</span>
                                        <ArrowRight size={10} className="text-slate-400" />
                                        <span className="text-green-500">{diff.new}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
