"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const SCRIPT_MODELS = [
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', description: 'Rápido e econômico', recommended: true },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude Sonnet', description: 'Alta qualidade' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Versátil' },
    { id: 'meta-llama/llama-3-70b', name: 'Llama 3 70B', description: 'Open source' },
    { id: 'google/gemini-pro', name: 'Gemini Pro', description: 'Google' },
]

interface AIModelSelectorProps {
    value: string
    onChange: (model: string) => void
    disabled?: boolean
}

export function AIModelSelector({ value, onChange, disabled }: AIModelSelectorProps) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Modelo de IA (Roteiro)
            </label>
            <Select onValueChange={onChange} value={value} disabled={disabled}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                    {SCRIPT_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                            <div className="flex flex-col">
                                <span className="font-medium">
                                    {model.name}
                                    {model.recommended && (
                                        <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase">
                                            Recomendado
                                        </span>
                                    )}
                                </span>
                                <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
