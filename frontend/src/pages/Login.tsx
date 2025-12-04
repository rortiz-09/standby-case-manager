import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const res = await api.post('/auth/login', formData);
            localStorage.setItem('token', res.data.access_token);

            // Fetch user details to get role
            const userRes = await api.get('/auth/me');
            localStorage.setItem('user', JSON.stringify(userRes.data));

            navigate('/');
        } catch (err: any) {
            if (err.response && err.response.status === 401) {
                setError('Usuario o contraseña incorrectos.');
            } else if (err.code === 'ERR_NETWORK') {
                setError('No se pudo conectar con el servidor. Verifique que el backend esté funcionando.');
            } else {
                setError('Ocurrió un error inesperado. Intente nuevamente.');
            }
        }
    };

    return (
        <div className="relative flex items-center justify-center h-screen bg-slate-100 dark:bg-vscode-bg transition-colors duration-300">
            <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-vscode-activity text-slate-600 dark:text-white shadow-md hover:bg-slate-50 dark:hover:bg-vscode-hover transition-colors"
                title="Cambiar tema"
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="bg-white dark:bg-vscode-sidebar p-8 rounded-lg shadow-xl w-96 border border-slate-200 dark:border-vscode-border">
                <h1 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">Iniciar Sesión</h1>
                {error && <div className="bg-red-100 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200 p-3 mb-4 rounded text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-vscode-text mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-md border border-slate-300 dark:border-vscode-border bg-white dark:bg-vscode-activity text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 outline-none transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-vscode-text mb-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-md border border-slate-300 dark:border-vscode-border bg-white dark:bg-vscode-activity text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 outline-none transition-colors"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white p-2.5 rounded-md hover:bg-indigo-700 font-medium transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
}
