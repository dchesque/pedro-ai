"use client"

import React from 'react'
import { CheckCircle2, AlertCircle, FileText, LayoutDashboard, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useCharacters } from '@/hooks/use-characters'
import type { ScriptFormData } from '@/lib/roteirista/types'

interface ReviewStepProps {
    data: Partial<ScriptFormData>
}

export function ReviewStep({ data }: ReviewStepProps) {
    const { data: charactersData } = useCharacters()
    const characters = charactersData?.characters || []

    const selectedCharacters = characters.filter(c => data.characterIds?.includes(c.id))

    const issues = []
    if (!data.title) issues.push('Falta um título')
    if (!data.synopsis) issues.push('Falta uma sinopse')
    if (!data.scenes || data.scenes.length === 0) issues.push('Nenhuma cena criada')

    const incompleteScenes = data.scenes?.filter(s => !s.narration.trim() || !s.visualPrompt.trim()) || []
    if (incompleteScenes.length > 0) {
        issues.push(`${incompleteScenes.length} cena(s) estão incompletas (sem narração ou prompt visual)`)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-2 mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <FileText className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Revisão Final</h2>
                <p className="text-muted-foreground">
                    Tudo pronto para salvar seu roteiro? Verifique se está tudo como deseja.
                </p>
            </div>

            {issues.length > 0 ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-4 mt-2 space-y-1">
                            {issues.map((issue, i) => (
                                <li key={i}>{issue}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertTitle>Pronto para salvar</AlertTitle>
                    <AlertDescription>
                        Seu roteiro está completo e bem estruturado.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Informações Gerais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Título</p>
                            <p className="text-sm font-medium">{data.title || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Formato</p>
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/10">
                                {data.format || 'SHORT'}
                            </Badge>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">Clima</h4>
                            <p className="capitalize">{data.climate || 'Não definido'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Tom / Estilo</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {/* Show Tone Name if available for toneId - assuming we don't have access to tone list here without hook, can use data.tone as string fallback if synced */}
                                {data.styleId && <Badge variant="outline">Estilo ID: {data.styleId.slice(0, 8)}...</Badge>}
                                {data.targetAudience && <Badge variant="outline" className="text-blue-500 border-blue-200">{data.targetAudience}</Badge>}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Premissa</p>
                            <p className="text-sm line-clamp-2">{data.premise || data.theme || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Sinopse</p>
                            <p className="text-sm line-clamp-3">{data.synopsis || '-'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Conteúdo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total de Cenas</span>
                            <Badge>{data.scenes?.length || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Personagens</span>
                            <div className="flex -space-x-2">
                                {selectedCharacters.map((c, i) => (
                                    <div key={c.id} title={c.name} className="relative group">
                                        {c.imageUrl ? (
                                            <img
                                                src={c.imageUrl}
                                                className="w-8 h-8 rounded-full border-2 border-background object-cover"
                                                alt=""
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                                                <span className="text-[10px]">{c.name.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {selectedCharacters.length === 0 && (
                                    <span className="text-sm">-</span>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Duração Estimada</span>
                            <span className="text-sm font-medium">
                                {data.scenes?.reduce((acc, s) => acc + (s.duration || 5), 0) || 0}s
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="p-4 rounded-lg border bg-muted/50 text-sm">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                        <Send className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium">O que acontece depois?</p>
                        <p className="text-muted-foreground mt-1">
                            Ao salvar, o vídeo entrará no status <strong>"Roteiro Pronto"</strong>.
                            Desta tela você poderá prosseguir para a geração de imagens e posteriormente o vídeo final.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
