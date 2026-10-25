from __future__ import annotations

from .base import OLTConnector


class HuaweiOLTConnector(OLTConnector):
    vendor = "huawei"


class ZTEOLTConnector(OLTConnector):
    vendor = "zte"


class VSOLOLTConnector(OLTConnector):
    vendor = "vsol"


class BDCOMOLTConnector(OLTConnector):
    vendor = "bdcom"
