from __future__ import annotations

from ..base import DeviceConnector


class OLTConnector(DeviceConnector):
    device_types = ("olt",)

    def capabilities(self) -> list[str]:
        return ["health", "pon", "onu", "optical"]
