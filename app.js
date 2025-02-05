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



// Cargar tareas al inicio
fetchTasks();
