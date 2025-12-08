import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                    {
                        'bg-gray-400/10 text-gray-400 ring-gray-400/20': variant === 'default',
                        'bg-green-500/10 text-green-400 ring-green-500/20': variant === 'success',
                        'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20': variant === 'warning',
                        'bg-red-500/10 text-red-400 ring-red-500/20': variant === 'danger',
                        'bg-blue-500/10 text-blue-400 ring-blue-500/20': variant === 'info',
                    },
                    className
                )}
                {...props}
            />
        );
    }
);

Badge.displayName = 'Badge';

export { Badge };
