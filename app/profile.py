from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

PROFILE_PATH = Path(__file__).with_name("profile.yml")


@lru_cache
def load_profile() -> dict[str, Any]:
    """Содержимое визитки из profile.yml, чтобы правка текста не требовала правки кода."""
    with PROFILE_PATH.open(encoding="utf-8") as f:
        return yaml.safe_load(f)["profile"]
