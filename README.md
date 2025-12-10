# 🏠 Habita

[![Continuous Integration](https://github.com/agile-students-fall2025/4-final-habita/actions/workflows/ci.yml/badge.svg)](https://github.com/agile-students-fall2025/4-final-habita/actions/workflows/ci.yml)

[![Continuous Deployment](https://github.com/agile-students-fall2025/4-final-habita/actions/workflows/cd.yml/badge.svg)](https://github.com/agile-students-fall2025/4-final-habita/actions/workflows/cd.yml)

**Habita** is an AI-assisted roommate management app designed to make shared living simpler, more organized, and more connected.  
It helps roommates manage **tasks**, **bills**, and **communication** all in one place, reducing daily friction and improving collaboration at home.

---

## 🌟 Product Vision Statement

> *Habita helps roommates coordinate household responsibilities — from chores to bills — through a single intuitive platform that automates reminders, keeps track of shared duties, and strengthens communication within shared living spaces.*

The **Minimum Viable Product (MVP)** focuses on three core goals:
1. Allow roommates to **create, assign, and track household tasks**.
2. Enable **bill and payment tracking** among roommates.
3. Support **simple communication and reminders** through a shared dashboard.

---

## 👩‍💻 Core Team Members

| Name | Role | GitHub | Other Links |
|------|------------------|--------|--------------|
| Mavis Liu | Developer | [@meiivis](https://github.com/meiivis) | [LinkedIn](https://www.linkedin.com/in/mavisliuisme/) |
| Steven Oluwabusi | Developer | [@St12t](https://github.com/St12t) |  |
| Bilbo Lam | Developer | [@BilboLam](https://github.com/BilboLam) |  |
| Tawhid Zaman | Developer | [@TawhidZGit](https://github.com/TawhidZGit) |  |
| Buki Seid | Developer | [@dibukseid](https://github.com/dibukseid) |  |

---

## 🧩 How Habita Came to Be

The idea for Habita originated during brainstorming sessions about how technology can improve **daily collaboration in shared spaces**.  
Our team noticed that many roommates face frustration over unpaid bills, forgotten chores, and miscommunication.  
We wanted to create an app that combines **organization tools** with **social features** — helping users maintain balance between accountability and friendliness.

Habita was conceptualized as part of the **Agile Software Engineering course at NYU**, where our team applies Scrum principles to plan, design, and implement the app collaboratively over multiple sprints.

---

## 🤝 Contributing

We welcome feedback and contributions!  
To learn about our team workflow, coding guidelines, and setup process, please read our [CONTRIBUTING.md](./CONTRIBUTING.md).

If you’d like to suggest improvements or report issues, please open a new Issue on GitHub and tag it appropriately (`user story`, `task`, or `spike`).

---

## 🛠️ Build & Test Instructions

### Back-End (Express API)

```bash
# Install dependencies the first time
cd back-end
npm install

# Start the Express server on http://localhost:4000
npm start

# Run mocha/chai unit tests with c8 coverage
npm test
```

Create a `back-end/.env` (see `back-end/.env.example`) with your `MONGODB_URI`, `JWT_SECRET`, optional `PORT`, and `JWT_EXP_DAYS`. The server loads these via `dotenv` at startup.

Key routes currently implemented with mock JSON data:

- `GET /api/health` – Lightweight status check for monitoring.
- `GET /api/notifications` / `POST /api/notifications` / `PATCH /api/notifications/:id/read` – Notification feed used by the Notifications page and global badges.
- `GET /api/notifications/summary` / `GET /api/notifications/channels` – Aggregated counts + metadata for notification widgets.
- `GET /api/home/summary` – Returns the personalized dashboard snapshot powering the Home page (tasks/bills stats, upcoming lists, calendar events).
- `GET /api/chat/threads` – Returns chat thread summaries (used by the Chat dashboard and sidebars on Tasks/Bills).
- `POST /api/chat/threads` – Ensures a thread exists for a given `contextType/contextId` pair (task/bill chats are created on the fly).
- `GET /api/chat/messages?threadId=house` (or `?contextType=task&contextId=42`) – Fetches message history, creating a thread if needed.
- `POST /api/chat/messages` – Accepts `sender`, `text`, optional `contextType`, `contextId`, and `participants` to append a new chat message.
- `PATCH /api/chat/threads/:id/read` – Marks a thread as read so unread counts on the Chat UI stay in sync.

These endpoints return deterministic mock JSON so the React app can demo a “live” backend without any real credentials. Static requests to `/` still serve the HTML hand-off page from `back-end/public/index.html`.

### Front-End (React)

```bash
# Install dependencies
cd front-end
npm install

# Start the dev server (proxied to Express on port 3000)
npm start

# Build for production
npm run build
```

### Docker (optional)

- Copy env templates: `cp back-end/.env.example back-end/.env` and `cp front-end/.env.example front-end/.env`, then fill in values (e.g., `MONGODB_URI`, `JWT_SECRET`, `REACT_APP_API_URL`).
- Build and run both services together: `docker compose up --build`.
- Access points (current compose defaults): front-end at http://localhost:3001, back-end at http://localhost:4001.
- Override the API base at build time if needed: `REACT_APP_API_URL=http://localhost:4001/api docker compose build front-end`.



## 📚 Additional Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) – Team workflow and contribution guidelines  
- [UX-DESIGN.md](./UX-DESIGN.md) – Wireframes, app map, and design documents  
- [Product Backlog](https://github.com/agile-students-fall2025/4-final-habita/issues) – Current project tasks and user stories  
- [Sprint Board](https://github.com/orgs/agile-students-fall2025/projects) – Active Scrum task board

## Deployed Website Link
[64.225.2.238](64.225.2.238)

---

© 2025 Habita Team 
