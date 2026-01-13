'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
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
}

export function ClimateSelector({ value, onValueChange, className }: ClimateSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const { data, isLoading } = useClimates()

    const climates = data?.climates || []
    const selectedClimate = climates.find((c) => c.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-auto py-3 px-4 bg-background/50 border-white/10 hover:bg-white/5", className)}
                >
                    {selectedClimate ? (
                        <div className="flex flex-col items-start gap-1 text-left">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{selectedClimate.icon}</span>
                                <span className="font-semibold">{selectedClimate.name}</span>
                                {selectedClimate.isSystem && (
                                    <Badge variant="secondary" className="text-[10px] h-4 py-0 px-1 opacity-70">SISTEMA</Badge>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                                {selectedClimate.emotionalDetails?.subtitle} • {selectedClimate.description}
                            </span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">Selecione o clima da narrativa...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command className="bg-zinc-950 border-white/10">
                    <CommandInput placeholder="Buscar climas..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>Nenhum clima encontrado.</CommandEmpty>
                        {isLoading ? (
                            <div className="p-4 flex flex-col items-center gap-2 text-muted-foreground italic">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-xs">Carregando climas...</span>
                            </div>
                        ) : (
                            <CommandGroup heading="Disponíveis">
                                {climates.map((climate) => (
                                    <CommandItem
                                        key={climate.id}
                                        value={climate.name}
                                        onSelect={() => {
                                            onValueChange(climate.id, climate)
                                            setOpen(false)
                                        }}
                                        className="flex items-start gap-3 py-3 cursor-pointer"
                                    >
                                        <div className="text-2xl pt-1">{climate.icon}</div>
                                        <div className="flex flex-col flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-white">{climate.name}</span>
                                                {climate.isSystem && (
                                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 border border-white/10 px-1 rounded">Sistema</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">{climate.description}</span>
                                            <div className="flex gap-2 mt-1.5">
                                                <Badge variant="outline" className="text-[9px] h-4 py-0 flex gap-1 items-center border-white/5 bg-white/5">
                                                    <span>{climate.emotionalDetails?.icon}</span>
                                                    <span>{climate.emotionalDetails?.label}</span>
                                                </Badge>
                                                <Badge variant="outline" className="text-[9px] h-4 py-0 flex gap-1 items-center border-white/5 bg-white/5">
                                                    <span>{climate.pressureDetails?.icon}</span>
                                                    <span>{climate.pressureDetails?.label}</span>
                                                </Badge>
                                            </div>
                                        </div>
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4 text-primary mt-1",
                                                value === climate.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
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
