import express from 'express';
import { pool } from './db.js';
import { PORT } from './config.js'

const app = express()

app.use(express.json());






// Usuarios
app.post('/usuarios', async (req, res) => {
  try {
    const { Nombre, Apellidos, Correo, Password_Usuario, Telefono, Genero, Tipo } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Usuarios (Nombre, Apellidos, Correo, Password_Usuario, Telefono, Genero, Tipo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [Nombre, Apellidos, Correo, Password_Usuario, Telefono, Genero, Tipo]
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Usuarios');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Ubicacion
app.post('/ubicaciones', async (req, res) => {
  try {
    const { Direccion, Ciudad, Provincia, Pais, CodigoPostal, Latitud, Longitud } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Ubicacion (Direccion, Ciudad, Provincia, Pais, CodigoPostal, Latitud, Longitud) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [Direccion, Ciudad, Provincia, Pais, CodigoPostal, Latitud, Longitud]
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/ubicaciones', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Ubicacion');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Caracteristicas
app.post('/caracteristicas', async (req, res) => {
  try {
    const { Num_Habitaciones, Num_Banos, Num_Pisos, Area_Lote, Area_Casa } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Caracteristicas (Num_Habitaciones, Num_Banos, Num_Pisos, Area_Lote, Area_Casa) VALUES (?, ?, ?, ?, ?)',
      [Num_Habitaciones, Num_Banos, Num_Pisos, Area_Lote, Area_Casa]
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/caracteristicas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Caracteristicas');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Servicios
app.post('/servicios', async (req, res) => {
  try {
    const { Nombre, Svg_Imagen } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Servicios (Nombre, Svg_Imagen) VALUES (?, ?)',
      [Nombre, Svg_Imagen]
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/servicios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Servicios');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Propiedades
app.post('/propiedades', async (req, res) => {
  try {
    const { ID_Vendedor, ID_Caracteristicas, Nombre, Descripcion, Precio, Estado, ID_Ubicacion } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Propiedades (ID_Vendedor, ID_Caracteristicas, Nombre, Descripcion, Precio, Estado, ID_Ubicacion) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ID_Vendedor, ID_Caracteristicas, Nombre, Descripcion, Precio, Estado, ID_Ubicacion]
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/propiedades', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Propiedades');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Imagenes
app.post('/imagenes', async (req, res) => {
  try {
    const { ID_Propiedad, PublicId, Asset, Url_img } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Imagenes (ID_Propiedad, PublicId, Asset, Url_img) VALUES (?, ?, ?, ?)',
      [ID_Propiedad, PublicId, Asset, Url_img]
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/imagenes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Imagenes');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Propiedad_Servicio
app.post('/propiedad-servicio', async (req, res) => {
  try {
    const { Propiedad_ID, Servicio_ID } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Propiedad_Servicio (Propiedad_ID, Servicio_ID) VALUES (?, ?)',
      [Propiedad_ID, Servicio_ID]
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/propiedad-servicio', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Propiedad_Servicio');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT)
console.log('Server on port', PORT)