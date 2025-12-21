import { useEffect, useState } from 'react';
import { Github, Linkedin, Twitter, Globe } from 'lucide-react';
import { DEVELOPERS } from '../constants/developersData';
import { SocialLink } from '../types/developer';

const SocialIcon = ({ platform }: { platform: SocialLink['platform'] }) => {
    switch (platform) {
        case 'github': return <Github size={18} />;
        case 'linkedin': return <Linkedin size={18} />;
        case 'twitter': return <Twitter size={18} />;
        case 'website': return <Globe size={18} />;
        default: return <Globe size={18} />;
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
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="inline-block p-2 px-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-semibold tracking-wide uppercase mb-2">
                    Nuestro Equipo
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 pb-2">
                    Mentes Creativas
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    Conoce a los desarrolladores apasionados que hacen posible Standby Case Manager, construyendo soluciones escalables y elegantes.
                </p>
            </div>

            {/* Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                {DEVELOPERS.map((dev) => (
                    <div
                        key={dev.id}
                        className="group relative bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 border border-slate-100 dark:border-slate-700/50 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                    >
                        {/* Decorative Gradient Background */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

                        <div className="flex flex-col items-center text-center space-y-6">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full opacity-70 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                                <div className="relative w-28 h-28 rounded-full overflow-hidden bg-slate-50 dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow-inner">
                                    {!imageError[dev.id] ? (
                                        <img
                                            src={dev.avatarUrl}
                                            alt={dev.name}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                            onError={() => handleImageError(dev.id)}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                                            <span className="text-3xl font-bold text-slate-400 dark:text-slate-500">
                                                {getInitials(dev.name)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-2 w-full">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {dev.name}
                                </h3>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-xs font-semibold tracking-wide">
                                    {dev.role}
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 pt-2">
                                    {dev.bio}
                                </p>
                            </div>

                            {/* Social Links */}
                            <div className="pt-6 flex justify-center gap-3 w-full border-t border-slate-100 dark:border-slate-700/50 mt-auto">
                                {dev.socialLinks.map((link, index) => (
                                    <a
                                        key={index}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-gradient-to-r from-indigo-500 to-violet-500 transform hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm bg-slate-50 dark:bg-slate-800/80"
                                        aria-label={`Visitar ${link.platform} de ${dev.name}`}
                                    >
                                        <SocialIcon platform={link.platform} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
