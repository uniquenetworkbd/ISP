from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class DeviceConnection:
    address: str
    username: str | None = None


class DeviceConnector(ABC):
    """Common connector contract used by MikroTik/OLT adapters."""

    @abstractmethod
    def test_connection(self, connection: DeviceConnection) -> bool:
        raise NotImplementedError

    @abstractmethod
    def collect_health(self, connection: DeviceConnection) -> dict:
        raise NotImplementedError
