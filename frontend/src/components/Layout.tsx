import { useState, useEffect, useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Users, Menu, ChevronLeft, ChevronRight, Code } from 'lucide-react';
import { clsx } from 'clsx';
import UserMenu from './UserMenu';
import { CommandPalette } from './ui/CommandPalette';


export default function Layout() {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // Theme is now managed by ThemeContext

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setIsCollapsed(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const filteredNavItems = useMemo(() => {
        const navItems = [
            { path: '/', label: 'Tablero', icon: LayoutDashboard, roles: ['CONSULTA', 'INGRESO', 'ADMIN'] },
            { path: '/cases/new', label: 'Nuevo Caso', icon: PlusCircle, roles: ['INGRESO', 'ADMIN'] },
            { path: '/users', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
            { path: '/developers', label: 'Desarrolladores', icon: Code, roles: ['CONSULTA', 'INGRESO', 'ADMIN'] },
        ];
        return navItems.filter(item => user && item.roles.includes(user.rol));
    }, [user]);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white transition-colors duration-300 font-sans">
            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed md:relative z-20 h-full bg-vscode-light-sidebar dark:bg-vscode-sidebar border-r border-vscode-light-border dark:border-vscode-border transition-all duration-300 ease-in-out flex flex-col",
                    isCollapsed ? "w-16" : "w-64",
                    isMobile && !isMobileMenuOpen && "-translate-x-full md:translate-x-0"
                )}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-vscode-light-border dark:border-vscode-border">
                    {!isCollapsed && (
                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 truncate">
                            SCM
                        </span>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-md hover:bg-vscode-light-hover dark:hover:bg-vscode-hover text-slate-500 dark:text-vscode-text transition-colors hidden md:block"
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                    {isMobile && (
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-1.5 md:hidden"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}
                </div>

                <nav className="flex-1 py-4 space-y-1 px-2">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                    isActive
                                        ? "bg-indigo-50 dark:bg-vscode-activity text-indigo-600 dark:text-white border-l-4 border-indigo-600 dark:border-vscode-blue"
                                        : "text-slate-600 dark:text-vscode-text hover:bg-vscode-light-hover dark:hover:bg-vscode-hover hover:text-indigo-600 dark:hover:text-white",
                                    isCollapsed ? "justify-center" : ""
                                )}
                                title={isCollapsed ? item.label : undefined}
                                onClick={() => isMobile && setIsMobileMenuOpen(false)}
                            >
                                <Icon size={20} className={clsx(isActive ? "text-indigo-600 dark:text-vscode-blue" : "group-hover:text-indigo-600 dark:group-hover:text-white")} />
                                {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-vscode-light-border dark:border-vscode-border flex flex-col gap-4">
                    <div className={clsx("flex items-center gap-2", isCollapsed ? "justify-center" : "")}>
                        <UserMenu isCollapsed={isCollapsed} appVersion="v2.2.3" />
                    </div>
                </div>
            </aside >

            {/* Mobile Overlay */}
            {
                isMobile && isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-10 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )
            }

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                {isMobile && (
                    <header className="h-16 bg-vscode-light-bg dark:bg-vscode-bg border-b border-vscode-light-border dark:border-vscode-border flex items-center justify-between px-4 shadow-sm z-10">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 -ml-2 text-slate-600 dark:text-vscode-text hover:bg-vscode-light-hover dark:hover:bg-vscode-hover rounded-lg"
                            >
                                <Menu size={22} />
                            </button>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white truncate">
                                SCM
                            </h2>
                        </div>
                    </header>
                )}

                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 scroll-smooth bg-vscode-light-bg dark:bg-vscode-bg">
                    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                    <footer className="mt-auto py-4 mx-6 opacity-60 hover:opacity-100 transition-opacity">
                        <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 font-medium tracking-wide">
                            2025 © TODOS LOS DERECHOS RESERVADOS
                        </p>
                    </footer>
                </div>
            </main>
            <CommandPalette />
        </div >
    );
}
