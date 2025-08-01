import { Injectable } from '@nestjs/common';

@Injectable()
export class ToolsService {
  getAvailableTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get weather information for a location',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'The location to get weather for',
              },
            },
            required: ['location'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'calculate',
          description: 'Perform mathematical calculations',
          parameters: {
            type: 'object',
            properties: {
              expression: {
                type: 'string',
                description: 'Mathematical expression to evaluate',
              },
            },
            required: ['expression'],
          },
        },
      },
    ];
  }

  async executeTool(name: string, args: any): Promise<string> {
    switch (name) {
      case 'get_weather':
        return `Weather in ${args.location}: Sunny, 72°F`;

      case 'calculate':
        try {
          // Simple math evaluation (be careful with eval in production!)
          const result = eval(args.expression);
          return `Result: ${result}`;
        } catch (error) {
          return `Error: ${error.message}`;
        }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}