"""Cliente Zeep para el servicio SOAP público de información de países."""

import requests
from django.conf import settings
from zeep import Client
from zeep.transports import Transport


class SoapServiceError(Exception):
    """Indica que el WSDL o el servicio SOAP remoto no pudo atender la llamada."""


def country_info(code: str) -> dict:
    session = requests.Session()
    transport = Transport(session=session, timeout=8, operation_timeout=8)
    try:
        client = Client(wsdl=settings.SOAP_COUNTRY_WSDL, transport=transport)
        result = client.service.FullCountryInfo(sCountryISOCode=code)
        if not result:
            return {}
        return {
            "code": str(result["sISOCode"]),
            "country": str(result["sName"]),
            "capital": str(result["sCapitalCity"] or ""),
            "currency_code": str(result["sCurrencyISOCode"] or ""),
            "phone_code": str(result["sPhoneCode"] or ""),
        }
    except Exception as exc:
        raise SoapServiceError from exc
    finally:
        session.close()
