import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { clsx } from 'clsx';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Continuar',
    cancelText = 'Cancelar',
    variant = 'warning'
}: ConfirmationModalProps) {

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 dark:bg-black/60 backdrop-blur-sm" />
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-vscode-sidebar p-6 text-left align-middle shadow-xl transition-all border border-slate-200 dark:border-vscode-border">
                                <div className="flex items-start gap-4">
                                    <div className={clsx(
                                        "p-3 rounded-full flex-shrink-0",
                                        variant === 'danger' && "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-500",
                                        variant === 'warning' && "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-500",
                                        variant === 'info' && "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-500",
                                    )}>
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-medium leading-6 text-slate-900 dark:text-white"
                                        >
                                            {title}
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {message}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                    >
                                        {cancelText}
                                    </Button>
                                    <Button
                                        variant={variant === 'danger' ? 'danger' : 'primary'}
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className={clsx(
                                            variant === 'warning' && "bg-orange-600 hover:bg-orange-700 text-white border-transparent focus:ring-orange-500",
                                        )}
                                    >
                                        {confirmText}
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
