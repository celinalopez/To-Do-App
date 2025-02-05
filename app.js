import express from "express";
import fs from "fs";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios"; // Importamos Axios para obtener frases motivacionales
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); 

const FILE_PATH = "./tasks.json";

//#region Swagger
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API de Tareas",
            version: "1.0.0",
            description: "Documentación de la API de gestión de tareas",
        },
    },
    apis: ["./server.js"], // Rutas documentadas en este archivo
};

// Generar especificaciones Swagger
const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use("/swagger", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
//#endregion


// Clase Task
class Task {
    constructor(id, etiqueta, descripcion, fecha_limite, completado = false) {
        this.id = id;
        this.etiqueta = etiqueta;
        this.descripcion = descripcion;
        this.fecha_limite = fecha_limite;
        this.completado = completado;
    }
}

//#region Funciones

// Leer tareas desde JSON
const readTasks = () => {
    try {
        const data = fs.readFileSync(FILE_PATH, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        return { tasks: [] };
    }
};

// Guardar tareas en JSON
const writeTasks = (data) => {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
};

//#endregion

//#region RUTAS

// Página principal
app.get("/", (req, res) => {
    res.send(`
        <h1>To Do App</h1>
        <button onclick="window.location.href='/tasks'">Ver Tareas</button>
        <button onclick="window.location.href='/add-task'">Agregar Tarea</button>
        <button onclick="window.location.href='/update-task'">Editar Tarea</button>
        <button onclick="window.location.href='/delete-task'">Eliminar Tarea</button>
    `);
});

//#region Ver tareas
/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Obtener todas las tareas
 *     description: Devuelve la lista de tareas organizadas por etiqueta.
 *     responses:
 *       200:
 *         description: Lista de tareas obtenida correctamente
 *       500:
 *         description: Error en el servidor
 */
//GET: VER TAREAS
app.get("/tasks", (req, res) => {
    const data = readTasks();

    if (data.tasks.length === 0) {
        return res.send("<h2>No hay tareas registradas.</h2><a href='/'>Volver</a>");
    }

    //Organizar tareas por etiqueta
    let groupedTasks = {};
    data.tasks.forEach(task => {
        if (!groupedTasks[task.etiqueta]) {
            groupedTasks[task.etiqueta] = [];
        }
        groupedTasks[task.etiqueta].push(task);
    });

    //Generar HTML con botones de completar solo si la task no esta completada
    let taskHtml = "<h1>Lista de Tareas</h1>";
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

//#region Completar tarea
/**
 * @swagger
 * /tasks/complete/{id}:
 *   post:
 *     summary: Marcar una tarea como completada y obtener frase motivacional
 *     description: Cambia el estado de una tarea a completada y obtiene una frase de ZenQuotes.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la tarea a completar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tarea completada y frase motivacional obtenida
 *       404:
 *         description: Tarea no encontrada
 */
// POST: Marcar tarea como completada y obtener frase motivacional
app.post("/tasks/complete/:id", async (req, res) => {
    const data = readTasks();
    const id = parseInt(req.params.id);
    const taskIndex = data.tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
        return res.status(404).send("<h2>Tarea no encontrada.</h2><a href='/tasks'>Volver</a>");
    }

    data.tasks[taskIndex].completado = true;
    writeTasks(data);

    try {
        // Obtener frase motivacional con Axios
        const response = await axios.get("https://zenquotes.io/api/random");
        const frase = response.data[0].q;
        const autor = response.data[0].a;

        // Enviar alerta con la frase y redirigir al usuario
        res.send(`
            <script>
                alert("Tarea completada!\\n\\nFrase motivacional:\\n\\"${frase}\\" - ${autor}");
                window.location.href = "/tasks";
            </script>
        `);
    } catch (error) {
        console.error("Error al obtener la frase:", error);

        res.send(`
            <script>
                alert("Tarea completada!\\n\\nNo se pudo obtener la frase motivacional.");
                window.location.href = "/tasks";
            </script>
        `);
    }
});

//#region Add tarea
/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Agregar una nueva tarea
 *     description: Crea una nueva tarea y la almacena en JSON.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               etiqueta:
 *                 type: string
 *                 example: "Trabajo"
 *               descripcion:
 *                 type: string
 *                 example: "Hacer informe mensual"
 *               fecha_limite:
 *                 type: string
 *                 format: date
 *                 example: "2024-02-10"
 *     responses:
 *       201:
 *         description: Tarea creada correctamente
 *       400:
 *         description: Faltan datos en la solicitud
 */

// GET: Formulario AGREGAR TASK
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

// POST: AGREGAR TASK
app.post("/tasks", (req, res) => {
    const data = readTasks();
    const { etiqueta, descripcion, fecha_limite } = req.body;

    if (!etiqueta || !descripcion || !fecha_limite) {
        return res.status(400).send("<h2>Todos los campos son obligatorios.</h2><a href='/add-task'>Volver</a>");
    }

    //Encontrar el ID más alto y sumarle 1
    const maxId = data.tasks.length > 0 ? Math.max(...data.tasks.map(task => task.id)) : 0;
    const newTask = new Task(
        maxId + 1, 
        etiqueta,
        descripcion,
        fecha_limite,
        false
    );

    data.tasks.push(newTask);
    writeTasks(data);
    res.redirect("/tasks");
});

//#region Actualizar tarea
// GET: Formulario ACTUALIZAR TASK
app.get("/update-task", (req, res) => {
    res.send(`
        <h2>Actualizar Tarea</h2>
        <form action="/tasks/update" method="post">
            <input type="number" name="id" placeholder="ID de la tarea" required><br>
            <input type="text" name="etiqueta" placeholder="Nueva Etiqueta"><br>
            <input type="text" name="descripcion" placeholder="Nueva Descripción"><br>
            <input type="date" name="fecha_limite"><br>
            <button type="submit">Actualizar</button>
        </form>
        <a href="/">Volver</a>
    `);
});

/**
 * @swagger
 * /tasks/update:
 *   post:
 *     summary: Actualizar una tarea existente
 *     description: Modifica los datos de una tarea según el ID proporcionado.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *               etiqueta:
 *                 type: string
 *                 example: "Trabajo"
 *               descripcion:
 *                 type: string
 *                 example: "Preparar presentación"
 *               fecha_limite:
 *                 type: string
 *                 format: date
 *                 example: "2024-02-20"
 *     responses:
 *       200:
 *         description: Tarea actualizada correctamente
 *       400:
 *         description: No se enviaron datos para actualizar
 *       404:
 *         description: Tarea no encontrada
 */

// POST: ACTUALIZAR TASK
app.post("/tasks/update", (req, res) => {
    const data = readTasks();
    const id = parseInt(req.body.id);
    const taskIndex = data.tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
        return res.status(404).send("<h2>Tarea no encontrada.</h2><a href='/update-task'>Volver</a>");
    }

    // Si se envían nuevos valores, actualizarlos
    if (req.body.etiqueta) {
        data.tasks[taskIndex].etiqueta = req.body.etiqueta;
    }
    if (req.body.descripcion) {
        data.tasks[taskIndex].descripcion = req.body.descripcion;
    }
    if (req.body.fecha_limite) {
        data.tasks[taskIndex].fecha_limite = req.body.fecha_limite;
    }

    writeTasks(data);
    res.redirect("/tasks");
});

//#endregion
//#region Eliminar tarea
// GET: Formulario ELIMINAR TASK
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

/**
 * @swagger
 * /tasks/delete:
 *   post:
 *     summary: Eliminar una tarea
 *     description: Elimina una tarea existente por ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Tarea eliminada correctamente
 *       404:
 *         description: Tarea no encontrada
 */
// POST: ELIMINAR TASK
app.post("/tasks/delete", (req, res) => {
    const data = readTasks();
    const id = parseInt(req.body.id);
    const filteredTasks = data.tasks.filter(task => task.id !== id);

    if (filteredTasks.length === data.tasks.length) {
        return res.status(404).send("<h2>Tarea no encontrada.</h2><a href='/delete-task'>Volver</a>");
    }

    writeTasks({ tasks: filteredTasks });
    res.redirect("/tasks");
});
//#endregion
// Iniciar servidor
app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));
