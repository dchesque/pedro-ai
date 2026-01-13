'use client';

import { Label } from '@/components/ui/label';
import { GuidedSelectCard } from './guided-select-card';
import { cn } from '@/lib/utils';
import { Option } from '@/types/style';

interface GuidedSelectGroupProps<T extends string> {
    label: string;
    description?: string;
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
    columns?: 2 | 3 | 4;
    disabled?: boolean;
}

export function GuidedSelectGroup<T extends string>({
    label,
    description,
    options,
    value,
    onChange,
    columns = 2,
    disabled = false,
}: GuidedSelectGroupProps<T>) {
    const gridCols = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
    };

    return (
        <div className="space-y-3">
            <div>
                <Label className="text-sm font-medium">{label}</Label>
                {description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                )}
            </div>
            <div className={cn('grid gap-3', gridCols[columns])}>
                {options.map((option) => (
                    <GuidedSelectCard
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        description={option.description}
                        icon={option.icon}
                        selected={value === option.value}
                        onSelect={onChange}
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    );
}
