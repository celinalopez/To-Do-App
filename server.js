import express from "express";
import fs from "fs";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); // Para leer datos de formularios

const FILE_PATH = "./tasks.json";

// Clase Task
class Task {
    constructor(id, etiqueta, descripcion, fecha_creacion, fecha_limite, completado = false) {
        this.id = id;
        this.etiqueta = etiqueta;
        this.descripcion = descripcion;
        this.fecha_creacion = fecha_creacion;
        this.fecha_limite = fecha_limite;
        this.completado = completado;
    }
}

// Función para leer tareas
const readTasks = () => {
    try {
        const data = fs.readFileSync(FILE_PATH, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        return { tasks: [] };
    }
};

// Función para escribir tareas
const writeTasks = (data) => {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
};

// Página principal con botones
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API de Tareas</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                button { padding: 10px 20px; margin: 10px; font-size: 16px; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>Bienvenido a la API de Tareas </h1>
            <p>Selecciona una acción:</p>
            <button onclick="window.location.href='/tasks'">Ver Tareas</button>
            <button onclick="window.location.href='/add-task'">Agregar Tarea</button>
            <button onclick="window.location.href='/update-task'">Editar Tarea</button>
            <button onclick="window.location.href='/delete-task'">Eliminar Tarea</button>
        </body>
        </html>
    `);
});

// GET
app.get("/tasks", (req, res) => {
    const data = readTasks();
    res.json(data.tasks);
});

// Página para agregar tarea (Formulario)
app.get("/add-task", (req, res) => {
    res.send(`
        <h2>Agregar Nueva Tarea</h2>
        <form action="/tasks" method="post">
            <input type="text" name="etiqueta" placeholder="Etiqueta" required><br>
            <input type="text" name="descripcion" placeholder="Descripción" required><br>
            <input type="date" name="fecha_limite" required><br>
            <button type="submit">Agregar</button>
        </form>
        <a href="/">Volver</a>
    `);
});

// POST
app.post("/tasks", (req, res) => {
    const data = readTasks();
    const { etiqueta, descripcion, fecha_limite } = req.body;

    if (!etiqueta || !descripcion || !fecha_limite) {
        return res.status(400).send("Todos los campos son obligatorios.");
    }

    const newTask = new Task(
        data.tasks.length + 1,
        etiqueta,
        descripcion,
        new Date().toISOString().split("T")[0], // Fecha de creación automática
        fecha_limite
    );

    data.tasks.push(newTask);
    writeTasks(data);

    res.send(`
        <h2>Tarea Agregada</h2>
        <p>Etiqueta: ${newTask.etiqueta}</p>
        <p>Descripción: ${newTask.descripcion}</p>
        <p>Fecha límite: ${newTask.fecha_limite}</p>
        <a href="/">Volver al inicio</a>
    `);
});

// Página para actualizar tarea
app.get("/update-task", (req, res) => {
    res.send(`
        <h2>Actualizar Tarea</h2>
        <form action="/tasks/update" method="post">
            <input type="number" name="id" placeholder="ID de la tarea" required><br>
            <input type="text" name="descripcion" placeholder="Nueva Descripción"><br>
            <input type="date" name="fecha_limite"><br>
            <button type="submit">Actualizar</button>
        </form>
        <a href="/">Volver</a>
    `);
});

// Página para eliminar tarea
app.get("/delete-task", (req, res) => {
    res.send(`
        <h2>Eliminar Tarea</h2>
        <form action="/tasks/delete" method="post">
            <input type="number" name="id" placeholder="ID de la tarea" required><br>
            <button type="submit">Eliminar</button>
        </form>
        <a href="/">Volver</a>
    `);
});

// 📌 Iniciar el servidor
app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));
