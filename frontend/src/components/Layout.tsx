import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, PlusCircle, Users } from 'lucide-react';

export default function Layout() {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const role = user?.rol;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 text-white flex flex-col">
                <div className="p-4 text-xl font-bold border-b border-slate-700">
                    Standby Manager
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/" className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded">
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>

                    {['INGRESO', 'ADMIN'].includes(role) && (
                        <Link to="/cases/new" className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded">
                            <PlusCircle size={20} /> Nuevo Caso
                        </Link>
                    )}

                    {role === 'ADMIN' && (
                        <Link to="/users" className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded">
                            <Users size={20} /> Usuarios
                        </Link>
                    )}
                </nav>
                <div className="p-4 border-t border-slate-700">
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300">
                        <LogOut size={20} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <Outlet />
            </main>
        </div>
    );
}
