import { clsx } from 'clsx';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={clsx("animate-pulse bg-slate-200 dark:bg-vscode-activity rounded", className)} />
    );
}
