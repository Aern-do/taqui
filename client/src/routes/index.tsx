import Group from "@/components/custom/Group";
import Message from "@/components/custom/chat/message-view";
import MessageInput from "@/components/custom/chat/message-input";
import UserStatus from "@/components/custom/status";
import { authenticate } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/custom/sidebar/app-sidebar";
import ChatView from "@/components/custom/chat/chat-view";
import { useGroupStore } from "@/lib/store";

export const Route = createFileRoute("/")({
    beforeLoad: authenticate,
    component: Index,
});

function Index() {
    const groupStore = useGroupStore();

    return (
        <SidebarProvider>
            <AppSidebar />
            {groupStore.selectedGroupId ? <ChatView /> : <></>}
        </SidebarProvider>
    );
}
