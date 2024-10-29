const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv").config();
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 7000;
const DB_URL = process.env.DB;

// Todo DB and Collection
const TODO_DB_NAME = "todo_db";
const TODO_COLLECTION_NAME = "todos";

// Catalog DB and Collection
const CATALOG_DB_NAME = "catalog_db";
const CATALOG_COLLECTION_NAME = "projects";

app.use(cors({ origin: "*" }));
app.use(express.json());

let todoCollection;
let catalogCollection;

// MongoDB client setup
async function connectToDb() {
  if (!todoCollection || !catalogCollection) {
    const client = new MongoClient(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    todoCollection = client.db(TODO_DB_NAME).collection(TODO_COLLECTION_NAME);
    catalogCollection = client.db(CATALOG_DB_NAME).collection(CATALOG_COLLECTION_NAME);
  }
  return { todoCollection, catalogCollection };
}

// Todo Routes
app.get("/todo/get-todos", async (req, res) => {
  try {
    const { todoCollection } = await connectToDb();
    const todos = await todoCollection.find({}).toArray();
    res.json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/todo/add-todo", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "Todo text is required" });

  try {
    const { todoCollection } = await connectToDb();
    const result = await todoCollection.insertOne({ text, completed: false });
    res.status(201).json({ _id: result.insertedId, text, completed: false });
  } catch (error) {
    console.error("Error adding todo:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/todo/delete-todo/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { todoCollection } = await connectToDb();
    const result = await todoCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.status(200).json({ message: "Todo deleted" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/todo/toggle-todo/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { todoCollection } = await connectToDb();
    const todo = await todoCollection.findOne({ _id: new ObjectId(id) });
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    const updatedResult = await todoCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { completed: !todo.completed } }
    );

    res.status(200).json({ message: "Todo status toggled", completed: !todo.completed });
  } catch (error) {
    console.error("Error toggling todo status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Catalog Routes
app.get("/catalog/get-projects", async (req, res) => {
  try {
    const { catalogCollection } = await connectToDb();
    const projects = await catalogCollection.find({}).toArray();
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST add a new catalog entry
app.post("/catalog/add-project", async (req, res) => {
  const { name, githubLink, reportLink, mediaLink, owner } = req.body; // Ensure consistency with frontend
  if (!name || !githubLink || !owner) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    const { catalogCollection } = await connectToDb();
    const newProject = { name, githubLink, reportLink, mediaLink, owner }; // Ensure the correct variable name
    const result = await catalogCollection.insertOne(newProject);
    res.status(201).json({ _id: result.insertedId, ...newProject });
  } catch (error) {
    console.error("Error adding project:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE a catalog entry by ID
app.delete("/catalog/delete-project/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { catalogCollection } = await connectToDb();
    const result = await catalogCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ message: "Project deleted" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
