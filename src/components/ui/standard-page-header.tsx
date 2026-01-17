import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import React from "react"

interface StandardPageHeaderProps {
    title: string
    subtitle: string // The highlighted part
    description: string
    icon: LucideIcon
    badge?: string
    action?: React.ReactNode
    className?: string
}

export function StandardPageHeader({
    title,
    subtitle,
    description,
    icon: Icon,
    badge = "SISTEMA V1",
    action,
    className
}: StandardPageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-10 mb-8", className)}>
            <div className="space-y-2">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                    </div>
                    {badge && (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em] font-black border-primary/20 text-primary">
                            {badge}
                        </Badge>
                    )}
                </div>
                <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">
                    {title} <span className="text-primary italic">{subtitle}</span>
                </h1>
                <p className="text-muted-foreground max-w-xl text-lg font-medium leading-relaxed">
                    {description}
                </p>
            </div>
            {action && (
                <div className="flex-shrink-0">
                    {action}
                </div>
            )}
        </div>
    )
}
