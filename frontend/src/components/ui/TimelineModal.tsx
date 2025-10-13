import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Clock } from 'lucide-react';
import { Timeline } from '../Timeline';


interface TimelineModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: any[];
    currentUserId?: number;
}

export function TimelineModal({
    isOpen,
    onClose,
    items,
    currentUserId
}: TimelineModalProps) {

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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-vscode-sidebar text-left align-middle shadow-xl transition-all border border-slate-200 dark:border-vscode-border flex flex-col max-h-[85vh]">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-vscode-border bg-slate-50 dark:bg-vscode-activity">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2"
                                    >
                                        <Clock size={20} className="text-indigo-500" />
                                        Historial Completo
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-200 dark:hover:bg-vscode-hover rounded-full"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-vscode-sidebar">
                                    <div className="max-w-xl mx-auto">
                                        <Timeline items={items} currentUserId={currentUserId} />
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
