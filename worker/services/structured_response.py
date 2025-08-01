from pydantic import BaseModel
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam
from typing import Type
import os

from .rate_limiter import get_rate_limiter

async def get_structured_response(schema_class: Type[BaseModel], system_prompt: str, user_prompt: str):
    
    model = "gpt-4o-mini"

    rate_limiter = get_rate_limiter(model)

    async with rate_limiter:
        client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )

        messages = [
            ChatCompletionSystemMessageParam(role="system", content=system_prompt),
            ChatCompletionUserMessageParam(role="user", content=user_prompt),
        ]

        completion = await client.chat.completions.parse(
            model=model,
            messages=messages,
            response_format=schema_class,
        )

        parsed_result = completion.choices[0].message.parsed

        return parsed_result