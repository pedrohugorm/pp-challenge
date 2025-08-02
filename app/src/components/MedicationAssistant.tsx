import React, { useState } from 'react';
import ChatBalloon, { ChatBlock } from './ChatBalloon';
import { chatService, ContextItem } from '@/services/chatService';

export default function MedicationAssistant() {
    const [chatBlocks, setChatBlocks] = useState<ChatBlock[]>([]);
    const [messageText, setMessageText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [contextList, setContextList] = useState<ContextItem[]>([]);

    const assistantMessage: ChatBlock = {
        type: 'p',
        contents: ["Hello! I'm here to help you with medication information. How can I assist you today?"],
        role: 'assistant'
    };

    const handleNewChat = () => {
        setChatBlocks([]);
        setMessageText('');
        setIsLoading(false);
        setContextList([]);
    };

    const handleSend = async () => {
        if (messageText.trim()) {
            const userBlock: ChatBlock = {
                type: 'p',
                contents: [messageText.trim()],
                role: 'user'
            };
            
            // Store the message in a context list as ContextItem
            const contextItem: ContextItem = {
                role: 'user',
                content: messageText.trim(),
            };
            setContextList(prev => [...prev, contextItem]);
            
            setChatBlocks(prev => [...prev, userBlock]);
            setMessageText('');
            setIsLoading(true);

            try {
                const data = await chatService.sendMessage({
                    userPrompt: messageText.trim(),
                    context: contextList
                });
                
                console.log('Backend response:', data);
                
                // Append the response context to the context list
                setContextList(prev => [...prev, ...data.response.context]);
                
                setChatBlocks(prev => [...prev, ...data.response.blocks]);
                
            } catch (error) {
                console.error('Error calling backend:', error);
                
                const errorBlock: ChatBlock = {
                    type: 'p',
                    contents: ['Sorry, I encountered an error while processing your request. Please try again.'],
                    role: 'assistant'
                };
                setChatBlocks(prev => [...prev, errorBlock]);
            } finally {
                setIsLoading(false);
            }
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
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-lg font-semibold text-gray-800">Medication Assistant</div>
                        <p className="text-sm text-gray-600 mt-1">Ask questions about your medications</p>
                    </div>
                    <button
                        onClick={handleNewChat}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatBlocks.length === 0 ? (
                    <ChatBalloon block={assistantMessage} />
                ) : (
                    <>
                        {chatBlocks.map((block, index) => (
                            <ChatBalloon key={index} block={block} />
                        ))}
                        {isLoading && (
                            <ChatBalloon 
                                block={{
                                    type: 'p',
                                    contents: ['Searching...'],
                                    role: 'assistant'
                                }} 
                            />
                        )}
                    </>
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
                        onKeyUp={handleKeyPress}
                    />
                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSend}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
} 