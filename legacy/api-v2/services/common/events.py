from dataclasses import dataclass

# Tópicos (v1):
TOPIC_REQ_LIFECYCLE = "requests.lifecycle.v1"     # created/accepted/status
TOPIC_PROV_LOCATION = "providers.location.v1"     # provider location updates
TOPIC_MATCHING = "requests.matching.v1"       # offers, decisions

# Tipos de evento:
EV_REQUEST_CREATED   = "request.created"
EV_REQUEST_ACCEPTED  = "request.accepted"
EV_STATUS_CHANGED    = "request.status_changed"
EV_PROVIDER_LOCATION = "provider.location"
EV_REQUEST_OFFERED   = "request.offered"
EV_REQUEST_PAID      = "request.paid"

@dataclass
class GeoPoint:
    lat: float
    lng: float
