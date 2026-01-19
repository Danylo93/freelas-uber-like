from fastapi import FastAPI, Header
from fastapi.responses import JSONResponse
import os, traceback
from dotenv import load_dotenv
import httpx

load_dotenv()

PROVIDER_URL = os.getenv("PROVIDER_URL", "http://provider-service:8011").rstrip("/")
REQUEST_URL  = os.getenv("REQUEST_URL",  "http://request-service:8012").rstrip("/")
AUTH_URL     = os.getenv("AUTH_URL",     "http://auth-service:8014").rstrip("/")

app = FastAPI(title="socket-gateway")

@app.get("/healthz")
async def health():
    return {"status":"ok","service":"gateway","upstreams":{
        "provider": PROVIDER_URL, "request": REQUEST_URL, "auth": AUTH_URL
    }}

async def forward(method: str, url: str, payload: dict | None = None, headers: dict | None = None):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.request(method, url, json=payload, headers=headers)
            r.raise_for_status()
            if r.content:
                return r.json()
            return {}
    except Exception as e:
        return JSONResponse(
            status_code=502,
            content={
                "error": "upstream_failure",
                "target": url,
                "detail": str(e),
                "trace": traceback.format_exc().splitlines()[-5:],
            },
        )


@app.get("/api/providers")
async def list_providers():
    return await forward("GET", f"{PROVIDER_URL}/providers")


@app.post("/api/providers")
async def create_provider(data: dict):
    return await forward("POST", f"{PROVIDER_URL}/providers", data)


@app.put("/api/providers/{provider_id}/location")
async def update_provider_location(provider_id: str, data: dict):
    return await forward(
        "PUT", f"{PROVIDER_URL}/providers/{provider_id}/location", data
    )


@app.put("/api/providers/{provider_id}/status")
async def update_provider_status(provider_id: str, data: dict):
    return await forward(
        "PUT", f"{PROVIDER_URL}/providers/{provider_id}/status", data
    )


@app.get("/api/requests")
async def list_requests():
    return await forward("GET", f"{REQUEST_URL}/requests")


@app.post("/api/requests")
async def create_request(data: dict):
    return await forward("POST", f"{REQUEST_URL}/requests", data)


@app.put("/api/requests/{request_id}/accept")
async def accept_request(request_id: str, data: dict):
    return await forward(
        "PUT", f"{REQUEST_URL}/requests/{request_id}/accept", data
    )


@app.put("/api/requests/{request_id}/status")
async def update_request_status(request_id: str, data: dict):
    return await forward(
        "PUT", f"{REQUEST_URL}/requests/{request_id}/status", data
    )


@app.post("/api/auth/register")
async def register(data: dict):
    return await forward("POST", f"{AUTH_URL}/auth/register", data)


@app.post("/api/auth/login")
async def login(data: dict):
    return await forward("POST", f"{AUTH_URL}/auth/login", data)


@app.get("/api/auth/me")
async def me(authorization: str | None = Header(None)):
    headers = {"Authorization": authorization} if authorization else None
    return await forward("GET", f"{AUTH_URL}/auth/me", headers=headers)


# Payment & Receipt endpoints
@app.post("/api/requests/{request_id}/payment")
async def process_payment(request_id: str, data: dict):
    return await forward(
        "POST", f"{REQUEST_URL}/requests/{request_id}/payment", data
    )


@app.get("/api/requests/{request_id}/receipt")
async def get_receipt(request_id: str):
    return await forward("GET", f"{REQUEST_URL}/requests/{request_id}/receipt")


# Provider Wallet endpoints
@app.get("/api/providers/{provider_id}/wallet")
async def get_provider_wallet(provider_id: str):
    return await forward("GET", f"{PROVIDER_URL}/providers/{provider_id}/wallet")


@app.post("/api/providers/{provider_id}/withdraw")
async def provider_withdraw(provider_id: str):
    return await forward("POST", f"{PROVIDER_URL}/providers/{provider_id}/withdraw")

