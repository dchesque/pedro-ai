'use client'

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Copy,
    Download,
    FileText,
    Clock,
    Zap,
    Target,
    Headphones,
    Check
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface NarrationModalProps {
    isOpen: boolean
    onClose: () => void
    hook: string | null
    scenes: Array<{ narration: string; duration: number; order: number }>
    cta: string | null
}

export function NarrationModal({
    isOpen,
    onClose,
    hook,
    scenes,
    cta
}: NarrationModalProps) {
    const [copied, setCopied] = React.useState(false)

    const fullText = React.useMemo(() => {
        let text = ""
        if (hook) text += `HOOK:\n${hook}\n\n`
        scenes.forEach((scene, i) => {
            text += `CENA ${i + 1} (${scene.duration}s):\n${scene.narration}\n\n`
        })
        if (cta) text += `CTA:\n${cta}`
        return text
    }, [hook, scenes, cta])

    const wordCount = fullText.split(/\s+/).filter(Boolean).length
    const estTime = Math.ceil(wordCount / 2.5) // Aproximadamente 150 palavras por minuto

    const handleCopy = () => {
        navigator.clipboard.writeText(fullText)
        setCopied(true)
        toast.success("Texto copiado para a área de transferência!")
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        const element = document.createElement("a")
        const file = new Blob([fullText], { type: 'text/plain' })
        element.href = URL.createObjectURL(file)
        element.download = "roteiro-narracao.txt"
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        toast.success("Arquivo baixado com sucesso!")
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-border/50 shadow-2xl">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <FileText className="h-5 w-5 text-primary" />
                            Narração Completa
                        </DialogTitle>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground mr-4">
                                <Clock className="h-3 w-3" />
                                ~{estTime}s de áudio
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-8 pb-8">
                        {/* Hook */}
                        {hook && (
                            <section className="space-y-3">
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold tracking-widest text-[10px] gap-1.5 py-0.5">
                                    <Zap className="h-3 w-3 fill-current" />
                                    HOOK
                                </Badge>
                                <p className="text-lg font-serif italic leading-relaxed text-foreground/90 pl-4 border-l-2 border-amber-500/20">
                                    "{hook}"
                                </p>
                            </section>
                        )}

                        {/* Cenas */}
                        <div className="space-y-6">
                            {scenes.map((scene, i) => (
                                <section key={i} className="space-y-2 group">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Cena {i + 1}
                                        </span>
                                        <span className="text-[10px] font-mono text-muted-foreground/50">
                                            {scene.duration}s
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-foreground/80 pl-4 border-l-2 border-border/50 group-hover:border-primary/30 transition-colors">
                                        {scene.narration}
                                    </p>
                                </section>
                            ))}
                        </div>

                        {/* CTA */}
                        {cta && (
                            <section className="space-y-3">
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold tracking-widest text-[10px] gap-1.5 py-0.5">
                                    <Target className="h-3 w-3 fill-current" />
                                    CTA
                                </Badge>
                                <p className="text-lg font-serif italic leading-relaxed text-foreground/90 pl-4 border-l-2 border-emerald-500/20">
                                    "{cta}"
                                </p>
                            </section>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-2 bg-muted/30 border-t border-border/50">
                    <div className="flex w-full items-center justify-between gap-4">
                        <div className="hidden md:flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estatísticas</span>
                            <span className="text-xs font-medium">{wordCount} palavras • {estTime}s estimados</span>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button variant="outline" className="flex-1 md:flex-none h-10 px-4" onClick={handleDownload}>
                                <Download className="mr-2 h-4 w-4" />
                                Baixar TXT
                            </Button>
                            <Button className="flex-1 md:flex-none h-10 px-6 font-bold shadow-lg shadow-primary/20" onClick={handleCopy}>
                                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                {copied ? "Copiado!" : "Copiar Tudo"}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>

                {/* Feature Hint */}
                <div className="px-6 py-2 bg-indigo-500/5 text-center border-t border-indigo-500/10">
                    <p className="text-[10px] font-medium text-indigo-500/70 flex items-center justify-center gap-1.5">
                        <Headphones className="h-3 w-3" />
                        Em breve: Geração de voz ultra-realista com ElevenLabs.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
