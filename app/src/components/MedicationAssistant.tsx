"use client"
import React, { useState, useEffect, useRef } from 'react';
import ChatBalloon, { ChatBlock } from './ChatBalloon';
import { chatService, ContextItem } from '@/services/chatService';

// Local storage key
const STORAGE_KEY = 'medication-assistant-state';

// Interface for the complete state
interface AssistantState {
    chatBlocks: ChatBlock[];
    messageText: string;
    isLoading: boolean;
    contextList: ContextItem[];
}

export default function MedicationAssistant() {
    const [chatBlocks, setChatBlocks] = useState<ChatBlock[]>([]);
    const [messageText, setMessageText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [contextList, setContextList] = useState<ContextItem[]>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Load state from localStorage on component mount
    useEffect(() => {
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (savedState) {
                const parsedState: AssistantState = JSON.parse(savedState);
                setChatBlocks(parsedState.chatBlocks || []);
                setMessageText(parsedState.messageText || '');
                setIsLoading(parsedState.isLoading || false);
                setContextList(parsedState.contextList || []);
            }
        } catch (error) {
            console.error('Error loading state from localStorage:', error);
        }
    }, []);

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
        // Clear localStorage
        localStorage.removeItem(STORAGE_KEY);
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
            
            // Update state with user message
            const newContextList = [...contextList, contextItem];
            const newChatBlocks = [...chatBlocks, userBlock];
            
            setContextList(newContextList);
            setChatBlocks(newChatBlocks);
            setMessageText('');
            setIsLoading(true);
            
            // Save state with user message
            const stateWithUserMessage: AssistantState = {
                chatBlocks: newChatBlocks,
                messageText: '',
                isLoading: true,
                contextList: newContextList
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithUserMessage));

            try {
                const data = await chatService.sendMessage({
                    userPrompt: messageText.trim(),
                    context: contextList
                });
                
                console.log('Backend response:', data);
                
                // Update state with response
                const finalContextList = [...newContextList, ...data.response.context];
                const finalChatBlocks = [...newChatBlocks, ...data.response.blocks];
                
                setContextList(finalContextList);
                setChatBlocks(finalChatBlocks);
                
                // Save state with service response
                const stateWithResponse: AssistantState = {
                    chatBlocks: finalChatBlocks,
                    messageText: '',
                    isLoading: false,
                    contextList: finalContextList
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithResponse));
                
            } catch (error) {
                console.error('Error calling backend:', error);
                
                const errorBlock: ChatBlock = {
                    type: 'p',
                    contents: ['Sorry, I encountered an error while processing your request. Please try again.'],
                    role: 'assistant'
                };
                
                const finalChatBlocks = [...newChatBlocks, errorBlock];
                setChatBlocks(finalChatBlocks);
                
                // Save state with error
                const stateWithError: AssistantState = {
                    chatBlocks: finalChatBlocks,
                    messageText: '',
                    isLoading: false,
                    contextList: newContextList
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithError));
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

    // Auto-scroll to bottom when chat blocks change
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatBlocks, isLoading]);

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

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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