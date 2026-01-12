"use client"

import React from 'react'
import { useParams } from 'next/navigation'
import { ScriptWizard } from '@/components/roteirista/ScriptWizard'
import { useShort } from '@/hooks/use-shorts'
import { Loader2 } from 'lucide-react'
import { useSetPageMetadata } from '@/contexts/page-metadata'

// Nota: O ScriptWizard atual é focado em criação.
// Para edição, precisamos de um wrapper que carregue os dados.

export default function EditarRoteiroPage() {
    const { id } = useParams()
    const { data, isLoading } = useShort(id as string)

    useSetPageMetadata({
        title: data?.short?.title ? `Editar: ${data.short.title}` : 'Editar Roteiro',
        description: 'Faça ajustes no seu roteiro gerado por IA.',
        breadcrumbs: [
            { label: 'Início', href: '/dashboard' },
            { label: 'Roteirista', href: '/roteirista' },
            { label: 'Editar' }
        ]
    })

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!data?.short) {
        return (
            <div className="py-20 text-center">
                <h1 className="text-2xl font-bold">Roteiro não encontrado</h1>
                <p className="text-muted-foreground">O roteiro que você está tentando editar não existe ou foi removido.</p>
            </div>
        )
    }

    // O ScriptWizard precisaria aceitar uma prop initialData para suportar edição real.
    // Como o ScriptWizard gerencia seu próprio estado interno, vamos passar o short como prop opcional
    // (Esta funcionalidade de edição requer uma pequena refatoração no ScriptWizard que faremos a seguir)

    return (
        <div className="flex-1">
            <ScriptWizard initialData={data.short} />
        </div>
    )
}
