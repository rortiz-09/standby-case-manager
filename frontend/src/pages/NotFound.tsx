import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-[80vh] text-center">
            <AlertTriangle size={64} className="text-amber-500 mb-4" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">404</h1>
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">Página no encontrada</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
                Lo sentimos, la página que estás buscando no existe o ha sido movida.
            </p>
            <Link
                to="/"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors font-medium shadow-lg shadow-indigo-500/20"
            >
                <Home size={20} />
                Volver al Inicio
            </Link>
        </div>
    );
}
