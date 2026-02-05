import { useEffect } from "react";

interface CrispChatProps {
    websiteId: string;
}

export default function CrispChat({ websiteId }: CrispChatProps) {
    useEffect(() => {
        if (typeof window === "undefined" || !websiteId) return;

        // Set Crisp configuration
        window.$crisp = [];
        window.CRISP_WEBSITE_ID = websiteId;

        // Load Crisp script
        const script = document.createElement("script");
        script.src = "https://client.crisp.chat/l.js";
        script.async = true;
        document.head.appendChild(script);

        return () => {
            // Cleanup on unmount
            if (window.$crisp) {
                window.$crisp.push(["do", "chat:hide"]);
            }
        };
    }, [websiteId]);

    return null;
}

// Type declarations for Crisp
declare global {
    interface Window {
        $crisp: any[];
        CRISP_WEBSITE_ID: string;
    }
}
