import { useEffect, useState } from 'react';
import { Github, Linkedin, Twitter, Globe, User } from 'lucide-react';
import { DEVELOPERS } from '../constants/developersData';
import { SocialLink } from '../types/developer';

const SocialIcon = ({ platform }: { platform: SocialLink['platform'] }) => {
    switch (platform) {
        case 'github': return <Github size={20} />;
        case 'linkedin': return <Linkedin size={20} />;
        case 'twitter': return <Twitter size={20} />;
        case 'website': return <Globe size={20} />;
        default: return <Globe size={20} />;
    }
};

export default function Developers() {
    useEffect(() => {
        document.title = 'SCM | Desarrolladores';
    }, []);

    const [imageError, setImageError] = useState<Record<string, boolean>>({});

    const handleImageError = (id: string) => {
        setImageError(prev => ({ ...prev, [id]: true }));
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Equipo de Desarrollo
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Conoce a las personas detrás de Standby Case Manager.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {DEVELOPERS.map((dev) => (
                    <div
                        key={dev.id}
                        className="bg-white dark:bg-vscode-sidebar rounded-xl p-6 shadow-sm border border-slate-200 dark:border-vscode-border hover:shadow-md transition-shadow duration-300 flex flex-col items-center text-center space-y-4"
                    >
                        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-indigo-100 dark:bg-vscode-activity flex items-center justify-center border-4 border-indigo-50 dark:border-vscode-bg">
                            {!imageError[dev.id] ? (
                                <img
                                    src={dev.avatarUrl}
                                    alt={dev.name}
                                    className="w-full h-full object-cover"
                                    onError={() => handleImageError(dev.id)}
                                />
                            ) : (
                                <span className="text-2xl font-bold text-indigo-600 dark:text-white">
                                    {getInitials(dev.name)}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2 w-full">
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                                {dev.name}
                            </h3>
                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                {dev.role}
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3">
                                {dev.bio}
                            </p>
                        </div>

                        <div className="pt-4 flex items-center justify-center gap-4 w-full border-t border-slate-100 dark:border-vscode-border mt-auto">
                            {dev.socialLinks.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-vscode-bg"
                                    aria-label={`Visitar ${link.platform} de ${dev.name}`}
                                >
                                    <SocialIcon platform={link.platform} />
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
