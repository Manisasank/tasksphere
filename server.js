const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tasksphere';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Flag to indicate whether connected to MongoDB or local fallback store
let useMongoDB = false;

// Define Mongoose Schema & Model
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  category: { type: String, default: 'General', enum: ['General', 'Work', 'Study', 'Personal'] },
  priority: { type: String, default: 'Medium', enum: ['Low', 'Medium', 'High'] },
  status: { type: String, default: 'pending', enum: ['pending', 'in-progress', 'completed'] },
  dueDate: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const TaskModel = mongoose.model('Task', taskSchema);

// Local JSON Storage Fallback (for instant local running without MongoDB server setup)
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');
function ensureDataDir() {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const initialTasks = [
      {
        id: '1',
        title: 'Review Emoolar Internship Requirements',
        description: 'Verify HTML, CSS, JavaScript, Node.js, and MongoDB match.',
        category: 'Work',
        priority: 'High',
        status: 'completed',
        dueDate: '2026-10-28',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Build Full Stack TaskSphere App',
        description: 'Implement frontend UI, Node.js REST API, and MongoDB integration.',
        category: 'Study',
        priority: 'High',
        status: 'completed',
        dueDate: '2026-10-29',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Push Project to GitHub',
        description: 'Initialize Git repo and upload source code with clean documentation.',
        category: 'Work',
        priority: 'Medium',
        status: 'pending',
        dueDate: '2026-10-30',
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialTasks, null, 2));
  }
}

function readLocalTasks() {
  ensureDataDir();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeLocalTasks(tasks) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

// Attempt MongoDB Connection with 2s timeout
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 })
  .then(() => {
    useMongoDB = true;
    console.log('✅ Connected to MongoDB successfully.');
  })
  .catch((err) => {
    useMongoDB = false;
    console.log('ℹ️  MongoDB connection not detected. Running seamlessly with local JSON store.');
    console.log('   (To use MongoDB, set MONGODB_URI in your environment or start local mongod)');
    ensureDataDir();
  });

// ==================== REST API ROUTES ====================

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    storageMode: useMongoDB ? 'MongoDB Database' : 'Local JSON Store',
    timestamp: new Date()
  });
});

// GET /api/stats - Dashboard analytics
app.get('/api/stats', async (req, res) => {
  try {
    let tasks = [];
    if (useMongoDB) {
      tasks = await TaskModel.find();
    } else {
      tasks = readLocalTasks();
    }

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;

    res.json({ total, completed, pending, inProgress });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute task statistics.' });
  }
});

// GET /api/tasks - Retrieve all tasks with optional search and filter
app.get('/api/tasks', async (req, res) => {
  try {
    const { search, status, category, priority } = req.query;

    if (useMongoDB) {
      const query = {};
      if (status && status !== 'all') query.status = status;
      if (category && category !== 'all') query.category = category;
      if (priority && priority !== 'all') query.priority = priority;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      const tasks = await TaskModel.find(query).sort({ createdAt: -1 });
      return res.json(tasks.map(t => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        createdAt: t.createdAt
      })));
    } else {
      let tasks = readLocalTasks();
      if (status && status !== 'all') tasks = tasks.filter(t => t.status === status);
      if (category && category !== 'all') tasks = tasks.filter(t => t.category === category);
      if (priority && priority !== 'all') tasks = tasks.filter(t => t.priority === priority);
      if (search) {
        const q = search.toLowerCase();
        tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
      }
      return res.json(tasks);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// POST /api/tasks - Create new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, category, priority, dueDate } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const newTaskData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'General',
      priority: priority || 'Medium',
      status: 'pending',
      dueDate: dueDate || '',
      createdAt: new Date()
    };

    if (useMongoDB) {
      const created = await TaskModel.create(newTaskData);
      return res.status(201).json({
        id: created._id.toString(),
        ...newTaskData,
        createdAt: created.createdAt
      });
    } else {
      const tasks = readLocalTasks();
      const newTask = {
        id: Date.now().toString(),
        ...newTaskData,
        createdAt: new Date().toISOString()
      };
      tasks.unshift(newTask);
      writeLocalTasks(tasks);
      return res.status(201).json(newTask);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// PUT /api/tasks/:id - Update task details or toggle status
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, status, dueDate } = req.body;

    if (useMongoDB) {
      const updatePayload = {};
      if (title !== undefined) updatePayload.title = title.trim();
      if (description !== undefined) updatePayload.description = description.trim();
      if (category !== undefined) updatePayload.category = category;
      if (priority !== undefined) updatePayload.priority = priority;
      if (status !== undefined) updatePayload.status = status;
      if (dueDate !== undefined) updatePayload.dueDate = dueDate;

      const updated = await TaskModel.findByIdAndUpdate(id, updatePayload, { new: true });
      if (!updated) {
        return res.status(404).json({ error: 'Task not found.' });
      }
      return res.json({
        id: updated._id.toString(),
        title: updated.title,
        description: updated.description,
        category: updated.category,
        priority: updated.priority,
        status: updated.status,
        dueDate: updated.dueDate,
        createdAt: updated.createdAt
      });
    } else {
      const tasks = readLocalTasks();
      const index = tasks.findIndex(t => t.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      tasks[index] = {
        ...tasks[index],
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(category !== undefined && { category }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate })
      };

      writeLocalTasks(tasks);
      return res.json(tasks[index]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// DELETE /api/tasks/:id - Remove task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (useMongoDB) {
      const deleted = await TaskModel.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Task not found.' });
      }
      return res.json({ message: 'Task deleted successfully.', id });
    } else {
      const tasks = readLocalTasks();
      const filtered = tasks.filter(t => t.id !== id);
      if (filtered.length === tasks.length) {
        return res.status(404).json({ error: 'Task not found.' });
      }
      writeLocalTasks(filtered);
      return res.json({ message: 'Task deleted successfully.', id });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 TaskSphere Server running at http://localhost:${PORT}`);
  console.log(`📦 Serving static files from ./public`);
});
