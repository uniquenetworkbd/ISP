from __future__ import annotations

from .manager import ConnectorManager
from .mikrotik import MikroTikConnector
from .mock import MockConnector
from .olt.adapters import BDCOMOLTConnector, HuaweiOLTConnector, VSOLOLTConnector, ZTEOLTConnector


def build_default_connector_manager() -> ConnectorManager:
    manager = ConnectorManager()
    for connector in (
        MockConnector(),
        MikroTikConnector(),
        HuaweiOLTConnector(),
        ZTEOLTConnector(),
        VSOLOLTConnector(),
        BDCOMOLTConnector(),
    ):
        manager.register(connector)
    return manager
