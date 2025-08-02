import React from 'react';
import { BlockContent, renderBlocks } from "@/utils/renderBlocks";

export interface ChatBlock extends BlockContent {
    role: "assistant" | "user";
}

interface ChatBalloonProps {
    block: ChatBlock;
}

export default function ChatBalloon({ block }: ChatBalloonProps) {
    const isUser = block.role === "user";
    
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                isUser 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
            }`}>
                {renderBlocks([block])}
            </div>
        </div>
    );
} 