import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';

interface User {
    id: number;
    nombre: string;
    email: string;
    rol: string;
}

interface UserFormData {
    nombre: string;
    email: string;
    password: string;
    rol: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const { register, handleSubmit, reset } = useForm<UserFormData>();
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/');
            setUsers(res.data);
        } catch (error) {
            console.error("Error fetching users", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onSubmit = async (data: UserFormData) => {
        setLoading(true);
        try {
            await api.post('/users/', data);
            reset();
            fetchUsers();
            alert("Usuario creado exitosamente");
        } catch (error: any) {
            console.error("Error creating user", error);
            if (error.response && error.response.data && error.response.data.detail) {
                alert(`Error: ${JSON.stringify(error.response.data.detail)}`);
            } else {
                alert("Error al crear usuario. Verifique la conexión.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Está seguro de eliminar este usuario?")) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user", error);
            alert("Error al eliminar usuario");
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Gestión de Usuarios</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* User List */}
                <div className="md:col-span-2 bg-white rounded shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4">Nombre</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4">{user.nombre}</td>
                                    <td className="p-4">{user.email}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                                            {user.rol}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Create User Form */}
                <div className="bg-white p-6 rounded shadow h-fit">
                    <h2 className="text-xl font-bold mb-4">Nuevo Usuario</h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input
                                {...register('nombre', { required: true })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                {...register('email', { required: true })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                            <input
                                type="password"
                                {...register('password', { required: true })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Rol</label>
                            <select
                                {...register('rol', { required: true })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            >
                                <option value="CONSULTA">CONSULTA</option>
                                <option value="VISUALIZACION">VISUALIZACION</option>
                                <option value="INGRESO">INGRESO</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Creando...' : 'Crear Usuario'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
