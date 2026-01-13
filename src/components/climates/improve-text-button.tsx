'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, Wand2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImproveTextButtonProps {
    onClick: () => void;
    isLoading: boolean;
    variant?: 'improve' | 'generate';
    disabled?: boolean;
    className?: string;
}

export function ImproveTextButton({
    onClick,
    isLoading,
    variant = 'improve',
    disabled = false,
    className,
}: ImproveTextButtonProps) {
    const isGenerate = variant === 'generate';

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClick}
            disabled={isLoading || disabled}
            className={cn(
                'gap-1.5 text-xs',
                isGenerate
                    ? 'text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700'
                    : 'text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700',
                className
            )}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {isGenerate ? 'Gerando...' : 'Melhorando...'}
                </>
            ) : (
                <>
                    {isGenerate ? (
                        <Wand2 className="h-3 w-3" />
                    ) : (
                        <Sparkles className="h-3 w-3" />
                    )}
                    {isGenerate ? 'Gerar Preview' : 'Melhorar com IA'}
                </>
            )}
        </Button>
    );
}
