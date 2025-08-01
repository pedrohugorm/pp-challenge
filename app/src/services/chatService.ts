import { ChatBlock } from '@/components/ChatBalloon';
import { getBackendUrl } from '@/utils/getBackendUrl';

export interface ChatRequest {
    userPrompt: string;
    context: ContextItem[];
}

export interface MedicationReference {
    id: string;
    name: string;
    slug: string;
}

export interface ToolCall {
    id: string;
    type: string;
    function: {
        name: string;
        arguments: string;
    };
}

export interface ContextItem {
    role: string;
    content: string | null;
    tool_calls?: ToolCall[];
    refusal?: string | null;
}

export interface ChatResponse {
    response: {
        blocks: ChatBlock[];
        context: ContextItem[];
    };
}

export const chatService = {
    async sendMessage(request: ChatRequest): Promise<ChatResponse> {
        const response = await fetch(`${getBackendUrl()}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }
}; 