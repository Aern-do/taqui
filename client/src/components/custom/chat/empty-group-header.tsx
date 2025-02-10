import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";

export default function EmptyGroupHeader() {
    const isMobile = useIsMobile();
    const { setOpenMobile } = useSidebar();

    return (
        <div className="sticky top-0 z-10 w-full">
            <div className="flex items-center border-b bg-background/95 px-6 py-3 backdrop-blur-sm">
                {isMobile && (
                    <Button
                        onClick={() => setOpenMobile(true)}
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </div>
    );
}
