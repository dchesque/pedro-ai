"use client"

import React from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface IconPickerProps {
    value: string
    onChange: (value: string) => void
}

const EMOJIS = [
    '🎬', '🔥', '✨', '📰', '📖', '😂', '📚', '💪', '🎓', '⚙️',
    '🌍', '🛸', '👻', '🎭', '🎨', '🚀', '⭐', '💎', '💡', '📱',
    '🕹️', '🍔', '⚽', '🎸', '🌈', '⚡', '🤖', '👾', '📝', '📢'
]

export function IconPicker({ value, onChange }: IconPickerProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="w-12 h-12 p-0 text-xl flex items-center justify-center bg-card/50 hover:border-primary/50 transition-colors"
                >
                    {value || '🎬'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-3 glass-panel" align="start">
                <div className="grid grid-cols-6 gap-2">
                    {EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => onChange(emoji)}
                            className="text-xl p-1 hover:bg-accent rounded-md transition-colors flex items-center justify-center h-8 w-8"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
