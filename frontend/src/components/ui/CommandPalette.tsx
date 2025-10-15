import { Fragment, useState, useEffect } from 'react';
import { Dialog, Combobox, Transition } from '@headlessui/react';
import { Search, Globe, Plus, Moon, Monitor, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    // Toggle function
    useEffect(() => {
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
        };
        window.addEventListener('keydown', onKeydown);
        return () => window.removeEventListener('keydown', onKeydown);
    }, []);

    // Theme logic
    const toggleTheme = () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        setIsOpen(false);
    };

    // Static Commands
    const commands = [
        { id: 'new-case', name: 'Nuevo Caso', icon: Plus, action: () => { navigate('/cases/new'); setIsOpen(false); }, section: 'Acciones' },
        { id: 'dashboard', name: 'Ir al Dashboard', icon: Globe, action: () => { navigate('/'); setIsOpen(false); }, section: 'Navegación' },
        { id: 'developers', name: 'Desarrolladores', icon: Monitor, action: () => { navigate('/developers'); setIsOpen(false); }, section: 'Navegación' },
        { id: 'theme-toggle', name: 'Alternar Tema Claro/Oscuro', icon: Moon, action: toggleTheme, section: 'Preferencias' },
    ];

    // Filtered items
    const filteredCommands = query === ''
        ? commands
        : commands.filter((command) =>
            command.name.toLowerCase().includes(query.toLowerCase())
        );

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/25 dark:bg-black/80 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="mx-auto max-w-xl transform divide-y divide-gray-100 dark:divide-white/10 overflow-hidden rounded-xl bg-white dark:bg-vscode-sidebar shadow-2xl ring-1 ring-black/5 transition-all">
                            <Combobox onChange={(command: any) => command.action()}>
                                <div className="relative">
                                    <Search
                                        className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                                        aria-hidden="true"
                                    />
                                    <Combobox.Input
                                        className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-0 sm:text-sm outline-none"
                                        placeholder="Escribe un comando o busca..."
                                        onChange={(event) => setQuery(event.target.value)}
                                    />
                                </div>

                                {(filteredCommands.length > 0) && (
                                    <Combobox.Options static className="max-h-96 scroll-py-3 overflow-y-auto p-3">
                                        {filteredCommands.map((command) => (
                                            <Combobox.Option
                                                key={command.id}
                                                value={command}
                                                className={({ active }) =>
                                                    clsx(
                                                        'flex cursor-default select-none rounded-xl p-3 transition-colors',
                                                        active ? 'bg-indigo-600/10 dark:bg-indigo-500/20' : ''
                                                    )
                                                }
                                            >
                                                {({ active }) => (
                                                    <>
                                                        <div className={clsx(
                                                            "flex h-10 w-10 flex-none items-center justify-center rounded-lg",
                                                            active ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-100 dark:bg-gray-800'
                                                        )}>
                                                            <command.icon
                                                                className={clsx("h-6 w-6", active ? 'text-white' : 'text-gray-500 dark:text-gray-400')}
                                                                aria-hidden="true"
                                                            />
                                                        </div>
                                                        <div className="ml-4 flex-auto">
                                                            <p className={clsx("text-sm font-medium", active ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200')}>
                                                                {command.name}
                                                            </p>
                                                            <p className={clsx("text-xs", active ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500')}>
                                                                {command.section}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </Combobox.Option>
                                        ))}
                                    </Combobox.Options>
                                )}

                                {query !== '' && filteredCommands.length === 0 && (
                                    <div className="py-14 px-6 text-center text-sm sm:px-14">
                                        <AlertCircle className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
                                        <p className="mt-4 font-semibold text-gray-900 dark:text-white">No se encontraron comandos</p>
                                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                                            Intenta buscar "Nuevo Caso" o "Tema".
                                        </p>
                                    </div>
                                )}
                            </Combobox>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
