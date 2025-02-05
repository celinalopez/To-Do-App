import express from "express";
import fs from "fs";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); // Para leer datos de formularios

const FILE_PATH = "./tasks.json";

// 📌 Clase Task
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

// 📌 Leer tareas desde JSON
const readTasks = () => {
    try {
        const data = fs.readFileSync(FILE_PATH, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        return { tasks: [] };
    }
};

// 📌 Guardar tareas en JSON
const writeTasks = (data) => {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
};

// 📌 Página principal
app.get("/", (req, res) => {
    res.send(`
        <h1>Bienvenido a la API de Tareas 📝</h1>
        <button onclick="window.location.href='/tasks'">📋 Ver Tareas</button>
        <button onclick="window.location.href='/add-task'">➕ Agregar Tarea</button>
        <button onclick="window.location.href='/update-task'">✏️ Editar Tarea</button>
        <button onclick="window.location.href='/delete-task'">🗑️ Eliminar Tarea</button>
    `);
});

// 📌 GET: Ver tareas organizadas por etiqueta y fecha límite
app.get("/tasks", (req, res) => {
    const data = readTasks();

    if (data.tasks.length === 0) {
        return res.send("<h2>No hay tareas registradas.</h2><a href='/'>🔙 Volver</a>");
    }

    // 📌 Organizar tareas por etiqueta
    let groupedTasks = {};
    data.tasks.forEach(task => {
        if (!groupedTasks[task.etiqueta]) {
            groupedTasks[task.etiqueta] = [];
        }
        groupedTasks[task.etiqueta].push(task);
    });

    // 📌 Generar HTML con botones de completar solo si no está completada
    let taskHtml = "<h1>Lista de Tareas 📋</h1>";
    for (let etiqueta in groupedTasks) {
        taskHtml += `<h2>${etiqueta}</h2><ul>`;
        groupedTasks[etiqueta].forEach(task => {
            taskHtml += `
                <li>
                    <b>${task.descripcion}</b> (Vence: ${task.fecha_limite}) 
                    ${task.completado ? "✅ Completada" : ""}
                    ${task.completado ? "" : `
                        <form action="/tasks/complete/${task.id}" method="post" style="display:inline;">
                            <button type="submit">✔ Completar</button>
                        </form>
                    `}
                </li>
            `;
        });
        taskHtml += "</ul>";
    }

    taskHtml += `<a href='/'>🔙 Volver</a>`;

    res.send(taskHtml);
});

// 📌 POST: Marcar tarea como completada
app.post("/tasks/complete/:id", (req, res) => {
    const data = readTasks();
    const id = parseInt(req.params.id);
    const taskIndex = data.tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
        return res.status(404).send("<h2>Tarea no encontrada.</h2><a href='/tasks'>🔙 Volver</a>");
    }

    data.tasks[taskIndex].completado = true;
    writeTasks(data);
    
    res.redirect("/tasks"); // Redirigir de nuevo a la lista de tareas
});

// 📌 GET: Formulario para agregar tarea
app.get("/add-task", (req, res) => {
    res.send(`
        <h2>Agregar Nueva Tarea</h2>
        <form action="/tasks" method="post">
            <input type="text" name="etiqueta" placeholder="Etiqueta" required><br>
            <input type="text" name="descripcion" placeholder="Descripción" required><br>
            <input type="date" name="fecha_limite" required><br>
            <button type="submit">Agregar</button>
        </form>
        <a href="/">🔙 Volver</a>
    `);
});

// 📌 POST: Agregar nueva tarea
app.post("/tasks", (req, res) => {
    const data = readTasks();
    const { etiqueta, descripcion, fecha_limite } = req.body;

    if (!etiqueta || !descripcion || !fecha_limite) {
        return res.status(400).send("<h2>Todos los campos son obligatorios.</h2><a href='/add-task'>🔙 Volver</a>");
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
    res.redirect("/tasks");
});

// 📌 GET: Formulario para actualizar tarea
app.get("/update-task", (req, res) => {
    res.send(`
        <h2>Actualizar Tarea</h2>
        <form action="/tasks/update" method="post">
            <input type="number" name="id" placeholder="ID de la tarea" required><br>
            <input type="text" name="descripcion" placeholder="Nueva Descripción"><br>
            <input type="date" name="fecha_limite"><br>
            <button type="submit">Actualizar</button>
        </form>
        <a href="/">🔙 Volver</a>
    `);
});




// 📌 POST: Editar tarea
app.post("/tasks/update", (req, res) => {
    const data = readTasks();
    const id = parseInt(req.body.id);
    const taskIndex = data.tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
        return res.status(404).send("<h2>Tarea no encontrada.</h2><a href='/update-task'>🔙 Volver</a>");
    }

    // Si se envían nuevos valores, actualizarlos
    if (req.body.descripcion) {
        data.tasks[taskIndex].descripcion = req.body.descripcion;
    }
    if (req.body.fecha_limite) {
        data.tasks[taskIndex].fecha_limite = req.body.fecha_limite;
    }

    writeTasks(data);
    res.redirect("/tasks");
});

// 📌 GET: Formulario para eliminar tarea
app.get("/delete-task", (req, res) => {
    res.send(`
        <h2>Eliminar Tarea</h2>
        <form action="/tasks/delete" method="post">
            <input type="number" name="id" placeholder="ID de la tarea" required><br>
            <button type="submit">Eliminar</button>
        </form>
        <a href="/">🔙 Volver</a>
    `);
});

// 📌 POST: Eliminar tarea
app.post("/tasks/delete", (req, res) => {
    const data = readTasks();
    const id = parseInt(req.body.id);
    const filteredTasks = data.tasks.filter(task => task.id !== id);

    if (filteredTasks.length === data.tasks.length) {
        return res.status(404).send("<h2>Tarea no encontrada.</h2><a href='/delete-task'>🔙 Volver</a>");
    }

    writeTasks({ tasks: filteredTasks });
    res.redirect("/tasks");
});

// 📌 Iniciar servidor
app.listen(3000, () => console.log("✅ Servidor corriendo en http://localhost:3000"));
