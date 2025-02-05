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




// Cargar tareas al inicio
fetchTasks();
