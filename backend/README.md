# Redline Market Backend

Spring Boot + Postgres backend for markets, trades, wallet balances, and real-time chat.

## Requirements
- Java 17

## Configure
Set these env vars (defaults shown):

```
DATABASE_URL=jdbc:h2:mem:redline;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
DATABASE_USER=sa
DATABASE_PASSWORD=
FRONTEND_ORIGIN=http://localhost:3000
SECURITY_ENABLED=false
FIREBASE_ISSUER_URI=
```

If you want Firebase auth validation, set:

```
SECURITY_ENABLED=true
FIREBASE_ISSUER_URI=https://securetoken.google.com/YOUR_FIREBASE_PROJECT_ID
```

## Run

```
./gradlew bootRun
```

Server starts on `http://localhost:8081`.

H2 console is available at `http://localhost:8081/h2`.

## REST endpoints

- `GET /api/markets`
- `GET /api/markets/{marketId}`
- `POST /api/markets/{marketId}/trades`
- `GET /api/markets/{marketId}/trades`
- `GET /api/markets/{marketId}/chat`
- `GET /api/users/{email}`
- `POST /api/users/{email}/topup`

### Trade request body

```
{
  "email": "user@example.com",
  "displayName": "GP Racer",
  "side": "YES",
  "shares": 5
}
```

## WebSocket chat

- SockJS endpoint: `/ws`
- Send: `/app/markets/{marketId}/chat`
- Subscribe: `/topic/markets/{marketId}/chat`

Message payload:

```
{
  "userName": "TurboBear",
  "message": "Safety car probability feels underpriced."
}
```
