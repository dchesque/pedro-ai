'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from '@/components/ui/collapsible';
import { ChevronDown, AlertTriangle, Sparkles, Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

// Constantes de proteção
const MAX_CHARS = 500; // Limite de caracteres (aprox. 100-125 tokens)
const CHARS_WARNING = 400; // Aviso quando se aproxima do limite

interface AdvancedInstructionsProps {
    value: string;
    onChange: (value: string) => void;
    onImprove?: () => Promise<void>;
    isImproving?: boolean;
}

export function AdvancedInstructions({
    value,
    onChange,
    onImprove,
    isImproving = false,
}: AdvancedInstructionsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const charCount = value?.length || 0;
    const isNearLimit = charCount >= CHARS_WARNING;
    const isAtLimit = charCount >= MAX_CHARS;

    const handleChange = (newValue: string) => {
        // Impedir ultrapassar o limite
        if (newValue.length <= MAX_CHARS) {
            onChange(newValue);
        }
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto hover:bg-transparent"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Instruções Avançadas</span>
                        <span className="text-xs text-muted-foreground">(opcional)</span>
                    </div>
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 transition-transform',
                            isOpen && 'rotate-180'
                        )}
                    />
                </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3 space-y-3">
                {/* ⚠️ AVISO PRINCIPAL - Texto fixo obrigatório */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-800">
                        <p className="font-semibold">
                            ⚠️ Este campo não substitui Estilo ou Clima.
                        </p>
                        <p className="mt-1">
                            Use apenas para ajustes pontuais. Instruções aqui têm
                            <strong> peso menor</strong> no prompt final e não podem
                            sobrescrever as configurações dos blocos guiados acima.
                        </p>
                    </div>
                </div>

                {/* Campo de texto com limite */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="advancedInstructions" className="text-sm">
                            Ajustes Pontuais
                        </Label>
                        {onImprove && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onImprove}
                                disabled={isImproving || !value?.trim()}
                                className="gap-1.5 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                            >
                                {isImproving ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Melhorando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-3 w-3" />
                                        Melhorar com IA
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    <Textarea
                        id="advancedInstructions"
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder="Instruções específicas que complementam os blocos guiados..."
                        rows={3}
                        className={cn(
                            'text-sm resize-none',
                            isAtLimit && 'border-red-300 focus-visible:ring-red-300'
                        )}
                    />

                    {/* Contador de caracteres */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Exemplo: "Sempre mencione a fonte" ou "Evite jargões técnicos"
                        </p>
                        <span
                            className={cn(
                                'text-xs',
                                isAtLimit ? 'text-red-500 font-medium' :
                                    isNearLimit ? 'text-amber-500' :
                                        'text-muted-foreground'
                            )}
                        >
                            {charCount}/{MAX_CHARS}
                        </span>
                    </div>
                </div>

                {/* Nota técnica sobre peso no prompt */}
                <p className="text-[10px] text-muted-foreground/60 italic border-t pt-2">
                    💡 Estas instruções são processadas com peso reduzido (0.3x) no prompt final.
                </p>
            </CollapsibleContent>
        </Collapsible>
    );
}
