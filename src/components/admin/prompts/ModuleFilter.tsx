'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Thermometer,
    Palette,
    Users,
    Image,
    Settings,
    LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Module {
    key: string;
    name: string;
    icon: string;
    count: number;
}

interface ModuleFilterProps {
    modules: Module[];
    selected: string;
    onSelect: (module: string) => void;
}

const ICONS: Record<string, React.ElementType> = {
    FileText,
    Thermometer,
    Palette,
    Users,
    Image,
    Settings,
    LayoutGrid
};

export function ModuleFilter({ modules, selected, onSelect }: ModuleFilterProps) {
    const totalCount = modules.reduce((sum, m) => sum + m.count, 0);

    return (
        <Tabs value={selected} onValueChange={onSelect} className="w-full">
            <TabsList className="w-full justify-start flex-wrap h-auto gap-2 bg-transparent p-0">
                {/* Tab "Todos" */}
                <TabsTrigger
                    value="todos"
                    className={cn(
                        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                        "px-4 py-2 rounded-lg border bg-muted/40"
                    )}
                >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Todos
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                        {totalCount}
                    </Badge>
                </TabsTrigger>

                {/* Tabs por módulo */}
                {modules.map((module) => {
                    const Icon = ICONS[module.icon] || Settings;

                    return (
                        <TabsTrigger
                            key={module.key}
                            value={module.key}
                            className={cn(
                                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                                "px-4 py-2 rounded-lg border bg-muted/40"
                            )}
                        >
                            <Icon className="h-4 w-4 mr-2" />
                            {module.name || module.key}
                            <Badge variant="secondary" className="ml-2 text-[10px]">
                                {module.count}
                            </Badge>
                        </TabsTrigger>
                    );
                })}
            </TabsList>
        </Tabs>
    );
}
