"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EmptyLinksState } from "./EmptyLinksState";
import { LinkItem } from "./LinkItem";
import AddLinkBox from "./AddLinkBox";
import type { Link as ProfileLink } from "@/app/[username]/types/type";
import React from "react";

// dnd-kit
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import useDebounce from "@/hooks/useDebounce";

type LinksSectionProps = {
    username: string;
    links: ProfileLink[];
    showAdd: boolean;
    setShowAdd: React.Dispatch<React.SetStateAction<boolean>>;
    onExport: () => void;
    onAdd: (link: ProfileLink) => void | Promise<void>;
    onUpdate: (id: string, url: string) => Promise<void>;
    onToggleVisibility: (id: string, isPublic: boolean) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
};

function SortableLinkWrapper({ link, children }: { link: ProfileLink; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            data-testid="link-item"
            data-link-id={link.id}
        >
            {children}
        </div>
    );
}

export function LinksSection({
    username,
    links,
    showAdd,
    setShowAdd,
    onExport,
    onAdd,
    onUpdate,
    onToggleVisibility,
    onDelete,
}: LinksSectionProps) {
    const [localLinks, setLocalLinks] = React.useState<ProfileLink[]>(links);
    const [isSaving, setIsSaving] = React.useState(false);
    const latestSaveIdRef = React.useRef(0);

    React.useEffect(() => {
        setLocalLinks(links);
    }, [links]);

    const saveOrder = React.useCallback(async (orderedIds: string[]) => {
        const saveId = ++latestSaveIdRef.current;
        setIsSaving(true);
        try {
            const res = await fetch("/api/links/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderedIds }),
            });
            if (!res.ok) {
                // Re-fetch on error to reconcile
                if (saveId === latestSaveIdRef.current) {
                    const refresh = await fetch("/api/links");
                    const data = await refresh.json();
                    setLocalLinks(data.links || []);
                }
            }
        } catch (e) {
            // network error: refetch to reconcile
            if (saveId === latestSaveIdRef.current) {
                try {
                    const refresh = await fetch("/api/links");
                    const data = await refresh.json();
                    setLocalLinks(data.links || []);
                } catch (_) {
                    // ignore
                }
            }
        } finally {
            if (saveId === latestSaveIdRef.current) {
                setIsSaving(false);
            }
        }
    }, []);

    const debouncedSave = useDebounce(((ids: string[]) => saveOrder(ids)) as any, 500);

    const handleDragEnd = React.useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const oldIndex = localLinks.findIndex((l) => l.id === String(active.id));
            const newIndex = localLinks.findIndex((l) => l.id === String(over.id));
            if (oldIndex === -1 || newIndex === -1) return;

            const newList = arrayMove(localLinks, oldIndex, newIndex);
            setLocalLinks(newList);
            debouncedSave(newList.map((l) => l.id));
        },
        [localLinks, debouncedSave]
    );

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Your Links</CardTitle>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={onExport}>
                        Export CSV
                    </Button>
                    <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Link
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {showAdd && <AddLinkBox onAdded={onAdd} />}

                {localLinks.length === 0 && !showAdd && (
                    <EmptyLinksState onAdd={() => setShowAdd(true)} />
                )}

                <DndContext onDragEnd={handleDragEnd}>
                    <SortableContext items={localLinks.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {localLinks.map((link) => (
                                <SortableLinkWrapper key={link.id} link={link}>
                                    <LinkItem
                                        link={link}
                                        username={username}
                                        onUpdate={onUpdate}
                                        onToggleVisibility={onToggleVisibility}
                                        onDelete={onDelete}
                                    />
                                </SortableLinkWrapper>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {isSaving && <p className="mt-4 text-sm text-gray-500">Saving order...</p>}
            </CardContent>
        </Card>
    );
}
