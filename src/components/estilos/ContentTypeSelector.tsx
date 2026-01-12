"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import {
    Newspaper,
    BookOpen,
    Laugh,
    GraduationCap,
    Zap,
    HelpCircle,
    Settings
} from 'lucide-react'

export type ContentType = 'news' | 'story' | 'meme' | 'educational' | 'motivational' | 'tutorial' | 'custom'

interface ContentTypeSelectorProps {
    value: ContentType
    onChange: (value: ContentType) => void
}

const OPTIONS: { value: ContentType; label: string; icon: any; description: string }[] = [
    {
        value: 'news',
        label: 'Notícias',
        icon: Newspaper,
        description: 'Fatos, atualidades e informativos.'
    },
    {
        value: 'story',
        label: 'Histórias',
        icon: BookOpen,
        description: 'Narrativas, contos e ficção.'
    },
    {
        value: 'meme',
        label: 'Memes/Humor',
        icon: Laugh,
        description: 'Piadas, sátiras e conteúdo engraçado.'
    },
    {
        value: 'educational',
        label: 'Educacional',
        icon: GraduationCap,
        description: 'Explicações, conceitos e aprendizado.'
    },
    {
        value: 'motivational',
        label: 'Motivacional',
        icon: Zap,
        description: 'Inspiração e desenvolvimento pessoal.'
    },
    {
        value: 'tutorial',
        label: 'Tutorial',
        icon: HelpCircle,
        description: 'Passo a passo e "como fazer".'
    },
    {
        value: 'custom',
        label: 'Personalizado',
        icon: Settings,
        description: 'Regras totalmente customizadas.'
    },
]

export function ContentTypeSelector({ value, onChange }: ContentTypeSelectorProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = value === option.value

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "flex flex-col items-start p-3 rounded-xl border-2 transition-all duration-200 text-left hover:border-primary/50",
                            isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border/50 bg-card/50 hover:bg-accent/50"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-lg mb-2",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-sm">{option.label}</span>
                        <span className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                            {option.description}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
