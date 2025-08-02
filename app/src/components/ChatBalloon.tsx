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
            <div className={`chat-balloon max-w-xs px-4 py-2 rounded-lg text-sm ${
                isUser 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
            } [&_a]:block [&_a]:px-3 [&_a]:py-1.5 [&_a]:bg-gray-200 [&_a]:text-gray-700 [&_a]:rounded-md [&_a]:text-sm [&_a]:font-medium [&_a]:no-underline [&_a]:mb-2 [&_a]:last:mb-0 [&_a]:text-center [&_a:hover]:bg-gray-300 [&_a:hover]:text-gray-800`}>
                {renderBlocks([block])}
            </div>
        </div>
    );
} 