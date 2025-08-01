from aiolimiter import AsyncLimiter
from asyncio_throttle import Throttler

# Store rate limiters per model
_rate_limiters = {
    "gpt-4o": Throttler(rate_limit=100, period=60),
    "gpt-4o-mini": Throttler(rate_limit=100, period=60),
    "gpt-4": Throttler(rate_limit=100, period=60)
}

# Token limits per model (tokens per minute)
_model_token_limits = {
    "gpt-4o": AsyncLimiter(max_rate=30000, time_period=60),
    "gpt-4o-mini": AsyncLimiter(max_rate=30000, time_period=60),
    "gpt-4": AsyncLimiter(max_rate=30000, time_period=60)
}


def get_rate_limiter(model: str) -> Throttler:
    if model not in _rate_limiters:
        raise ValueError(f"Rate limiter for model {model} not found")

    return _rate_limiters[model]

def get_token_bucket_rate_limiter(model: str) -> AsyncLimiter:
    if model not in _model_token_limits:
        raise ValueError(f"Rate limiter for model {model} not found")

    return _model_token_limits[model]
