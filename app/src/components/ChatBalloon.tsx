import React from 'react';

interface ChatBalloonProps {
    message: string;
    isUser?: boolean;
}

export default function ChatBalloon({ message, isUser = false }: ChatBalloonProps) {
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                isUser 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
            }`}>
                <p>{message}</p>
            </div>
        </div>
    );
} 