'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PromptCardProps {
    prompt: {
        id: string;
        key: string;
        description?: string;
        module: string;
        isActive: boolean;
        // name is NOT in SystemPrompt schema based on prisma/schema.prisma viewed earlier, 
        // it has key, description, template, module.
        // Wait, let's double check schema. SystemPrompt has: id, key, description, template, module.
        // No 'name'. Using 'key' or description's first line as name if needed, or just key.
        // The user design requested "Name" (e.g. "Melhorar Texto").
        // The seed script used comments or mapped configs, but the schema has 'description' and 'key'.
        // I will use description or formatted key as name if name field is missing.
        // Or maybe description IS the name? The seed script had `name` property in the array `prompts` but `upsert` only used `description`.
        // Let's check seed-roteirista-prompts.js again.
        // It says:
        // description: prompt.description,
        // module: prompt.module
        // The `prompts` array had `name` property but it wasn't used in upsert create/update!
        // So 'name' is NOT saved in DB. 
        // I should probably use `description` as the title if it's short, or the key.
        // Or I should have added `name` to the schema in previous task if I wanted it.
        // I will use `description` as title if present, otherwise Key.
    };
    onEdit: () => void;
}

const MODULE_COLORS: Record<string, string> = {
    roteirista: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    climas: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    estilos: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    personagens: 'bg-green-500/10 text-green-500 border-green-500/20',
    imagens: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    geral: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const MODULE_LABELS: Record<string, string> = {
    roteirista: 'Roteirista',
    climas: 'Climas',
    estilos: 'Estilos',
    personagens: 'Personagens',
    imagens: 'Imagens',
    geral: 'Geral',
};

export function PromptCard({ prompt, onEdit }: PromptCardProps) {
    return (
        <Card className="group hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        {/* Header com badge de módulo */}
                        <div className="flex items-center gap-2 mb-1">
                            <Badge
                                variant="outline"
                                className={cn("text-[10px] font-medium capitalize", MODULE_COLORS[prompt.module] || MODULE_COLORS.geral)}
                            >
                                {MODULE_LABELS[prompt.module] || prompt.module}
                            </Badge>
                            <code className="text-[10px] text-muted-foreground font-mono">
                                {prompt.key}
                            </code>
                        </div>

                        {/* Nome e descrição */}
                        <h4 className="font-semibold text-sm">{prompt.description || prompt.key}</h4>
                        {/* If description is used as name, we might want to hide it here or show it if it's long? 
                Actually the seed put "Melhorar Texto" in description. So description IS the name effectively.
            */}
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onEdit}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        Ver Prompt
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
