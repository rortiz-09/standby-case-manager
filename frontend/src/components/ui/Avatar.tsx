import { getInitials, getTailwindColor } from '../../utils/avatarUtils';
import { clsx } from 'clsx';

interface AvatarProps {
    name: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-[10px]',
        md: 'w-10 h-10 text-xs',
        lg: 'w-12 h-12 text-sm',
    };

    const colorClass = getTailwindColor(name || '');

    return (
        <div className={clsx(
            "rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0",
            sizeClasses[size],
            colorClass,
            className
        )}>
            {getInitials(name)}
        </div>
    );
}
