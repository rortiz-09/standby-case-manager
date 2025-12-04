import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Dialog, Transition, Switch } from '@headlessui/react';
import { Edit2, Trash2, Plus, X, Search } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { clsx } from 'clsx';

interface User {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    is_active: boolean;
}

interface UserFormData {
    nombre: string;
    email: string;
    password?: string;
    rol: string;
    is_active: boolean;
}

export default function UserManagement() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const { register, handleSubmit, reset, setValue } = useForm<UserFormData>();

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/users/');
            return res.data as User[];
        },
    });

    const createUserMutation = useMutation({
        mutationFn: (data: UserFormData) => api.post('/users/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showToast('success', 'Usuario creado', 'El nuevo usuario ha sido registrado.');
            closeModal();
        },
        onError: (error: any) => {
            showToast('error', 'Error', error.response?.data?.detail || 'Error al crear usuario');
        }
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UserFormData }) => api.patch(`/users/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showToast('success', 'Usuario actualizado', 'Los datos del usuario han sido guardados.');
            closeModal();
        },
        onError: (error: any) => {
            showToast('error', 'Error', error.response?.data?.detail || 'Error al actualizar usuario');
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showToast('success', 'Usuario eliminado', 'El usuario ha sido eliminado correctamente.');
        },
        onError: () => {
            showToast('error', 'Error', 'No se pudo eliminar el usuario');
        }
    });

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setValue('nombre', user.nombre);
            setValue('email', user.email);
            setValue('rol', user.rol);
            setValue('is_active', user.is_active);
        } else {
            setEditingUser(null);
            reset({ is_active: true, rol: 'CONSULTA' });
        }
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setEditingUser(null);
        reset();
    };

    const onSubmit = (data: UserFormData) => {
        if (editingUser) {
            updateUserMutation.mutate({ id: editingUser.id, data });
        } else {
            createUserMutation.mutate(data);
        }
    };

    const loading = createUserMutation.isPending || updateUserMutation.isPending || deleteUserMutation.isPending;

    const handleDelete = (id: number) => {
        if (confirm("¿Está seguro de eliminar este usuario?")) {
            deleteUserMutation.mutate(id);
        }
    };

    const filteredUsers = users.filter(user =>
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestión de Usuarios</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Administra el acceso y roles del equipo.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/30 transition-all"
                >
                    <Plus size={18} /> Nuevo Usuario
                </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white dark:bg-vscode-sidebar p-4 rounded-xl shadow-sm border border-slate-200 dark:border-vscode-border">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar usuarios..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white placeholder-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-vscode-sidebar rounded-xl shadow-sm border border-slate-200 dark:border-vscode-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-vscode-activity border-b border-slate-200 dark:border-vscode-border">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 dark:text-vscode-text">Usuario</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-vscode-text">Rol</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-vscode-text">Estado</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-vscode-text text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-vscode-border">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-vscode-hover transition-colors">
                                    <td className="p-4">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{user.nombre}</p>
                                            <p className="text-sm text-slate-500 dark:text-vscode-text">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={clsx(
                                            "px-2.5 py-1 rounded-full text-xs font-medium border",
                                            user.rol === 'ADMIN' && "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
                                            user.rol === 'INGRESO' && "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
                                            user.rol === 'CONSULTA' && "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600"
                                        )}>
                                            {user.rol}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={clsx(
                                            "flex items-center gap-1.5 text-sm",
                                            user.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"
                                        )}>
                                            <span className={clsx("w-2 h-2 rounded-full", user.is_active ? "bg-emerald-500" : "bg-slate-400")} />
                                            {user.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openModal(user)}
                                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-vscode-activity dark:text-vscode-text dark:hover:text-white rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-vscode-text dark:hover:text-red-400 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl transition-all border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-6">
                                        <Dialog.Title as="h3" className="text-xl font-bold text-slate-900 dark:text-white">
                                            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                                        </Dialog.Title>
                                        <button onClick={closeModal} className="text-slate-400 hover:text-slate-500">
                                            <X size={22} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                                            <input
                                                {...register('nombre', { required: true })}
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                            <input
                                                type="email"
                                                {...register('email', { required: true })}
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                            />
                                        </div>

                                        {!editingUser && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
                                                <input
                                                    type="password"
                                                    {...register('password', { required: !editingUser })}
                                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol</label>
                                            <select
                                                {...register('rol', { required: true })}
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                            >
                                                <option value="CONSULTA">CONSULTA</option>
                                                <option value="INGRESO">INGRESO</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </select>
                                        </div>

                                        {editingUser && (
                                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Usuario Activo</span>
                                                <Switch
                                                    checked={editingUser.is_active} // This needs to be controlled by form state actually, but for now let's use the register
                                                    onChange={(checked) => setValue('is_active', checked)}
                                                    className={clsx(
                                                        editingUser.is_active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600',
                                                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                                                    )}
                                                >
                                                    <span
                                                        className={clsx(
                                                            editingUser.is_active ? 'translate-x-6' : 'translate-x-1',
                                                            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                                                        )}
                                                    />
                                                </Switch>
                                            </div>
                                        )}

                                        <div className="pt-4 flex gap-3">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-lg shadow-indigo-500/20"
                                            >
                                                {loading ? 'Guardando...' : 'Guardar Usuario'}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
