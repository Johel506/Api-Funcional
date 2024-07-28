import express from "express";
import { pool } from "./db.js";
import { PORT } from "./config.js";

import cloudinary from "cloudinary";
import multer from "multer";

const app = express();
import cors from "cors";
app.use(express.json());

app.use(cors());

// Middleware
app.use(express.json());
app.use(cors());

// Configurar Cloudinary
cloudinary.v2.config({
  cloud_name: "djxwusqnb",
  api_key: "917253116411877",
  api_secret: "jE4t56Dz7uOMlrtp3tAZLVmS2Tw",
});

// Configurar Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta para cargar imágenes
app.post("/upload", upload.array("images"), (req, res) => {
  const files = req.files;

  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(file.buffer);
    });
  });

  Promise.all(uploadPromises)
    .then((results) => res.json(results))
    .catch((error) => res.status(500).send(error));
});


//Login
app.post("/login", async (req, res) => {
  try {
    const { Correo, Password_Usuario } = req.body;

    // Buscar el usuario por correo y contraseña
    const [rows] = await pool.query(
      "SELECT * FROM Usuarios WHERE Correo = ? AND Password_Usuario = ?",
      [Correo, Password_Usuario]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = rows[0];

    // Eliminar la contraseña del objeto de usuario antes de enviarlo
    delete user.Password_Usuario;

    res.json({ message: "Login exitoso", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Usuarios
//Agregar Usuarios
app.post("/usuarios", async (req, res) => {
  try {
    const {
      ID_Usuario,
      Nombre,
      Apellidos,
      Correo,
      Password_Usuario,
      Telefono,
      Genero,
      Tipo,
    } = req.body;
    const [result] = await pool.query(
      "INSERT INTO Usuarios (ID_Usuario, Nombre, Apellidos, Correo, Password_Usuario, Telefono, Genero, Tipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        ID_Usuario,
        Nombre,
        Apellidos,
        Correo,
        Password_Usuario,
        Telefono,
        Genero,
        Tipo,
      ]
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//Obtener Datis
app.get("/usuarios", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Usuarios");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Eliminar usuario
app.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM Usuarios WHERE ID_Usuario = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario eliminado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Editar usuario
app.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      Nombre,
      Apellidos,
      Correo,
      Password_Usuario,
      Telefono,
      Genero,
      Tipo,
    } = req.body;
    const [result] = await pool.query(
      "UPDATE Usuarios SET Nombre = ?, Apellidos = ?, Correo = ?, Password_Usuario = ?, Telefono = ?, Genero = ?, Tipo = ? WHERE ID_Usuario = ?",
      [Nombre, Apellidos, Correo, Password_Usuario, Telefono, Genero, Tipo, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario actualizado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ubicacion
app.post("/ubicaciones", async (req, res) => {
  try {
    const {
      ID_Ubicacion,
      Direccion,
      Ciudad,
      Provincia,
      Pais,
      CodigoPostal,
      Latitud,
      Longitud,
    } = req.body;
    const [result] = await pool.query(
      "INSERT INTO Ubicacion (ID_Ubicacion, Direccion, Ciudad, Provincia, Pais, CodigoPostal, Latitud, Longitud) VALUES (?,?, ?, ?, ?, ?, ?, ?)",
      [
        ID_Ubicacion,
        Direccion,
        Ciudad,
        Provincia,
        Pais,
        CodigoPostal,
        Latitud,
        Longitud,
      ]
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/ubicaciones", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Ubicacion");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Eliminar ubicación
app.delete("/ubicaciones/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM Ubicacion WHERE ID_Ubicacion = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ubicación no encontrada" });
    }
    res.json({ message: "Ubicación eliminada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Editar ubicación
app.put("/ubicaciones/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      Direccion,
      Ciudad,
      Provincia,
      Pais,
      CodigoPostal,
      Latitud,
      Longitud,
    } = req.body;
    const [result] = await pool.query(
      "UPDATE Ubicacion SET Direccion = ?, Ciudad = ?, Provincia = ?, Pais = ?, CodigoPostal = ?, Latitud = ?, Longitud = ? WHERE ID_Ubicacion = ?",
      [Direccion, Ciudad, Provincia, Pais, CodigoPostal, Latitud, Longitud, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ubicación no encontrada" });
    }
    res.json({ message: "Ubicación actualizada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Caracteristicas
app.post("/caracteristicas", async (req, res) => {
  try {
    const {
      ID_Caracteristicas,
      Num_Habitaciones,
      Num_Banos,
      Num_Pisos,
      Area_Lote,
      Area_Casa,
    } = req.body;
    const [result] = await pool.query(
      "INSERT INTO Caracteristicas (ID_Caracteristicas, Num_Habitaciones, Num_Banos, Num_Pisos, Area_Lote, Area_Casa) VALUES (?, ?, ?, ?, ?, ?)",
      [
        ID_Caracteristicas,
        Num_Habitaciones,
        Num_Banos,
        Num_Pisos,
        Area_Lote,
        Area_Casa,
      ]
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// {
//   "ID_Caracteristicas": 4,
//   "Num_Habitaciones": 5,
//   "Num_Banos": 3,
//   "Num_Pisos": 2,
//   "Area_Lote": "500.00",
//   "Area_Casa": "500.00"
// }

app.get("/caracteristicas", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Caracteristicas");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Eliminar característica
app.delete("/caracteristicas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM Caracteristicas WHERE ID_Caracteristicas = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Característica no encontrada" });
    }
    res.json({ message: "Característica eliminada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Editar característica
app.put("/caracteristicas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      Num_Habitaciones,
      Num_Banos,
      Num_Pisos,
      Area_Lote,
      Area_Casa,
    } = req.body;
    const [result] = await pool.query(
      "UPDATE Caracteristicas SET Num_Habitaciones = ?, Num_Banos = ?, Num_Pisos = ?, Area_Lote = ?, Area_Casa = ? WHERE ID_Caracteristicas = ?",
      [Num_Habitaciones, Num_Banos, Num_Pisos, Area_Lote, Area_Casa, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Característica no encontrada" });
    }
    res.json({ message: "Característica actualizada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Servicios
app.post("/servicios", async (req, res) => {
  try {
    const { Nombre, Svg_Imagen } = req.body;
    const [result] = await pool.query(
      "INSERT INTO Servicios (Nombre, Svg_Imagen) VALUES (?, ?)",
      [Nombre, Svg_Imagen]
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/servicios", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Servicios");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Eliminar servicio
app.delete("/servicios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM Servicios WHERE ID_Servicio = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }
    res.json({ message: "Servicio eliminado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Editar servicio
app.put("/servicios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Nombre, Svg_Imagen } = req.body;
    const [result] = await pool.query(
      "UPDATE Servicios SET Nombre = ?, Svg_Imagen = ? WHERE ID_Servicio = ?",
      [Nombre, Svg_Imagen, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }
    res.json({ message: "Servicio actualizado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

//Propiedades
app.post("/propiedades", async (req, res) => {
  try {
    const {
      ID_Propiedad,
      ID_Vendedor,
      ID_Caracteristicas,
      Nombre,
      Descripcion,
      Precio,
      ID_Ubicacion,
    } = req.body;

    const [result] = await pool.query(
      "INSERT INTO Propiedades (ID_Propiedad, ID_Vendedor, ID_Caracteristicas, Nombre, Descripcion, Precio, ID_Ubicacion) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        ID_Propiedad,
        ID_Vendedor,
        ID_Caracteristicas,
        Nombre,
        Descripcion,
        Precio,
        ID_Ubicacion,
      ]
    );

    res.status(201).json({ id: ID_Propiedad, ...req.body }); // Devuelve el ID de la nueva propiedad y los datos insertados
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/propiedades/count", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM Propiedades"
    );
    res.json({ count: rows[0].total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/propiedades", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Propiedades");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Eliminar propiedad
app.delete("/propiedades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM Propiedades WHERE ID_Propiedad = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Propiedad no encontrada" });
    }
    res.json({ message: "Propiedad eliminada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Editar propiedad
app.put("/propiedades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ID_Vendedor,
      ID_Caracteristicas,
      Nombre,
      Descripcion,
      Precio,
      ID_Ubicacion,
    } = req.body;
    const [result] = await pool.query(
      "UPDATE Propiedades SET ID_Vendedor = ?, ID_Caracteristicas = ?, Nombre = ?, Descripcion = ?, Precio = ?, ID_Ubicacion = ? WHERE ID_Propiedad = ?",
      [ID_Vendedor, ID_Caracteristicas, Nombre, Descripcion, Precio, ID_Ubicacion, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Propiedad no encontrada" });
    }
    res.json({ message: "Propiedad actualizada con éxito", id, ...req.body });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Imagenes
app.post("/imagenes", async (req, res) => {
  try {
    const { ID_Propiedad, Url_img } = req.body;
    const [result] = await pool.query(
      "INSERT INTO Imagenes (ID_Propiedad, Url_img) VALUES (?, ?)",
      [ID_Propiedad, Url_img]
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/imagenes", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT ID_Propiedad, Url_img FROM Imagenes;"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Eliminar imagen
app.delete("/imagenes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM Imagenes WHERE ID_Imagen = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Imagen no encontrada" });
    }
    res.json({ message: "Imagen eliminada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Editar imagen
app.put("/imagenes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ID_Propiedad, Url_img } = req.body;
    const [result] = await pool.query(
      "UPDATE Imagenes SET ID_Propiedad = ?, Url_img = ? WHERE ID_Imagen = ?",
      [ID_Propiedad, Url_img, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Imagen no encontrada" });
    }
    res.json({ message: "Imagen actualizada con éxito", id, ...req.body });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Propiedad_Servicio
app.post("/propiedad-servicio", async (req, res) => {
  try {
    const { Propiedad_ID, Servicio_ID } = req.body;
    const [result] = await pool.query(
      "INSERT INTO Propiedad_Servicio (Propiedad_ID, Servicio_ID) VALUES (?, ?)",
      [Propiedad_ID, Servicio_ID]
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/propiedad-servicio", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Propiedad_Servicio");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/propiedades-principal", async (req, res) => {
  try {
    const [rows] =
      await pool.query(`SELECT p.ID_Propiedad, p.ID_Caracteristicas, p.Nombre, p.Precio, p.ID_Ubicacion, b.Ciudad, b.Provincia,b.Pais,
       c.Num_Habitaciones, c.Num_Banos, c.Num_Pisos, c.Area_Lote
FROM Propiedades p
JOIN Caracteristicas c ON p.ID_Caracteristicas = c.ID_Caracteristicas JOIN Ubicacion b ON p.ID_Ubicacion = b.ID_Ubicacion;`);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/propiedad-servicio/:propiedadId", async (req, res) => {
  const { propiedadId } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT ps.ID, ps.Propiedad_ID, ps.Servicio_ID, s.Nombre AS Servicio_Nombre
      FROM Propiedad_Servicio ps
      JOIN Servicios s ON ps.Servicio_ID = s.ID_Servicio
      WHERE ps.Propiedad_ID = ?
    `,
      [propiedadId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT);
console.log("Server on port", PORT);
