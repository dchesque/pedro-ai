'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { useClimates, Climate } from '@/hooks/use-climates'
import { Badge } from '@/components/ui/badge'

interface ClimateSelectorProps {
    value?: string
    onValueChange: (value: string, climate?: Climate) => void
    className?: string
    compatibleClimates?: string[]
}

export function ClimateSelector({ value, onValueChange, className, compatibleClimates = [] }: ClimateSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const { data, isLoading } = useClimates()

    const climatesRaw = data?.climates || []

    // Ordenar: Compatíveis primeiro
    const climates = React.useMemo(() => {
        if (!compatibleClimates?.length) return climatesRaw;

        return [...climatesRaw].sort((a, b) => {
            const aIs = compatibleClimates.includes(a.id);
            const bIs = compatibleClimates.includes(b.id);
            if (aIs && !bIs) return -1;
            if (!aIs && bIs) return 1;
            return 0;
        });
    }, [climatesRaw, compatibleClimates]);
    const selectedClimate = climates.find((c) => c.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-auto py-2 px-3 bg-background/50 border-border hover:bg-accent/50 transition-all", className)}
                >
                    {selectedClimate ? (
                        <div className="flex flex-col items-start gap-0.5 text-left min-w-0 flex-1">
                            <div className="flex items-center gap-2 w-full">
                                <span className="text-lg flex-shrink-0">{selectedClimate.icon}</span>
                                <span className="font-semibold text-sm truncate">{selectedClimate.name}</span>
                                {selectedClimate.isSystem && (
                                    <Badge variant="secondary" className="text-[10px] h-3.5 py-0 px-1 font-bold">SISTEMA</Badge>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate w-full opacity-80">
                                {selectedClimate.emotionalDetails?.subtitle} • {selectedClimate.description}
                            </span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">Selecione o clima da narrativa...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 overflow-hidden" align="start">
                <Command className="bg-popover">
                    <CommandInput placeholder="Buscar climas..." className="h-10" />
                    <CommandList className="max-h-[400px]">
                        <CommandEmpty>Nenhum clima encontrado.</CommandEmpty>
                        {isLoading ? (
                            <div className="p-8 flex flex-col items-center gap-3 text-muted-foreground italic">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="text-xs">Carregando climas...</span>
                            </div>
                        ) : (
                            <CommandGroup heading="Climas Disponíveis" className="p-2">
                                {climates.map((climate) => (
                                    <CommandItem
                                        key={climate.id}
                                        value={`${climate.name}-${climate.id}`}
                                        onSelect={() => {
                                            onValueChange(climate.id, climate)
                                            setOpen(false)
                                        }}
                                        className="flex items-start gap-3 p-2 cursor-pointer rounded-md mb-0.5 data-[selected=true]:bg-accent/50 data-[selected=true]:text-accent-foreground transition-all"
                                    >
                                        <div className="text-xl pt-0.5 flex-shrink-0">{climate.icon}</div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-sm">{climate.name}</span>
                                                {climate.isSystem && (
                                                    <Badge variant="secondary" className="text-[10px] h-4 py-0 px-1 font-bold">
                                                        SISTEMA
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground line-clamp-1 mb-1 leading-relaxed">
                                                {climate.description}
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                <Badge variant="outline" className="text-[9px] h-4 py-0 flex gap-1 items-center bg-muted/30 border-border/50">
                                                    <span>{climate.emotionalDetails?.icon}</span>
                                                    <span>{climate.emotionalDetails?.label}</span>
                                                </Badge>
                                                {compatibleClimates?.includes(climate.id) && (
                                                    <Badge variant="outline" className="text-[10px] h-5 py-0 flex gap-1 items-center border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                        <Sparkles className="h-2.5 w-2.5" />
                                                        Compatível
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="text-[10px] h-5 py-0 flex gap-1 items-center bg-muted/30 border-border/50">
                                                    <span>{climate.pressureDetails?.icon}</span>
                                                    <span>{climate.pressureDetails?.label}</span>
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center self-center pl-2">
                                            <Check
                                                className={cn(
                                                    "h-4 w-4 text-primary",
                                                    value === climate.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
