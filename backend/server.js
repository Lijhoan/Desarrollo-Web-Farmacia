require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Array temporal para simular carrito en memoria (en producción sería base de datos)
let carritoItems = [];

// Ruta para validar stock de medicamentos
app.post("/validar-stock", (req, res) => {
  const { medicamentos } = req.body;
  if (!medicamentos || !Array.isArray(medicamentos)) {
    return res.status(400).json({ error: "Se espera un array de medicamentos." });
  }

  const resultados = [];
  let processedCount = 0;

  if (medicamentos.length === 0) {
    return res.json([]);
  }

  medicamentos.forEach((med) => {
    db.get(
      "SELECT stock FROM medicamentos WHERE nombre LIKE ?",
      [`%${med}%`],
      (err, row) => {
        if (err) {
          console.error("Error al consultar DB: " + err.message);
          resultados.push({
            nombre: med,
            disponible: false,
            error: "Error en la base de datos",
          });
        } else {
          resultados.push({
            nombre: med,
            disponible: row ? row.stock > 0 : false,
          });
        }
        processedCount++;
        if (processedCount === medicamentos.length) {
          res.json(resultados);
        }
      }
    );
  });
});

// RUTAS DEL CARRITO
// Obtener items del carrito
app.get("/api/carrito", (req, res) => {
  res.json(carritoItems);
});

// Agregar item al carrito
app.post("/api/carrito/agregar", (req, res) => {
  const { id, nombre, precio, imagen, categoria } = req.body;
  
  if (!id || !nombre || !precio) {
    return res.status(400).json({ error: "Datos incompletos del producto" });
  }

  // Verificar si el producto ya existe en el carrito
  const itemExistente = carritoItems.find(item => item.id === id);
  
  if (itemExistente) {
    itemExistente.cantidad += 1;
  } else {
    carritoItems.push({
      id,
      nombre,
      precio: parseFloat(precio),
      imagen: imagen || 'https://via.placeholder.com/150',
      categoria: categoria || 'General',
      cantidad: 1
    });
  }
  
  res.json({ message: "Producto agregado al carrito", carrito: carritoItems });
});

// Actualizar cantidad de un item
app.put("/api/carrito/actualizar/:id", (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;
  
  const item = carritoItems.find(item => item.id === id);
  if (item) {
    item.cantidad = parseInt(cantidad);
    if (item.cantidad <= 0) {
      carritoItems = carritoItems.filter(item => item.id !== id);
    }
    res.json({ message: "Carrito actualizado", carrito: carritoItems });
  } else {
    res.status(404).json({ error: "Producto no encontrado en el carrito" });
  }
});

// Eliminar item del carrito
app.delete("/api/carrito/eliminar/:id", (req, res) => {
  const { id } = req.params;
  carritoItems = carritoItems.filter(item => item.id !== id);
  res.json({ message: "Producto eliminado del carrito", carrito: carritoItems });
});

// Limpiar carrito
app.delete("/api/carrito/limpiar", (req, res) => {
  carritoItems = [];
  res.json({ message: "Carrito limpiado", carrito: carritoItems });
});

// Procesar pedido (checkout)
app.post("/api/checkout", (req, res) => {
  const { datosCliente, metodoPago } = req.body;
  
  if (carritoItems.length === 0) {
    return res.status(400).json({ error: "El carrito está vacío" });
  }
  
  // Simular procesamiento del pedido
  const total = carritoItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const numeroPedido = 'PED-' + Date.now();
  
  // Limpiar carrito después del pedido
  const pedidoProcesado = {
    numeroPedido,
    items: [...carritoItems],
    total,
    datosCliente,
    metodoPago,
    fecha: new Date().toISOString(),
    estado: 'Procesando'
  };
  
  carritoItems = [];
  
  res.json({ 
    message: "Pedido procesado exitosamente", 
    pedido: pedidoProcesado 
  });
});

// Ruta para normalizar receta con IA
app.post("/normalizar-receta", async (req, res) => {
  const { texto } = req.body;

  if (!texto) {
    return res.status(400).json({ error: "Falta el texto de la receta" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0, // 🔧 Sin creatividad para resultados consistentes
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Eres un asistente experto en recetas médicas.
Tu tarea es EXTRAER SOLO LOS NOMBRES DE LOS MEDICAMENTOS de la receta.
NO incluyas direcciones, nombres de doctores, diagnósticos, ni notas adicionales.

FORMATO DE SALIDA OBLIGATORIO:
{
  "medicamentos": [
    "Medicamento 1",
    "Medicamento 2",
    "Medicamento 3"
  ]
}

EJEMPLO:
Entrada: "Receta: Amoxicilina 500mg cada 8h, Paracetamol 1g al día, Cita Dr. Juan Pérez"
Salida: {
  "medicamentos": [
    "Amoxicilina",
    "Paracetamol"
  ]
}`
          },
          {
            role: "user",
            content: `Extrae SOLO los nombres de medicamentos del siguiente texto OCR con errores:

---
${texto}
---

Devuelve únicamente el JSON con el array de medicamentos, sin explicaciones adicionales.`
          }
        ]
      })
    });

    const data = await response.json();

    // Validación robusta del JSON
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error("La IA no devolvió una respuesta válida");
    }

    let normalizado;
    try {
      normalizado = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error("Error parseando JSON de IA:", parseError);
      return res.status(500).json({ error: "La IA no devolvió JSON válido de medicamentos." });
    }
    
    // Validar estructura del JSON
    if (!normalizado.medicamentos || !Array.isArray(normalizado.medicamentos)) {
      console.error("Estructura JSON incorrecta:", normalizado);
      return res.status(500).json({ error: "La IA no devolvió el formato esperado (array de medicamentos)." });
    }

    // Filtrar y validar cada medicamento
    const medicamentos = normalizado.medicamentos
      .filter(med => typeof med === 'string' && med.trim().length > 0)
      .map(med => med.trim());

    if (medicamentos.length === 0) {
      return res.status(400).json({ error: "No se encontraron medicamentos válidos en el texto." });
    }

    // Validar cada medicamento en la base de datos
    const resultados = [];
    for (const med of medicamentos) {
      await new Promise((resolve) => {
        db.all(
          "SELECT nombre, stock, costo, marca FROM medicamentos WHERE nombre LIKE ?",
          [`%${med}%`], // Usar LIKE para búsqueda más flexible
          (err, rows) => {
            if (err) {
              console.error(err);
              resultados.push({ nombre: med, disponible: false, error: "Error en BD" });
            } else if (rows.length > 0) {
              resultados.push({ 
                nombre: med, 
                disponible: true, 
                detalles: rows.map(row => ({
                  nombre: row.nombre,
                  stock: row.stock,
                  costo: row.costo,
                  marca: row.marca
                }))
              });
            } else {
              resultados.push({ nombre: med, disponible: false });
            }
            resolve();
          }
        );
      });
    }

    res.json({ normalizado: medicamentos, resultados });
  } catch (err) {
    console.error("Error normalizando receta:", err);
    res.status(500).json({ error: "Error interno en normalización" });
  }
});

// Ruta para servir la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});

