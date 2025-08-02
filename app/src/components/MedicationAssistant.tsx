import React, { useState } from 'react';
import ChatBalloon, { ChatBlock } from './ChatBalloon';

export default function MedicationAssistant() {
    const [chatBlocks, setChatBlocks] = useState<ChatBlock[]>([]);
    const [messageText, setMessageText] = useState('');

    const assistantMessage: ChatBlock = {
        type: 'p',
        contents: ["Hello! I'm here to help you with medication information. How can I assist you today?"],
        role: 'assistant'
    };

    const handleSend = () => {
        if (messageText.trim()) {
            const userBlock: ChatBlock = {
                type: 'p',
                contents: [messageText.trim()],
                role: 'user'
            };
            
            setChatBlocks(prev => [...prev, userBlock]);
            setMessageText('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="hidden lg:flex w-80 bg-white border-l border-gray-200 flex-col">
            <div className="p-4 border-b border-gray-200">
                <div className="text-lg font-semibold text-gray-800">Medication Assistant</div>
                <p className="text-sm text-gray-600 mt-1">Ask questions about your medications</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatBlocks.length === 0 ? (
                    <ChatBalloon block={assistantMessage} />
                ) : (
                    chatBlocks.map((block, index) => (
                        <ChatBalloon key={index} block={block} />
                    ))
                )}
            </div>

            <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                    <textarea
                        name="medication-message"
                        placeholder="Type your message..."
                        className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={handleSend}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
} 