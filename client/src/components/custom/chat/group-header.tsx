import { useMembers, useSelectedGroup } from "@/hooks/api";
import { Hash, Menu, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { pluralize } from "@/lib/utils";
import { useGroupStore } from "@/lib/store";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function GroupHeader() {
    const { selectedGroupId } = useGroupStore();
    const { setOpenMobile } = useSidebar();
    const isMobile = useIsMobile();

    const { isLoading: isLoadingGroup, data: group } = useSelectedGroup();
    const { isLoading: isLoadingMembers, data: members } = useMembers(
        selectedGroupId!!,
    );

    if (isLoadingMembers || isLoadingGroup) return;

    return (
        <div className="sticky top-0 z-10">
            <div className="flex items-center justify-between border-b bg-background/95 px-6 py-3 backdrop-blur-sm">
                {isMobile && (
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setOpenMobile(true)}
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold text-foreground">
                            {group?.name}
                        </h2>
                    </div>
                    <Separator orientation="vertical" className="h-5" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                            {members?.length}{" "}
                            {pluralize(members!.length, "member")}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
