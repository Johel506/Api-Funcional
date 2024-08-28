import express, { query } from "express";
import { pool } from "./db.js";
import { PORT } from "./config.js";
import { Resend } from "resend";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cloudinary from "cloudinary";
import multer from "multer";
const saltRounds = 10; // Number of salt rounds for bcrypt
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

// Ruta para cargar imágenes usuarios
app.post("/upload-user-image", upload.single("image"), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Upload the image to Cloudinary
  const uploadStream = cloudinary.v2.uploader.upload_stream((error, result) => {
    if (error) {
      return res.status(500).json({ error: "Upload to Cloudinary failed" });
    }
    // Return the Cloudinary URL to the client
    res.json({ url: result.secure_url });
  });

  uploadStream.end(file.buffer);
});

const JWT_SECRET = "randomstring120@1secretkey"; // Use a strong secret key
app.post("/login", async (req, res) => {
  try {
    const { Correo, Password_Usuario, Tipo } = req.body;

    // Retrieve user from the database based on email and type
    const [rows] = await pool.query(
      "SELECT * FROM Usuarios WHERE Correo = ? AND Tipo = ?",
      [Correo, Tipo]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = rows[0];

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(
      Password_Usuario,
      user.Password_Usuario
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Remove the password from the user object
    delete user.Password_Usuario;

    // Generate JWT token
    const token = jwt.sign(
      { id: user.ID_Usuario, correo: user.Correo, tipo: user.Tipo },
      JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Send response with token and user data
    res.json({
      message: "Login exitoso",
      user,
      token, // Return the token to the client
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

const resend = new Resend("re_PXZK6eXM_2SybUUu1oCXcMQCD9aV5JQHt");

function createEmailTemplate(name, message) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Template</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f4f4f4; padding: 10px; text-align: center; }
        .content { padding: 20px 0; }
        .footer { background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Soporte RealState.com !</h1>
          <p>Telefono de contacto: ${name}</p>
        </div>
        <div class="content">
         <p>Asunto:</p>
          <p>${message}</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

app.post("/send-email", async (req, res) => {
  try {
    const { to, subject, name, message } = req.body;
    const htmlContent = createEmailTemplate(name, message);

    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject,
      html: htmlContent,
    });
    res.json(data);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Usuarios
// Agregar Usuarios
app.post("/usuarios", async (req, res) => {
  try {
    const {
      ID_Usuario,
      Nombre,
      Apellidos,
      Correo,
      Password_Usuario, // Password to be hashed
      Telefono,
      Genero,
      Tipo,
    } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(Password_Usuario, saltRounds);

    // Insert user with hashed password into the database
    const [result] = await pool.query(
      "INSERT INTO Usuarios (ID_Usuario, Nombre, Apellidos, Correo, Password_Usuario, Telefono, Genero, Tipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        ID_Usuario,
        Nombre,
        Apellidos,
        Correo,
        hashedPassword, // Use the hashed password
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
//Obtener Datos
app.get("/usuarios", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Usuarios");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/usuarios-card-management", async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT 
    COALESCE(c.Url_Img, 'https://res.cloudinary.com/djxwusqnb/image/upload/v1724334577/sqiuhcqvtz1evqdkm4s8.png') AS Url_Img, 
          s.ID_Usuario, 
          s.Nombre,
          s.Correo
      FROM 
          Usuarios s 
      LEFT JOIN 
          CloseDataUser c 
      ON 
    s.ID_Usuario = c.ID_Usuario;`);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/buscar-usuario", async (req, res) => {
  try {
    // Obtener el valor de búsqueda desde la query string de la URL
    const { Correo } = req.query;

    // Definir la consulta SQL
    const query = `
      SELECT * FROM Usuarios WHERE Correo = ?;
    `;

    // Ejecutar la consulta SQL usando el valor de búsqueda
    const [rows] = await pool.query(query, [Correo]);

    if (rows.length === 0) {
      res.status(404).json({ message: "No se encontro el usuario" });
    } else {
      // Devolver los resultados como respuesta en formato JSON
      res.json(rows);
    }
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

app.delete("/delete-user-account", async (req, res) => {
  const { id } = req.query;

  try {
    const [resul] = await pool.query("CALL DeleteUser(?);", [id]);

    res.json({ message: "Se elimino de forma correcta" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internar Error" });
  }
});

// Editar usuario
app.put("/usuarios", async (req, res) => {
  try {
    const { Correo } = req.query; // Current email to identify the user
    const { Nombre, Apellidos, Telefono, Genero, Correo: NewCorreo } = req.body; // New values, including updated email

    const [result] = await pool.query(
      "UPDATE Usuarios SET Nombre = ?, Apellidos = ?, Telefono = ?, Genero = ?, Correo = ? WHERE Correo = ?",
      [Nombre, Apellidos, Telefono, Genero, NewCorreo, Correo]
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

// Update CloseDataUser based on ID_Usuario provided in the URL
app.put("/update-close-data", async (req, res) => {
  try {
    const { ID_Usuario } = req.query; // Extract ID_Usuario from URL parameters
    const {
      IG_Profile,
      FaceBook_Profile,
      Url_Img,
      Country_User,
      City,
      Postal_Code,
    } = req.body; // Extract data from request body

    // Validate input
    if (
      !ID_Usuario ||
      !IG_Profile ||
      !FaceBook_Profile ||
      !Url_Img ||
      !Country_User ||
      !City ||
      !Postal_Code
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Execute SQL query to update the CloseDataUser table
    const [result] = await pool.query(
      "UPDATE CloseDataUser SET IG_Profile = ?, FaceBook_Profile = ?, Url_Img = ?, Country_User = ?, City = ?, Postal_Code = ? WHERE ID_Usuario = ?",
      [
        IG_Profile,
        FaceBook_Profile,
        Url_Img,
        Country_User,
        City,
        Postal_Code,
        ID_Usuario,
      ]
    );

    // Check if the update was successful
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User data not found" });
    }

    res.json({ message: "User data updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
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

app.get("/ubicaciones-property", async (req, res) => {
  const ID_Ubicacion = req.query.ID_Ubicacion;
  try {
    const [rows] = await pool.query(
      `SELECT b.ID_Ubicacion, b.Ciudad, b.Provincia, b.Pais, b.CodigoPostal, b.Direccion, b.Latitud, b.Longitud
FROM Propiedades p
JOIN Ubicacion b ON p.ID_Ubicacion = b.ID_Ubicacion WHERE p.ID_Ubicacion = ?;`,
      [ID_Ubicacion]
    );
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

app.get("/caracteristicas-property", async (req, res) => {
  const ID_Propiedad = req.query.ID_Propiedad;
  try {
    const [rows] = await pool.query(
      `SELECT p.ID_Propiedad, c.Num_Habitaciones, c.Num_Banos, c.Num_Pisos, c.Area_Lote, c.Area_Casa 
       FROM Propiedades p 
       JOIN Caracteristicas c ON p.ID_Caracteristicas = c.ID_Caracteristicas 
       WHERE p.ID_Propiedad = ?;`,
      [ID_Propiedad]
    );
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
    const { Num_Habitaciones, Num_Banos, Num_Pisos, Area_Lote, Area_Casa } =
      req.body;
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
    const [rows] = await pool.query(
      "SELECT ID_Servicio, Nombre FROM Servicios"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/servicios-propiedad", async (req, res) => {
  const { ID_Propiedad } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT Propiedad_ID, Servicio_ID FROM Propiedad_Servicio WHERE Propiedad_ID = ?;`,
      [ID_Propiedad]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/servicios-propiedad-show", async (req, res) => {
  const { ID_Propiedad } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT  s.Nombre FROM Propiedad_Servicio p INNER JOIN Servicios s ON p.Servicio_ID = s.ID_Servicio WHERE Propiedad_ID = ?;`,
      [ID_Propiedad]
    );
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
      Fecha_Creacion,
      Nombre,
      Descripcion,
      Precio,
      ID_Ubicacion,
    } = req.body;

    const [result] = await pool.query(
      "INSERT INTO Propiedades (ID_Propiedad, ID_Vendedor, ID_Caracteristicas,Fecha_Creacion, Nombre, Descripcion, Precio, ID_Ubicacion) VALUES (?, ?, ?, ? , ?, ?, ?, ?)",
      [
        ID_Propiedad,
        ID_Vendedor,
        ID_Caracteristicas,
        Fecha_Creacion,
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
      "SELECT COUNT(*) AS total FROM Propiedades;"
    );
    res.json({ count: rows[0].total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/usuarios/count", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS total FROM Usuarios;");
    res.json({ count: rows[0].total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/usuarios-seller/count", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM Usuarios WHERE Tipo = 'Vendedor';"
    );
    res.json({ count: rows[0].total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/usuarios-client/count", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM Usuarios WHERE Tipo = 'Cliente';"
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
app.get("/propiedades-selected", async (req, res) => {
  const { ID_Property } = req.query;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Propiedades WHERE ID_Propiedad = ?",
      [ID_Property]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/delete-property-seller", async (req, res) => {
  const { id } = req.query;

  try {
    const [resul] = await pool.query("CALL DeletePropiedad(?);", [id]);

    res.json({ message: "Se elimino de forma correcta" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internar Error" });
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
      Fecha_Creacion,
      Descripcion,
      Precio,
      ID_Ubicacion,
    } = req.body;
    const [result] = await pool.query(
      "UPDATE Propiedades SET ID_Vendedor = ?, ID_Caracteristicas = ?, Nombre = ?, Fecha_Creacion = ?, Descripcion = ?, Precio = ?, ID_Ubicacion = ? WHERE ID_Propiedad = ?",
      [
        ID_Vendedor,
        ID_Caracteristicas,
        Nombre,
        Fecha_Creacion,
        Descripcion,
        Precio,
        ID_Ubicacion,

        id,
      ]
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

app.get("/imagenes-property", async (req, res) => {
  const { ID_Propiedad } = req.query;
  try {
    const [rows] = await pool.query(
      "SELECT Url_img FROM Imagenes WHERE ID_Propiedad = ?;",
      [ID_Propiedad]
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
      "DELETE FROM Imagenes WHERE ID_Propiedad = ?",
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

app.delete("/propiedad-servicio-delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM Propiedad_Servicio WHERE Propiedad_ID = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Servicio no encontrada" });
    }
    res.json({ message: "Servicio eliminado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
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

app.get("/buscar-propiedad", async (req, res) => {
  try {
    // Obtener el valor de búsqueda desde la query string de la URL
    const searchValue = req.query.search;

    // Definir la consulta SQL
    const query = `
      SELECT p.ID_Propiedad, p.ID_Caracteristicas, p.Nombre, p.Precio, 
             p.ID_Ubicacion, b.Ciudad, b.Provincia, b.Pais, 
             c.Num_Habitaciones, c.Num_Banos, c.Num_Pisos, c.Area_Lote
      FROM Propiedades p
      JOIN Caracteristicas c ON p.ID_Caracteristicas = c.ID_Caracteristicas
      JOIN Ubicacion b ON p.ID_Ubicacion = b.ID_Ubicacion
      WHERE CONCAT(b.Provincia, ', ', b.Ciudad) LIKE CONCAT('%', ?, '%');
    `;

    // Ejecutar la consulta SQL usando el valor de búsqueda
    const [rows] = await pool.query(query, [searchValue]);

    if (rows.length === 0) {
      res
        .status(404)
        .json({ message: "No se encuentran propiedades coincidentes" });
    } else {
      // Devolver los resultados como respuesta en formato JSON
      res.json(rows);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/propiedades-principal-vendedores", async (req, res) => {
  const { Correo } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT p.ID_Propiedad, p.ID_Caracteristicas, p.Nombre, p.Precio, p.ID_Ubicacion, b.Ciudad, b.Provincia,b.Pais, s.Correo,
       c.Num_Habitaciones, c.Num_Banos, c.Num_Pisos, c.Area_Lote
FROM Propiedades p
JOIN Caracteristicas c ON p.ID_Caracteristicas = c.ID_Caracteristicas 
JOIN Ubicacion b ON p.ID_Ubicacion = b.ID_Ubicacion JOIN Usuarios s ON p.ID_Vendedor = s.ID_Usuario WHERE s.Correo = ?;`,
      [Correo]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/propiedades-count-vendedores", async (req, res) => {
  const { Correo } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(p.ID_Propiedad) as total 
       FROM Propiedades p 
       INNER JOIN Usuarios c ON p.ID_Vendedor = c.ID_Usuario 
       WHERE c.Correo = ?;`,
      [Correo]
    );

    const total = rows[0]?.total || 0;
    res.json({ total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/propiedades-principal-vendedores-edit", async (req, res) => {
  const { ID_Propiedad } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT p.ID_Propiedad, p.Nombre, p.Precio, c.ID_Usuario
FROM Propiedades p
JOIN Usuarios c ON p.ID_Vendedor = c.ID_Usuario WHERE p.ID_Propiedad = ?;`,
      [ID_Propiedad]
    );
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

//APIS for view of one property

app.get("/spesific-property-component", async (req, res) => {
  const { propiedadId } = req.query; // Access query parameter
  try {
    const [rows] = await pool.query(
      `SELECT p.ID_Propiedad, p.Precio, b.Ciudad, b.Direccion, b.Provincia, c.Area_Lote, c.Num_Habitaciones, 
      c.Num_Banos FROM Propiedades p INNER JOIN Caracteristicas c 
      ON p.ID_Caracteristicas = c.ID_Caracteristicas JOIN Ubicacion b ON p.ID_Ubicacion = 
      b.ID_Ubicacion WHERE ID_Propiedad = ?`,
      [propiedadId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/spesific-property-component1", async (req, res) => {
  const { propiedadId } = req.query; // Access query parameter
  try {
    const [rows] = await pool.query(
      `SELECT Descripcion FROM Propiedades WHERE ID_Propiedad = ?;`,
      [propiedadId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/spesific-property-component2", async (req, res) => {
  const { propiedadId } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT c.Ciudad, c.Direccion, c.Latitud, c.Longitud, c.Provincia, c.Pais, c.CodigoPostal FROM Ubicacion c INNER JOIN 
      Propiedades p ON c.ID_Ubicacion  = p.ID_Ubicacion WHERE ID_Propiedad = ?;`,
      [propiedadId]
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internar Server Error" });
  }
});

app.get("/spesific-propertyMain-component2", async (req, res) => {
  const { propiedadId } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT p.ID_Propiedad,p.Fecha_Creacion, p.Nombre,p.Estado, p.Precio, a.Nombre as Nom_Seller, a.Apellidos, c.Area_Casa, c.Area_Lote, c.Num_Habitaciones, 
      c.Num_Banos FROM Propiedades p INNER JOIN Caracteristicas c 
      ON p.ID_Caracteristicas = c.ID_Caracteristicas JOIN Usuarios a ON p.ID_Vendedor = a.ID_Usuario WHERE ID_Propiedad = ?;`,
      [propiedadId]
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internar Server Error" });
  }
});

app.get("/spesific-property-component4", async (req, res) => {
  const { propiedadId } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT c.ID_Usuario, c.Nombre, c.Apellidos, c.Telefono, c.Genero, c.Correo FROM Usuarios c INNER JOIN Propiedades p 
ON c.ID_Usuario = p.ID_Vendedor WHERE p.ID_Propiedad  = ?;`,
      [propiedadId]
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internar Server Error" });
  }
});

//MANAGED USER PROFILE
//http://localhost:3000/favorites-properties?Correo=testcorreos@gmail.com
app.get("/favorites-properties", async (req, res) => {
  const { Correo } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT p.ID_Propiedad,  s.ID_Usuario, p.ID_Caracteristicas, p.Nombre, p.Precio, p.ID_Ubicacion, b.Ciudad, b.Provincia,b.Pais, s.Correo,
       c.Num_Habitaciones, c.Num_Banos, c.Num_Pisos, c.Area_Lote
FROM FavoriteProperties f INNER
JOIN Propiedades p ON f.ID_Propiedad = p.ID_Propiedad JOIN Caracteristicas c ON p.ID_Caracteristicas = c.ID_Caracteristicas
JOIN Ubicacion b ON p.ID_Ubicacion = b.ID_Ubicacion JOIN Usuarios s ON f.ID_Usuario = s.ID_Usuario  WHERE s.Correo = ?;`,
      [Correo]
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internar Server Error" });
  }
});
// {
//   "ID_Usuario":121,
//   "ID_Propiedad": 14
// }
app.post("/favorites-properties", async (req, res) => {
  try {
    const { ID_Usuario, ID_Propiedad } = req.body;
    const [result] = await pool.query(
      "INSERT INTO FavoriteProperties(ID_Usuario, ID_Propiedad) VALUES (?, ?);",
      [ID_Usuario, ID_Propiedad]
    );
    res.json(result);
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      res
        .status(400)
        .json({ error: "Invalid ID_Usuario: User does not exist" });
    } else if (error.code === "ER_DUP_ENTRY") {
      res
        .status(410)
        .json({ message: "Ya agregaste esta propiedad a favoritas" });
    } else {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

app.delete("/favorites-properties", async (req, res) => {
  try {
    const { ID_Usuario, ID_Propiedad } = req.query;
    const [result] = await pool.query(
      "DELETE FROM FavoriteProperties WHERE ID_Usuario = ? AND ID_Propiedad = ?;",
      [ID_Usuario, ID_Propiedad]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Servicio no encontrada" });
    }
    res.json({ message: "Servicio eliminado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/extra-data-user", async (req, res) => {
  try {
    const {
      ID_Usuario,
      IG_Profile,
      FaceBook_Profile,
      Url_Img,
      Country_User,
      City,
      Postal_Code,
    } = req.body;
    const [result] = await pool.query(
      `INSERT INTO CloseDataUser(ID_Usuario, IG_Profile, FaceBook_Profile, Url_Img, Country_User, City, Postal_Code) 
        VALUES (?, ?, ?, ?, ?, ? , ?);`,
      [
        ID_Usuario,
        IG_Profile,
        FaceBook_Profile,
        Url_Img,
        Country_User,
        City,
        Postal_Code,
      ]
    );
    res.json(result);
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      res
        .status(400)
        .json({ error: "Invalid ID_Usuario: User does not exist" });
    } else if (error.code === "ER_DUP_ENTRY") {
      res
        .status(410)
        .json({ message: "Ya agregaste esta propiedad a favoritas" });
    } else {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

app.get("/extra-data-user", async (req, res) => {
  const { Correo } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT s.ID_Usuario, c.IG_Profile, c.FaceBook_Profile, c.Url_Img, c.Country_User, c.City, c.Postal_Code 
FROM CloseDataUser c INNER JOIN Usuarios s ON c.ID_Usuario = s.ID_Usuario WHERE s.Correo = ?;`,
      [Correo]
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internar Server Error" });
  }
});

app.listen(PORT);
console.log("Server on port", PORT);
