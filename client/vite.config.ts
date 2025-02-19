import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

export default defineConfig({
    server: {
        host: "0.0.0.0",
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
            },
        },
    },
    plugins: [react(), TanStackRouterVite()],
    envDir: "..",
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
