# 🤝 Contributing to Habita

Thank you for your interest in contributing to **Habita**!  
This document explains how our team collaborates, the standards we follow, and how to set up your environment to work on this project.

---

## 🧭 Team Values & Norms

Habita’s success depends on teamwork, communication, and accountability.  
These are the norms all contributors agree to follow:

- Be respectful, supportive, and proactive in communication.  
- Use Discord as the main channel for updates and coordination.  
- Respond to team messages within 24 hours during active sprints.  
- Participate in daily standups (virtual or written).  
- Seek help early when blocked.  
- Deliver work on time and notify the Scrum Master of blockers.

Conflict resolution:
- Disagreements are discussed openly within the team meeting.
- If unresolved, the Scrum Master escalates to the Product Owner.

---

## 🕓 Sprint Cadence

- Each sprint lasts **2 weeks**.  
- Standups occur **3 times per week** (~15 minutes).  
- Members share progress, plans, and blockers.  
- No one “covers” for a missing member’s participation.

---

## 💻 Coding Standards

- Use **VS Code** and **Prettier** for consistent formatting.  
- Keep commits **small and descriptive** (`feat: add task creation`, `fix: bill form validation`).  
- All code must pass linting and peer review before merging.  
- Always push working code — fix any build breaks immediately.  
- Write clear, readable code with meaningful variable and function names.  
- Delete unused or commented-out code.  
- Write unit tests for critical functions as the project matures.

---

## 🔀 Git Workflow

We use the **Feature Branch Workflow**:

1. Pull the latest version of `main`:
   ```bash
   git pull origin main
   ```
2. Create a new local branch:
   ```bash
   git checkout -b <branch-name>
   ```
3. Make and commit your changes:
   ```bash
   git add .
   git commit -m "short description of change"
   ```
4. Push the branch and open a Pull Request (PR):
   ```bash
   git push origin feature/<short-description>
   ```
5. Another teammate reviews the PR and merges it once approved.

### Create a New Local Branch

With the latest code downloaded, create a new branch and “check it out”.  
The name of the branch should refer to the **User Story**, **Task**, or **Spike** associated with the changes that will be made.

Example for a Task with identification number 9 belonging to a User Story with identification number 13:
```bash
git checkout -b user-story/13/task/9/implement-user-login
```

Example for Spike with identification number 6:
```bash
git checkout -b spike/6/install-mongo-db-locally
```

---

## ⚙️ Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/agile-students-fall2025/4-final-habita.git
   cd 4-final-habita
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Visit the app locally at `http://localhost:3000` (default port).

---

## 🧪 Building and Testing

(Will be expanded as development progresses)

To run tests:
```bash
npm test
```

---

## 🧱 How to Contribute

We welcome contributions in the form of:
- Reporting bugs via GitHub Issues (`bug` label)
- Suggesting enhancements (`enhancement` label)
- Submitting new features or documentation improvements through PRs

Each PR must:
- Reference a GitHub Issue (e.g., “Fixes #12”)
- Pass all automated tests and peer reviews
- Follow the Git workflow described above

---

## 🧠 Code of Conduct

All contributors must follow these principles:
- Treat others with respect and kindness.
- Be collaborative and constructive.
- Credit others’ work where due.
- Maintain a professional tone in all communications.

---

© 2025 Habita Team
