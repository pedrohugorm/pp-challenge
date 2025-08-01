import tiktoken


def count_tokens(text: str, model: str = "gpt-4o") -> int:
    """
    Count tokens in text using tiktoken (offline tokenizer)
    
    Args:
        text: The text to count tokens for
        model: The model name to use for tokenization (default: gpt-4o)
        
    Returns:
        Number of tokens in the text
    """
    try:
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))
    except Exception as e:
        print(f"Error counting tokens: {e}")
        # Fallback: rough estimation (1 token ≈ 4 characters for English text)
        return len(text) // 4 