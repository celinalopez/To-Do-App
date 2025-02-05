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

const taskListElement = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const quoteText = document.getElementById("quoteText");

//Cargar tareas desde el servidor
async function fetchTasks() {
    const response = await fetch("http://localhost:3000/tasks");
    const tasks = await response.json();
    renderTasks(tasks);
}

// Renderizar tareas en la interfaz
function renderTasks(tasks) {
    taskListElement.innerHTML = "";
    tasks.forEach(task => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="${task.completado ? 'completed' : ''}">
                [${task.etiqueta}] ${task.descripcion} (Vence: ${task.fecha_limite})
            </span>
            <button onclick="toggleTask(${task.id})">✔</button>
            <button onclick="deleteTask(${task.id})">❌</button>
        `;
        taskListElement.appendChild(li);
    });
}
// Agregar nueva tarea
async function addTask() {
    const etiqueta = prompt("Etiqueta de la tarea:");
    const descripcion = prompt("Descripción de la tarea:");
    const fecha_limite = prompt("Fecha límite (YYYY-MM-DD):");

    if (!etiqueta || !descripcion || !fecha_limite) return;

    const newTask = { etiqueta, descripcion, fecha_limite };

    await fetch("http://localhost:3000/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask)
    });

    fetchTasks();
}

// Marcar una tarea como completada
async function toggleTask(id) {
    const response = await fetch(`http://localhost:3000/tasks`);
    const tasks = await response.json();
    const task = tasks.find(t => t.id === id);
    task.completado = !task.completado;

    await fetch(`http://localhost:3000/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task)
    });

    fetchTasks();
    if (task.completado) {
        fetchMotivationalQuote();
    }
}






// Cargar tareas al inicio
fetchTasks();
