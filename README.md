# 🏠 Habita

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

| Name | Role (Sprint 0) | GitHub | Other Links |
|------|------------------|--------|--------------|
| Mavis Liu | Product Owner | [@meiivis](https://github.com/meiivis) | [LinkedIn](https://www.linkedin.com/in/mavisliuisme/) |
| Steven Oluwabusi | Scrum Master | [@St12t](https://github.com/St12t) |  |
| Bilbo Lam | Developer | [@bilbo](https://github.com/BilboLam) |  |
| Tawhid Zaman | Developer | [@TawhidZGit](https://github.com/TawhidZGit) |  |
| Buki Seid | Developer | [@teammate5](https://github.com/dibukseid) |  |

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

# Start the Express server on http://localhost:3000
npm start

# Run mocha/chai unit tests with c8 coverage
npm test
```

Key routes currently implemented with mock JSON data:

- `GET /api/health` – Lightweight status check for monitoring.
- `GET /api/notifications` / `POST /api/notifications` / `PATCH /api/notifications/:id/read` – Notification feed used by the Notifications page and global badges.
- `GET /api/notifications/summary` / `GET /api/notifications/channels` – Aggregated counts + metadata for notification widgets.
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

The Chat page and Notifications page consume the Express API above. Home/Tasks/Bills currently rely on local mock data (per sprint plan) but already route users to backend-backed chat threads from those contexts.

### Sprint Requirements At A Glance

Per [`instructions-2-back-end.md`](./instructions-2-back-end.md), this repo currently satisfies:

- ✅ All server logic is implemented with Express.js (`back-end/app.js`) and serves both static assets and dynamic JSON routes.
- ✅ Every dynamic route returns mock JSON (chat + notifications) without exposing real credentials. Any secrets belong in `.env` files that stay out of version control.
- ✅ Front-end pages now fetch data exclusively from the Express API (notifications, chat, tasks/bills integrations), and form submits hit real `POST` endpoints.
- ✅ Back-end tests use **mocha + chai** with **c8** coverage (`npm test` in `/back-end`), exceeding the 10% coverage floor.
- ✅ This README documents the full setup so anyone can install dependencies, start the server, and run tests locally.

Please keep following the feature-branch workflow and never commit API keys or production credentials—share required `.env` files privately via the team’s messenger per the course policy.


## 📚 Additional Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) – Team workflow and contribution guidelines  
- [UX-DESIGN.md](./UX-DESIGN.md) – Wireframes, app map, and design documents  
- [Product Backlog](https://github.com/agile-students-fall2025/4-final-habita/issues) – Current project tasks and user stories  
- [Sprint Board](https://github.com/orgs/agile-students-fall2025/projects) – Active Scrum task board



---

© 2025 Habita Team 
