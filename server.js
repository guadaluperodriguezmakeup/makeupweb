const express = require('express');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

// Database setup
const dbPath = path.join(__dirname, 'data/contactos.sqlite');
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database');
        db.run(`CREATE TABLE IF NOT EXISTS contactos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            correo TEXT NOT NULL,
            mensaje TEXT NOT NULL,
            creado_en TEXT NOT NULL DEFAULT (datetime('now'))
        )`);
    }
});

// Route to handle form submission
app.post('/enviar-mensaje', async (req, res) => {
    const { nombre, correo, mensaje } = req.body;

    if (!nombre || !correo || !mensaje) {
        return res.status(400).json({ estado: 'error', mensaje: 'Faltan datos obligatorios.' });
    }

    // Save to database
    const sql = `INSERT INTO contactos (nombre, correo, mensaje) VALUES (?, ?, ?)`;
    db.run(sql, [nombre, correo, mensaje], async function(err) {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ estado: 'error', mensaje: 'No se pudo guardar en la base de datos.' });
        }

        // Send emails
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                secure: false, 
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            // 1. Correo para ti (Aviso de nuevo contacto)
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: process.env.EMAIL_TO,
                subject: `Nuevo mensaje de contacto de ${nombre}`,
                text: `Nombre: ${nombre}\nCorreo: ${correo}\nMensaje: ${mensaje}`,
                html: `<p><strong>Nombre:</strong> ${nombre}</p>
                       <p><strong>Correo:</strong> ${correo}</p>
                       <p><strong>Mensaje:</strong> ${mensaje}</p>`,
            });

            // 2. Correo para el cliente (Auto-respuesta)
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: correo,
                subject: `¡Gracias por contactarme, ${nombre}!`,
                text: `Hola ${nombre}, he recibido tu mensaje. Me pondré en contacto contigo muy pronto.`,
                html: `<h3>¡Hola ${nombre}!</h3>
                       <p>He recibido tu mensaje correctamente a través de mi sitio web.</p>
                       <p>Me pondré en contacto contigo muy pronto para conversar sobre tu evento.</p>
                       <br>
                       <p>Saludos,</p>
                       <p><strong>Guadalupe Rodríguez</strong><br>Maquilladora Profesional</p>`,
            });

            res.json({ estado: 'ok', mensaje: 'Mensaje recibido y guardado. ¡Gracias!' });
        } catch (mailError) {
            console.error('Email error:', mailError);
            res.json({ 
                estado: 'error', 
                mensaje: 'Tus datos se guardaron, pero no se pudo enviar el aviso por correo. Revisa la configuración SMTP.' 
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
