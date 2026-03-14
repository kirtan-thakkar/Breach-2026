from abc import ABC, abstractmethod
from typing import Optional

class MessagingService(ABC):
    @abstractmethod
    async def send_message(self, target: str, content: dict, tracking_id: str):
        """Send a simulation message."""
        pass

    @abstractmethod
    def generate_tracking_link(self, tracking_id: str) -> str:
        """Generate a unique tracking link."""
        return ""

    @abstractmethod
    async def log_delivery(self, tracking_id: str, success: bool, error: Optional[str] = None):
        """Log the delivery status in the database."""
        pass
