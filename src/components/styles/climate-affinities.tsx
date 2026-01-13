'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Sparkles, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip';
import { ContentType, CLIMATE_AFFINITIES_MAP } from '@/types/style';
import { cn } from '@/lib/utils';

interface Climate {
    id: string;
    name: string;
    emotionalState: string;
}

interface ClimateAffinitiesProps {
    contentType: ContentType;
    selectedClimates: string[];
    onClimatesChange: (climates: string[]) => void;
}

export function ClimateAffinities({
    contentType,
    selectedClimates,
    onClimatesChange,
}: ClimateAffinitiesProps) {
    const [availableClimates, setAvailableClimates] = useState<Climate[]>([]);
    const [affinityIds, setAffinityIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Buscar climas disponíveis
    useEffect(() => {
        async function fetchClimates() {
            try {
                const response = await fetch('/api/climates');
                if (response.ok) {
                    const data = await response.json();
                    // Adjust based on API response structure. 
                    // Assuming { climates: ... } based on prompt.
                    setAvailableClimates(data.climates || []);
                }
            } catch (error) {
                console.error('Erro ao buscar climas:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchClimates();
    }, []);

    // Atualizar afinidades baseado no tipo de conteúdo (apenas visual, sem auto-seleção)
    useEffect(() => {
        const affinities = CLIMATE_AFFINITIES_MAP[contentType] || [];
        setAffinityIds(affinities);
    }, [contentType]);

    const toggleClimate = (climateId: string) => {
        if (selectedClimates.includes(climateId)) {
            onClimatesChange(selectedClimates.filter(id => id !== climateId));
        } else {
            onClimatesChange([...selectedClimates, climateId]);
        }
    };

    const hasAffinity = (climate: Climate) => {
        return affinityIds.includes(climate.emotionalState);
    };

    if (isLoading) {
        return <div className="text-xs text-muted-foreground">Carregando climas...</div>;
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Climas Compatíveis</Label>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs max-w-[220px]">
                                Selecione os climas que melhor se adaptam a este estilo.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Texto psicologicamente calibrado */}
            <p className="text-xs text-muted-foreground">
                Sugestões de climas que costumam funcionar bem com este estilo.
                O clima final é escolhido na criação do roteiro.
            </p>

            <div className="flex flex-wrap gap-2">
                {availableClimates.map((climate) => {
                    const isSelected = selectedClimates.includes(climate.id);
                    const affinity = hasAffinity(climate);

                    return (
                        <Badge
                            key={climate.id}
                            variant="secondary"
                            className={cn(
                                'cursor-pointer transition-all font-normal hover:bg-accent',
                                isSelected
                                    ? 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                                    : 'bg-muted/30 text-muted-foreground border-transparent',
                                // destaque sutil para afinidade sugerida se não selecionado
                                !isSelected && affinity && 'border-primary/10 bg-primary/5'
                            )}
                            onClick={() => toggleClimate(climate.id)}
                        >
                            {affinity && (
                                <Sparkles className="h-3 w-3 mr-1 text-primary/40" />
                            )}
                            {climate.name}
                        </Badge>
                    );
                })}
            </div>

            {/* Nota sutil */}
            {affinityIds.length > 0 && (
                <p className="text-[10px] text-muted-foreground/50 italic">
                    Climas com ✨ são sugestões naturais para {contentType.toLowerCase()}.
                </p>
            )}
        </div>
    );
}
