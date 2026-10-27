# TaskSphere — Full-Stack Workflow & Task Management Web Application

A full-stack, responsive web application built with **Node.js, Express, MongoDB (Mongoose), Vanilla JavaScript (ES6+), HTML5, and Tailwind CSS**.

Built by **Y. Mani Sasank Reddy** (*B.Tech CSE - Chaitanya Deemed to be University*).

---

## 🌟 Key Features

1. **Responsive Frontend UI**:
   - Modern, mobile-first design built with semantic HTML5 and Tailwind CSS.
   - Dynamic DOM manipulation with vanilla JavaScript (zero heavy frontend bundle overhead).
   - Real-time search by task title or description with input debouncing.
   - Multi-attribute filtering (Status, Category, Priority).
   - Live dashboard cards displaying metrics (Total, Completed, Pending, In Progress).

2. **Server-Side RESTful API (Node.js & Express)**:
   - Structured routing following REST conventions:
     - `GET /api/tasks` — List all tasks with search/filtering query parameters.
     - `POST /api/tasks` — Validate input and create new tasks.
     - `PUT /api/tasks/:id` — Update task details or toggle workflow status.
     - `DELETE /api/tasks/:id` — Remove tasks.
     - `GET /api/stats` — Aggregate metrics for analytics cards.
     - `GET /api/health` — System status and active database connection indicator.

3. **Database Integration (MongoDB & Mongoose)**:
   - Full data schema modeling using Mongoose.
   - Graceful fallback: Automatically switches to an in-memory/JSON storage engine if MongoDB is not locally running, ensuring 100% out-of-the-box zero-setup execution.

4. **Testing & QA**:
   - Built-in automated integration test suite (`test-api.js`) verifying HTTP status codes (200, 201), JSON payloads, and full CRUD cycles.

---

## 🚀 Getting Started

### 1. Installation
Open a terminal inside the project directory and install dependencies:
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
The server will start at: `http://localhost:3000`

Open `http://localhost:3000` in your browser to interact with the live application.

### 3. Run Integration Tests
In a separate terminal while the server is running:
```bash
npm test
```

---

## 📂 Project Architecture
```
tasksphere-app/
│
├── public/                  # Frontend static files
│   ├── index.html           # Semantic HTML5 & responsive Tailwind layout
│   ├── style.css            # Custom CSS animations and scrollbar styling
│   └── app.js               # Client-side JavaScript (Fetch API, DOM events, UI)
│
├── data/                    # Local storage backup (auto-generated)
│   └── tasks.json
│
├── server.js                # Express server, REST endpoints, MongoDB Mongoose schema
├── test-api.js              # Automated integration testing suite
├── package.json             # NPM dependencies & scripts
└── README.md                # Project documentation
```

---

## 🐙 How to Push this Project to Your GitHub

To upload this project to your GitHub profile (`manisasank`):

1. Go to [github.com/new](https://github.com/new) and create a new repository named `tasksphere`.
2. In your terminal inside `tasksphere-app`:
```bash
git init
git add .
git commit -m "Initial commit: Full stack TaskSphere web app with Node.js, Express, MongoDB, and JavaScript"
git branch -M main
git remote add origin https://github.com/manisasank/tasksphere.git
git push -u origin main
```
