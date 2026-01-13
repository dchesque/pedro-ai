'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface GuidedSelectCardProps<T extends string> {
    value: T;
    label: string;
    description: string;
    icon?: string;
    selected: boolean;
    onSelect: (value: T) => void;
    disabled?: boolean;
}

export function GuidedSelectCard<T extends string>({
    value,
    label,
    description,
    icon,
    selected,
    onSelect,
    disabled = false,
}: GuidedSelectCardProps<T>) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onSelect(value)}
            disabled={disabled}
            className={cn(
                'relative flex flex-col items-start gap-1 p-4 rounded-lg border-2 text-left transition-all',
                'hover:border-primary/50 hover:bg-accent/50',
                selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-card',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            {/* Checkmark */}
            {selected && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                </div>
            )}

            {/* Content */}
            <div className="flex items-center gap-2">
                {icon && <span className="text-lg">{icon}</span>}
                <span className="font-medium text-sm">{label}</span>
            </div>
            <span className="text-xs text-muted-foreground line-clamp-2">
                {description}
            </span>
        </button>
    );
}
