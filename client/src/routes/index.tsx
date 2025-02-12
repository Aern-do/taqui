import { authenticate } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import AppSidebar from "@/components/custom/sidebar/app-sidebar";
import ChatView from "@/components/custom/chat/chat-view";
import { useGroupStore } from "@/lib/store";
import { useSwipeable } from "react-swipeable";
import { useEffect } from "react";
import EmptyGroupHeader from "@/components/custom/chat/empty-group-header";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/")({
    beforeLoad: authenticate,
    component: Index,
});

function SwipeHandler() {
    const { setOpenMobile } = useSidebar();
    const handlers = useSwipeable({
        onSwipedRight: () => setOpenMobile(true),
        onSwipedLeft: () => setOpenMobile(false),
        trackMouse: true,
    });

    useEffect(() => {
        const element = document.body;
        const { ref } = handlers;

        if (ref && typeof ref === "function") {
            ref(element);
        }

        return () => {
            if (ref && typeof ref === "function") {
                ref(null);
            }
        };
    }, [handlers]);

    return null;
}

function Index() {
    const groupStore = useGroupStore();
    const isMobile = useIsMobile();

    return (
        <SidebarProvider>
            <SwipeHandler />
            <AppSidebar />
            {groupStore.selectedGroupId ? (
                <ChatView />
            ) : (
                isMobile && <EmptyGroupHeader />
            )}
        </SidebarProvider>
    );
}
