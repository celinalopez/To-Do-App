import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

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

// Funcion para leer tareas
const readTasks = () => {
    try {
        const data = fs.readFileSync(FILE_PATH, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        return { tasks: [] };
    }
};

//  Funcion para escribir tareas
const writeTasks = (data) => {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
};


// GET
app.get("/tasks", (req, res) => {
    const data = readTasks();
    res.json(data.tasks);
});



// Iniciar el servidor
app.listen(3000, () => console.log("✅ Servidor corriendo en http://localhost:3000"));
