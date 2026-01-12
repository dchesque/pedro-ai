"use client"

import React from 'react'
import { ScriptWizard } from '@/components/roteirista/ScriptWizard'
import { useSetPageMetadata } from '@/contexts/page-metadata'

export default function NovoRoteiroPage() {
    useSetPageMetadata({
        title: 'Novo Roteiro',
        description: 'Crie um novo roteiro assistido por IA.',
        breadcrumbs: [
            { label: 'Início', href: '/dashboard' },
            { label: 'Roteirista', href: '/roteirista' },
            { label: 'Novo' }
        ]
    })

    return (
        <div className="flex-1">
            <ScriptWizard />
        </div>
    )
}
