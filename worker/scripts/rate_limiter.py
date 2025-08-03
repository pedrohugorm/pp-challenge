from asyncio_throttle import Throttler

# Store rate limiters per model
_rate_limiters = {
    "gpt-4o": Throttler(rate_limit=100, period=60),
    "gpt-4o-mini": Throttler(rate_limit=100, period=60),
    "gpt-4": Throttler(rate_limit=100, period=60)
}


def get_rate_limiter(model: str) -> Throttler:
    if model not in _rate_limiters:
        raise ValueError(f"Rate limiter for model {model} not found")

    return _rate_limiters[model]
