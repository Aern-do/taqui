import Status from "../status";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
} from "../../ui/sidebar";
import NavList from "./nav-list";

export default function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent>
                <NavList />
            </SidebarContent>
            
            <SidebarFooter>
                <Status />
            </SidebarFooter>
        </Sidebar>
    );
}
