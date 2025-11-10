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

### Back-End (Express + Discord-style notifications)

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
- `GET /api/notifications` – Discord-style notification feed with query filters like `?unread=true&mentions=You`.
- `GET /api/notifications/summary` – Aggregated unread counts and highlights per channel.
- `GET /api/notifications/channels` – Metadata for the notification channels (Chore Board, Bills HQ, House Chat, etc.).
- `POST /api/notifications` – Accepts `title`, `body`, `channelId`, and optional metadata to mock new alerts.
- `PATCH /api/notifications/:id/read` – Marks a notification as read/unread for demos of acknowledgement flows.

All routes are powered by Express.js and respond with deterministic mock JSON so the front-end can integrate without a live database. Static requests to `/` serve a small HTML hand-off page from `back-end/public/index.html`.


## 📚 Additional Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) – Team workflow and contribution guidelines  
- [UX-DESIGN.md](./UX-DESIGN.md) – Wireframes, app map, and design documents  
- [Product Backlog](https://github.com/agile-students-fall2025/4-final-habita/issues) – Current project tasks and user stories  
- [Sprint Board](https://github.com/orgs/agile-students-fall2025/projects) – Active Scrum task board



---

© 2025 Habita Team 


