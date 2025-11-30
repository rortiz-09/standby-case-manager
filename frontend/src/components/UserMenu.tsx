import { Fragment, useState } from 'react';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { LogOut, Key, X, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';

interface UserMenuProps {
    isCollapsed: boolean;
    appVersion: string;
}

export default function UserMenu({ isCollapsed, appVersion }: UserMenuProps) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { theme, toggleTheme } = useTheme();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const onChangePassword = async (data: any) => {
        try {
            await api.post('/auth/change-password', {
                current_password: data.current_password,
                new_password: data.new_password
            });
            showToast('success', 'Contraseña actualizada', 'Tu contraseña ha sido cambiada exitosamente.');
            setIsPasswordModalOpen(false);
            reset();
        } catch (error: any) {
            console.error(error);
            showToast('error', 'Error', error.response?.data?.detail || 'No se pudo cambiar la contraseña');
        }
    };

    if (!user) return null;

    return (
        <>
            <Menu as="div" className={clsx("relative inline-block text-left", !isCollapsed && "w-full")}>
                <Menu.Button className={clsx(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors w-full outline-none",
                    "hover:bg-slate-200 dark:hover:bg-vscode-hover",
                    isCollapsed ? "justify-center" : "justify-start"
                )}>
                    <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-bold shrink-0">
                        {user?.nombre?.charAt(0).toUpperCase() || '?'}
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col min-w-0 text-left overflow-hidden">
                            <p className="text-sm font-medium truncate dark:text-white">{user.nombre}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.rol}</p>
                            <div className="mt-1 pt-1 border-t border-slate-200 dark:border-vscode-border w-full">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                    {appVersion}
                                </p>
                            </div>
                        </div>
                    )}
                </Menu.Button>

                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className={clsx(
                        "absolute w-56 rounded-md bg-white dark:bg-vscode-sidebar shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-slate-200 dark:border-vscode-border p-1",
                        isCollapsed ? "left-full bottom-0 ml-2 origin-bottom-left" : "left-0 bottom-full mb-2 origin-bottom-left"
                    )}>
                        <div className="px-1 py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={toggleTheme}
                                        className={clsx(
                                            active ? 'bg-indigo-50 dark:bg-vscode-activity text-indigo-600 dark:text-white' : 'text-slate-700 dark:text-vscode-text',
                                            'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2'
                                        )}
                                    >
                                        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                                        Tema {theme === 'dark' ? 'Claro' : 'Oscuro'}
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                        <div className="px-1 py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => setIsPasswordModalOpen(true)}
                                        className={clsx(
                                            active ? 'bg-indigo-50 dark:bg-vscode-activity text-indigo-600 dark:text-white' : 'text-slate-700 dark:text-vscode-text',
                                            'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2'
                                        )}
                                    >
                                        <Key size={14} />
                                        Cambiar Contraseña
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                        <div className="px-1 py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={handleLogout}
                                        className={clsx(
                                            active ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-vscode-text',
                                            'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2'
                                        )}
                                    >
                                        <LogOut size={14} />
                                        Cerrar Sesión
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>

            <Transition appear show={isPasswordModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsPasswordModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-slate-800">
                                    <div className="flex justify-between items-center mb-4">
                                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                            Cambiar Contraseña
                                        </Dialog.Title>
                                        <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña Actual</label>
                                            <input
                                                type="password"
                                                {...register('current_password', { required: true })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva Contraseña</label>
                                            <input
                                                type="password"
                                                {...register('new_password', { required: true, minLength: 6 })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            />
                                            {errors.new_password && <span className="text-xs text-red-500">Mínimo 6 caracteres</span>}
                                        </div>

                                        <div className="mt-4 flex justify-end gap-2">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                                onClick={() => setIsPasswordModalOpen(false)}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}
