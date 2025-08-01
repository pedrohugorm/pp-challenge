import { ChatCompletionMessage } from 'openai/resources/chat/completions/completions';

export class ChatRequestDto {
  userPrompt: string;
  context: ChatCompletionMessage[];
}
