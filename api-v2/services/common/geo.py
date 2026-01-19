import h3
from typing import List, Tuple

H3_RES = 8  # bom equilíbrio (≈ 0.74km entre centros)

def index(lat: float, lng: float) -> str:
    return h3.geo_to_h3(lat, lng, H3_RES)

def neighbors(h: str, k: int = 1) -> List[str]:
    return list(h3.k_ring(h, k))
