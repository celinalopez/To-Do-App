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


// 📌 Iniciar el servidor
app.listen(3000, () => console.log("✅ Servidor corriendo en http://localhost:3000"));
