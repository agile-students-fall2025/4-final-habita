# Habita Backend (Express, Mocked APIs)

## Setup

```bash
cd back-end
npm install
```

## Run

```bash
# Start dev server (nodemon) on http://localhost:4000
npm run dev

# Or start without reload
npm start
```

Environment variables (optional):

```bash
PORT=4000
```

## Routes

- `GET /health` → `{ status: 'ok' }`
- `POST /api/groups` → Create a group (mock)

Request body:

```json
{
  "name": "Room 4A",
  "description": "optional",
  "members": ["alice@example.com", "bob"]
}
```

Response `201`:

```json
{
  "group": {
    "id": "<generated>",
    "name": "Room 4A",
    "description": "",
    "members": [],
    "createdAt": "2025-10-29T00:00:00.000Z"
  }
}
```

## Testing & Coverage

```bash
npm test
npm run coverage
```

## Notes

- All data is mocked; no database is used in this sprint.
- Do not commit secrets. Use `.env` locally if needed.




