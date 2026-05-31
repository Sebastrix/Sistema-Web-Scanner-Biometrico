// ==============================================================================================================================
// 1. IMPORTACIONES Y CONFIGURACIÓN INICIAL
// Qué hace: importa las librerías necesarias, crea la app de Express y define el puerto del servidor.
// ==============================================================================================================================
const express = require('express');
const path = require('path');
const cors = require('cors');
const sql = require('mssql/msnodesqlv8');
const bcrypt = require('bcrypt');
const fs = require('fs');
const { execFile } = require('child_process');

const app = express();
const PORT = 3000;


// ==============================================================================================================================
// 2. MIDDLEWARES DEL SERVIDOR
// Qué hace: permite CORS, recibir JSON grande, formularios y servir archivos estáticos del proyecto.
// ==============================================================================================================================
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(__dirname));


// ==============================================================================================================================
// 3. CONFIGURACIÓN DE SQL SERVER LOCAL
// Qué hace: define la conexión hacia la base de datos SISTEMA_WEB_SCANNER en SQL Server local.
// ==============================================================================================================================
const connectionString =
    "Driver={ODBC Driver 18 for SQL Server};" +
    "Server=(local);" +
    "Database=SISTEMA_WEB_SCANNER;" +
    "Trusted_Connection=Yes;" +
    "Encrypt=no;" +
    "TrustServerCertificate=yes;";

const config = {
    connectionString: connectionString,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    requestTimeout: 30000
};


// ==============================================================================================================================
// 4. VARIABLE GLOBAL DE CONEXIÓN A LA BASE DE DATOS
// Qué hace: guarda una conexión reutilizable para no abrir una nueva conexión en cada consulta.
// ==============================================================================================================================
global.sebas = null;


// ==============================================================================================================================
// 5. FUNCIÓN GLOBAL PARA CONECTAR A SQL SERVER
// Qué hace: conecta con SQL Server y devuelve la conexión activa.
// ==============================================================================================================================
global.conectarSebasDB = async function () {
    try {
        if (!global.sebas) {
            global.sebas = await sql.connect(config);
        }

        return global.sebas;

    } catch (error) {
        console.log("Error conectando a SQL Server:", error.message);
        global.sebas = null;
        return null;
    }
};


// ==============================================================================================================================
// 6. FUNCIÓN GLOBAL PARA PROBAR LA CONEXIÓN A LA BASE DE DATOS
// Qué hace: verifica si la base de datos SISTEMA_WEB_SCANNER está activa.
// ==============================================================================================================================
global.testSebasConnection = async function () {
    try {
        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            throw new Error("No se pudo conectar a SISTEMA_WEB_SCANNER");
        }

        await sebas
            .request()
            .query("SELECT DB_NAME() AS baseDeDatos, 1 AS activo");

        console.log("SQL CONECTADO ✅");

        return true;

    } catch (error) {
        console.log("SQL DESCONECTADO ❌");
        console.log(error.message);
        global.sebas = null;
        return false;
    }
};

// ==============================================================================================================================
// FUNCIÓN PARA LEER RESPUESTA JSON DE PYTHON
// Qué hace: obtiene el último JSON válido devuelto por Python, ignorando advertencias de TensorFlow o DeepFace.
// ==============================================================================================================================
function extraerJsonDesdePython(stdout) {
    const lineas = stdout
        .split(/\r?\n/)
        .map(linea => linea.trim())
        .filter(linea => linea.length > 0);

    for (let i = lineas.length - 1; i >= 0; i--) {
        try {
            return JSON.parse(lineas[i]);
        } catch (error) {
            // Ignora líneas que no sean JSON
        }
    }

    throw new Error("Python no devolvió un JSON válido");
}

// ==============================================================================================================================
// 7. FUNCIÓN PARA EXTRAER JSON DESDE PYTHON
// Qué hace: obtiene el último JSON válido que imprime Python, ignorando advertencias de TensorFlow o DeepFace.
// ==============================================================================================================================
function extraerJsonDesdePython(stdout) {
    const lineas = stdout
        .split(/\r?\n/)
        .map(linea => linea.trim())
        .filter(linea => linea.length > 0);

    for (let i = lineas.length - 1; i >= 0; i--) {
        try {
            return JSON.parse(lineas[i]);
        } catch (error) {
            // Ignora líneas que no sean JSON
        }
    }

    throw new Error("Python no devolvió un JSON válido");
}


// ==============================================================================================================================
// 8. FUNCIÓN PARA VALIDAR ROSTRO EN EL REGISTRO
// Qué hace: ejecuta registrar_rostro.py para comprobar que la imagen tenga un rostro válido con DeepFace.
// ==============================================================================================================================
function validarRostroConPython(rutaImagen) {
    return new Promise((resolve, reject) => {
        const rutaPython = path.join(__dirname, 'py', 'registrar_rostro.py');
        const pythonPath = path.join(__dirname, '.venv', 'Scripts', 'python.exe');

        execFile(
            pythonPath,
            [rutaPython, rutaImagen],
            {
                env: {
                    ...process.env,
                    TF_CPP_MIN_LOG_LEVEL: '2'
                }
            },
            (error, stdout, stderr) => {
                if (error) {
                    return reject(new Error(stderr || error.message));
                }

                try {
                    const resultado = extraerJsonDesdePython(stdout);
                    resolve(resultado);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        );
    });
}


// ==============================================================================================================================
// 9. FUNCIÓN PARA COMPARAR IDENTIDAD FACIAL CON PYTHON
// Qué hace: ejecuta validar_rostro.py y compara la imagen registrada del cliente con una nueva captura facial.
// ==============================================================================================================================
function compararRostroConPython(rutaImagenRegistrada, rutaImagenActual) {
    return new Promise((resolve, reject) => {
        const rutaPython = path.join(__dirname, 'py', 'validar_rostro.py');
        const pythonPath = path.join(__dirname, '.venv', 'Scripts', 'python.exe');

        execFile(
            pythonPath,
            [rutaPython, rutaImagenRegistrada, rutaImagenActual],
            {
                env: {
                    ...process.env,
                    TF_CPP_MIN_LOG_LEVEL: '2'
                }
            },
            (error, stdout, stderr) => {
                if (error) {
                    return reject(new Error(stderr || error.message));
                }

                try {
                    const resultado = extraerJsonDesdePython(stdout);
                    resolve(resultado);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        );
    });
}

// ==============================================================================================================================
// 8. RUTAS PRINCIPALES DEL FRONTEND
// Qué hace: muestra las páginas HTML principales del sistema: login, registro, administrador y usuario.
// ==============================================================================================================================

// Login principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'PrincipalLogin.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'PrincipalLogin.html'));
});

app.get('/PrincipalLogin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'PrincipalLogin.html'));
});

app.get('/HTML/PrincipalLogin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'PrincipalLogin.html'));
});

// Registro usuario cliente
app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'RegistroUsuario.html'));
});

app.get('/RegistroUsuario.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'RegistroUsuario.html'));
});

app.get('/HTML/RegistroUsuario.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'RegistroUsuario.html'));
});

// Panel administrador
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'AdminLinaje.html'));
});

app.get('/AdminLinaje.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'AdminLinaje.html'));
});

app.get('/HTML/AdminLinaje.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'AdminLinaje.html'));
});

// Panel usuario / cliente
app.get('/usuario', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'UsuarioPrincipal.html'));
});

app.get('/UsuarioPrincipal.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'UsuarioPrincipal.html'));
});

app.get('/HTML/UsuarioPrincipal.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'UsuarioPrincipal.html'));
});


// ==============================================================================================================================
// 9. API PARA PROBAR LA BASE DE DATOS
// Qué hace: permite verificar desde el navegador o frontend si SQL Server está conectado correctamente.
// Ruta: GET /api/test-db
// ==============================================================================================================================
app.get('/api/test-db', async (req, res) => {
    try {
        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                ok: false,
                mensaje: "No se pudo conectar a SISTEMA_WEB_SCANNER"
            });
        }

        const result = await sebas.request().query(`
            SELECT 
                DB_NAME() AS baseDeDatos,
                GETDATE() AS fechaServidor,
                1 AS activo
        `);

        res.json({
            ok: true,
            mensaje: "Conexión exitosa con SISTEMA_WEB_SCANNER",
            data: result.recordset
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: "Error consultando SISTEMA_WEB_SCANNER",
            error: error.message
        });
    }
});


// ==============================================================================================================================
// 10. API LOGIN DE CUENTAS LINAJE
// Qué hace: valida usuario y contraseña, compara la contraseña encriptada y devuelve el rol de la cuenta.
// Ruta: POST /api/login
// ==============================================================================================================================
app.post('/api/login', async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;

        if (!usuario || !contrasena) {
            return res.status(400).json({
                success: false,
                message: "Debe ingresar usuario y contraseña"
            });
        }

        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos"
            });
        }

        const result = await sebas
            .request()
            .input('usuario', sql.NVarChar, usuario)
            .query(`
                SELECT id, usuario, contrasena, rol
                FROM CuentaLinaje
                WHERE usuario = @usuario
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Usuario o contraseña incorrectos"
            });
        }

        const cuenta = result.recordset[0];
        const contrasenaValida = await bcrypt.compare(contrasena, cuenta.contrasena);

        if (!contrasenaValida) {
            return res.status(401).json({
                success: false,
                message: "Usuario o contraseña incorrectos"
            });
        }

        res.json({
            success: true,
            message: "Inicio de sesión correcto",
            cuenta: {
                id: cuenta.id,
                usuario: cuenta.usuario,
                rol: Number(cuenta.rol)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error en el servidor al iniciar sesión",
            error: error.message
        });
    }
});

// ==============================================================================================================================
// API LOGIN FACIAL
// Qué hace: permite iniciar sesión con usuario y reconocimiento facial comparando la captura actual con el rostro registrado.
// Ruta: POST /api/login-facial
// ==============================================================================================================================
app.post('/api/login-facial', async (req, res) => {
    try {
        const { usuario, imagenRostro } = req.body;

        if (!usuario || !imagenRostro) {
            return res.status(400).json({
                success: false,
                message: "Debe ingresar usuario y capturar el rostro"
            });
        }

        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos"
            });
        }

        const result = await sebas
            .request()
            .input('usuario', sql.NVarChar, usuario)
            .query(`
                SELECT 
                    c.id,
                    c.usuario,
                    c.rol,
                    cl.id_cliente,
                    cl.nombres,
                    cl.apellidos,
                    cl.rostro_ruta
                FROM CuentaLinaje c
                INNER JOIN ClienteLinaje cl ON c.id = cl.id_cuenta
                WHERE c.usuario = @usuario
                  AND c.rol = 0
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No se encontró un cliente registrado con ese usuario"
            });
        }

        const cliente = result.recordset[0];

        if (!cliente.rostro_ruta) {
            return res.status(400).json({
                success: false,
                message: "El cliente no tiene rostro registrado"
            });
        }

        const rutaImagenRegistrada = path.join(
            __dirname,
            cliente.rostro_ruta.replace(/^\//, '')
        );

        if (!fs.existsSync(rutaImagenRegistrada)) {
            return res.status(404).json({
                success: false,
                message: "No se encontró la imagen facial registrada"
            });
        }

        const carpetaValidaciones = path.join(__dirname, 'IMG', 'Rostros', 'Validaciones');

        if (!fs.existsSync(carpetaValidaciones)) {
            fs.mkdirSync(carpetaValidaciones, { recursive: true });
        }

        const base64Data = imagenRostro.replace(/^data:image\/png;base64,/, "");
        const nombreArchivo = `login_facial_${Date.now()}_${cliente.id}.png`;
        const rutaImagenActual = path.join(carpetaValidaciones, nombreArchivo);

        fs.writeFileSync(rutaImagenActual, base64Data, 'base64');

        const resultadoPython = await compararRostroConPython(
            rutaImagenRegistrada,
            rutaImagenActual
        );

        if (fs.existsSync(rutaImagenActual)) {
            fs.unlinkSync(rutaImagenActual);
        }

        if (!resultadoPython.success || !resultadoPython.verified) {
            return res.status(401).json({
                success: false,
                message: resultadoPython.message || "El rostro no coincide con el usuario registrado",
                verified: resultadoPython.verified || false,
                distance: resultadoPython.distance,
                threshold: resultadoPython.threshold
            });
        }

        return res.json({
            success: true,
            message: "Login facial correcto",
            verified: true,
            distance: resultadoPython.distance,
            threshold: resultadoPython.threshold,
            cuenta: {
                id: cliente.id,
                usuario: cliente.usuario,
                rol: Number(cliente.rol),
                id_cliente: cliente.id_cliente,
                nombres: cliente.nombres,
                apellidos: cliente.apellidos
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al iniciar sesión con reconocimiento facial",
            error: error.message
        });
    }
});


// ==============================================================================================================================
// 11. API REGISTRO DE CLIENTE CON SCANNER FACIAL
// Qué hace: registra una cuenta cliente, guarda la imagen facial, valida el rostro con Python e inserta datos en CuentaLinaje y ClienteLinaje.
// Ruta: POST /api/registro-cliente
// ==============================================================================================================================
app.post('/api/registro-cliente', async (req, res) => {
    try {
        const {
            usuario,
            nombres,
            apellidos,
            celular,
            direccion,
            referencia,
            contrasena,
            imagenRostro
        } = req.body;

        if (!usuario || !nombres || !apellidos || !celular || !direccion || !contrasena || !imagenRostro) {
            return res.status(400).json({
                success: false,
                message: "Debe completar todos los campos obligatorios y capturar el rostro"
            });
        }

        if (!/^[0-9]{9,15}$/.test(celular)) {
            return res.status(400).json({
                success: false,
                message: "Ingrese un número de celular válido"
            });
        }

        if (contrasena.length < 6) {
            return res.status(400).json({
                success: false,
                message: "La contraseña debe tener mínimo 6 caracteres"
            });
        }

        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos"
            });
        }

        const existeUsuario = await sebas
            .request()
            .input('usuario', sql.NVarChar, usuario)
            .query(`
                SELECT id
                FROM CuentaLinaje
                WHERE usuario = @usuario
            `);

        if (existeUsuario.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: "El usuario ya existe"
            });
        }

        const carpetaRostros = path.join(__dirname, 'IMG', 'Rostros');

        if (!fs.existsSync(carpetaRostros)) {
            fs.mkdirSync(carpetaRostros, { recursive: true });
        }

        const base64Data = imagenRostro.replace(/^data:image\/png;base64,/, "");
        const nombreSeguroUsuario = usuario.replace(/[^a-zA-Z0-9_-]/g, '');
        const nombreArchivo = `rostro_${Date.now()}_${nombreSeguroUsuario}.png`;
        const rutaImagen = path.join(carpetaRostros, nombreArchivo);

        fs.writeFileSync(rutaImagen, base64Data, 'base64');

        const resultadoPython = await validarRostroConPython(rutaImagen);

        if (!resultadoPython.success) {
            if (fs.existsSync(rutaImagen)) {
                fs.unlinkSync(rutaImagen);
            }

            return res.status(400).json({
                success: false,
                message: resultadoPython.message
            });
        }

        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);
        const transaction = new sql.Transaction(sebas);

        await transaction.begin();

        try {
            const cuentaResult = await new sql.Request(transaction)
                .input('usuario', sql.NVarChar, usuario)
                .input('contrasena', sql.NVarChar, contrasenaEncriptada)
                .input('rol', sql.Int, 0)
                .query(`
                    INSERT INTO CuentaLinaje (usuario, contrasena, rol)
                    OUTPUT INSERTED.id
                    VALUES (@usuario, @contrasena, @rol)
                `);

            const idCuenta = cuentaResult.recordset[0].id;
            const rutaRelativa = `/IMG/Rostros/${nombreArchivo}`;

            await new sql.Request(transaction)
                .input('id_cuenta', sql.Int, idCuenta)
                .input('nombres', sql.NVarChar, nombres)
                .input('apellidos', sql.NVarChar, apellidos)
                .input('celular', sql.NVarChar, celular)
                .input('direccion', sql.NVarChar, direccion)
                .input('referencia', sql.NVarChar, referencia || '')
                .input('rostro_ruta', sql.NVarChar, rutaRelativa)
                .input('rostro_codigo', sql.NVarChar, resultadoPython.rostro_codigo)
                .query(`
                    INSERT INTO ClienteLinaje (
                        id_cuenta,
                        nombres,
                        apellidos,
                        celular,
                        direccion,
                        referencia,
                        rostro_ruta,
                        rostro_codigo
                    )
                    VALUES (
                        @id_cuenta,
                        @nombres,
                        @apellidos,
                        @celular,
                        @direccion,
                        @referencia,
                        @rostro_ruta,
                        @rostro_codigo
                    )
                `);

            await transaction.commit();

            return res.json({
                success: true,
                message: "Cliente registrado correctamente con scanner facial",
                cuenta: {
                    id: idCuenta,
                    usuario: usuario,
                    nombres: nombres,
                    apellidos: apellidos,
                    celular: celular,
                    direccion: direccion,
                    referencia: referencia || '',
                    rol: 0
                }
            });

        } catch (errorTransaction) {
            await transaction.rollback();

            if (fs.existsSync(rutaImagen)) {
                fs.unlinkSync(rutaImagen);
            }

            throw errorTransaction;
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al registrar cliente",
            error: error.message
        });
    }
});
// ==============================================================================================================================
// API VALIDAR IDENTIDAD FACIAL DEL CLIENTE
// Qué hace: recibe una imagen capturada desde el frontend, busca el rostro registrado del cliente y compara ambos rostros con DeepFace.
// Ruta: POST /api/validar-rostro
// ==============================================================================================================================
app.post('/api/validar-rostro', async (req, res) => {
    try {
        const { idCuenta, imagenRostro } = req.body;

        if (!idCuenta || !imagenRostro) {
            return res.status(400).json({
                success: false,
                message: "Debe enviar el ID de cuenta y la imagen del rostro"
            });
        }

        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos"
            });
        }

        const clienteResult = await sebas
            .request()
            .input('id_cuenta', sql.Int, Number(idCuenta))
            .query(`
                SELECT 
                    id_cliente,
                    id_cuenta,
                    nombres,
                    apellidos,
                    celular,
                    direccion,
                    referencia,
                    rostro_ruta
                FROM ClienteLinaje
                WHERE id_cuenta = @id_cuenta
            `);

        if (clienteResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No se encontró un cliente asociado a esta cuenta"
            });
        }

        const cliente = clienteResult.recordset[0];

        if (!cliente.rostro_ruta) {
            return res.status(400).json({
                success: false,
                message: "El cliente no tiene rostro registrado"
            });
        }

        const rutaImagenRegistrada = path.join(
            __dirname,
            cliente.rostro_ruta.replace(/^\//, '')
        );

        if (!fs.existsSync(rutaImagenRegistrada)) {
            return res.status(404).json({
                success: false,
                message: "No se encontró la imagen facial registrada"
            });
        }

        const carpetaValidaciones = path.join(__dirname, 'IMG', 'Rostros', 'Validaciones');

        if (!fs.existsSync(carpetaValidaciones)) {
            fs.mkdirSync(carpetaValidaciones, { recursive: true });
        }

        const base64Data = imagenRostro.replace(/^data:image\/png;base64,/, "");
        const nombreArchivo = `validacion_${Date.now()}_${idCuenta}.png`;
        const rutaImagenActual = path.join(carpetaValidaciones, nombreArchivo);

        fs.writeFileSync(rutaImagenActual, base64Data, 'base64');

        const resultadoPython = await compararRostroConPython(
            rutaImagenRegistrada,
            rutaImagenActual
        );

        if (fs.existsSync(rutaImagenActual)) {
            fs.unlinkSync(rutaImagenActual);
        }

        if (!resultadoPython.success || !resultadoPython.verified) {
            return res.status(401).json({
                success: false,
                message: resultadoPython.message,
                verified: resultadoPython.verified,
                distance: resultadoPython.distance,
                threshold: resultadoPython.threshold
            });
        }
        if (!resultadoPython.success || !resultadoPython.verified) {
            return res.status(401).json({
                success: false,
                message: resultadoPython.message || "El rostro no coincide con el cliente registrado",
                verified: resultadoPython.verified || false,
                distance: resultadoPython.distance,
                threshold: resultadoPython.threshold
            });
        }

        return res.json({
            success: true,
            message: "Identidad facial validada correctamente",
            verified: true,
            distance: resultadoPython.distance,
            threshold: resultadoPython.threshold,
            cliente: {
                id_cliente: cliente.id_cliente,
                id_cuenta: cliente.id_cuenta,
                nombres: cliente.nombres,
                apellidos: cliente.apellidos,
                celular: cliente.celular,
                direccion: cliente.direccion,
                referencia: cliente.referencia
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al validar identidad facial",
            error: error.message
        });
    }
});

// ==============================================================================================================================
// API OBTENER DATOS DEL CLIENTE
// Qué hace: obtiene los datos personales del cliente autenticado para mostrarlos en el perfil.
// Ruta: GET /api/cliente/:idCliente
// ==============================================================================================================================
app.get('/api/cliente/:idCliente', async (req, res) => {
    try {
        const { idCliente } = req.params;

        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos"
            });
        }

        const result = await sebas
            .request()
            .input('id_cliente', sql.Int, Number(idCliente))
            .query(`
                SELECT 
                    cl.id_cliente,
                    cl.id_cuenta,
                    c.usuario,
                    cl.nombres,
                    cl.apellidos,
                    cl.celular,
                    cl.direccion,
                    cl.referencia
                FROM ClienteLinaje cl
                INNER JOIN CuentaLinaje c ON cl.id_cuenta = c.id
                WHERE cl.id_cliente = @id_cliente
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cliente no encontrado"
            });
        }

        return res.json({
            success: true,
            cliente: result.recordset[0]
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener datos del cliente",
            error: error.message
        });
    }
});


// ==============================================================================================================================
// API ACTUALIZAR DATOS DEL CLIENTE
// Qué hace: permite que el cliente edite sus propios datos personales.
// Ruta: PUT /api/cliente/:idCliente
// ==============================================================================================================================
app.put('/api/cliente/:idCliente', async (req, res) => {
    try {
        const { idCliente } = req.params;
        const {
            nombres,
            apellidos,
            celular,
            direccion,
            referencia
        } = req.body;

        if (!nombres || !apellidos || !celular || !direccion) {
            return res.status(400).json({
                success: false,
                message: "Debe completar nombres, apellidos, celular y dirección"
            });
        }

        if (!/^[0-9]{9,15}$/.test(celular)) {
            return res.status(400).json({
                success: false,
                message: "Ingrese un celular válido"
            });
        }

        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos"
            });
        }

        const existe = await sebas
            .request()
            .input('id_cliente', sql.Int, Number(idCliente))
            .query(`
                SELECT id_cliente
                FROM ClienteLinaje
                WHERE id_cliente = @id_cliente
            `);

        if (existe.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cliente no encontrado"
            });
        }

        await sebas
            .request()
            .input('id_cliente', sql.Int, Number(idCliente))
            .input('nombres', sql.VarChar, nombres)
            .input('apellidos', sql.VarChar, apellidos)
            .input('celular', sql.VarChar, celular)
            .input('direccion', sql.VarChar, direccion)
            .input('referencia', sql.VarChar, referencia || '')
            .query(`
                UPDATE ClienteLinaje
                SET 
                    nombres = @nombres,
                    apellidos = @apellidos,
                    celular = @celular,
                    direccion = @direccion,
                    referencia = @referencia
                WHERE id_cliente = @id_cliente
            `);

        return res.json({
            success: true,
            message: "Datos actualizados correctamente"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al actualizar datos del cliente",
            error: error.message
        });
    }
});

// ==============================================================================================================================
// 12. API RESUMEN DEL PANEL ADMINISTRADOR
// Qué hace: obtiene el total de cuentas, administradores y clientes registrados.
// Ruta: GET /api/admin/resumen
// ==============================================================================================================================
app.get('/api/admin/resumen', async (req, res) => {
    try {
        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos"
            });
        }

        const result = await sebas.request().query(`
            SELECT
                COUNT(*) AS totalCuentas,
                SUM(CASE WHEN rol = 1 THEN 1 ELSE 0 END) AS totalAdmins,
                SUM(CASE WHEN rol = 0 THEN 1 ELSE 0 END) AS totalClientes
            FROM CuentaLinaje
        `);

        res.json({
            success: true,
            resumen: {
                totalCuentas: result.recordset[0].totalCuentas || 0,
                totalAdmins: result.recordset[0].totalAdmins || 0,
                totalClientes: result.recordset[0].totalClientes || 0
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al cargar el resumen del administrador",
            error: error.message
        });
    }
});


// ==============================================================================================================================
// 13. API LISTAR CUENTAS DEL ADMINISTRADOR
// Qué hace: lista todas las cuentas registradas, ordenadas desde la más reciente.
// Ruta: GET /api/admin/cuentas
// ==============================================================================================================================
app.get('/api/admin/cuentas', async (req, res) => {
    try {
        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos"
            });
        }

        const result = await sebas.request().query(`
            SELECT 
                id,
                usuario,
                rol,
                fecha_creacion
            FROM CuentaLinaje
            ORDER BY id DESC
        `);

        res.json({
            success: true,
            cuentas: result.recordset
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al listar las cuentas",
            error: error.message
        });
    }
});


// ==============================================================================================================================
// 14. API LISTAR CLIENTES REGISTRADOS CON ROSTRO
// Qué hace: lista solo las cuentas con rol cliente y une sus datos con ClienteLinaje.
// Ruta: GET /api/admin/clientes
// ==============================================================================================================================
app.get('/api/admin/clientes', async (req, res) => {
    try {
        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos"
            });
        }

        const result = await sebas.request().query(`
            SELECT 
                c.id,
                c.usuario,
                c.rol,
                c.fecha_creacion,
                cl.id_cliente,
                cl.nombres,
                cl.apellidos,
                cl.celular,
                cl.direccion,
                cl.referencia,
                cl.rostro_ruta,
                cl.rostro_codigo,
                cl.fecha_registro
            FROM CuentaLinaje c
            LEFT JOIN ClienteLinaje cl ON c.id = cl.id_cuenta
            WHERE c.rol = 0
            ORDER BY c.id DESC
        `);

        res.json({
            success: true,
            clientes: result.recordset
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al listar clientes",
            error: error.message
        });
    }
});


// ==============================================================================================================================
// 15. API CREAR CUENTA DESDE EL PANEL ADMINISTRADOR
// Qué hace: permite al administrador crear cuentas cliente o administrador con contraseña encriptada.
// Ruta: POST /api/admin/crear-cuenta
// ==============================================================================================================================
app.post('/api/admin/crear-cuenta', async (req, res) => {
    try {
        const { usuario, contrasena, rol } = req.body;

        if (!usuario || !contrasena || rol === undefined) {
            return res.status(400).json({
                success: false,
                message: "Debe completar usuario, contraseña y rol"
            });
        }

        if (![0, 1].includes(Number(rol))) {
            return res.status(400).json({
                success: false,
                message: "Rol inválido. Use 0 para usuario o 1 para administrador"
            });
        }

        if (contrasena.length < 6) {
            return res.status(400).json({
                success: false,
                message: "La contraseña debe tener mínimo 6 caracteres"
            });
        }

        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos"
            });
        }

        const existeUsuario = await sebas
            .request()
            .input('usuario', sql.NVarChar, usuario)
            .query(`
                SELECT id
                FROM CuentaLinaje
                WHERE usuario = @usuario
            `);

        if (existeUsuario.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: "El usuario ya existe"
            });
        }

        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        await sebas
            .request()
            .input('usuario', sql.NVarChar, usuario)
            .input('contrasena', sql.NVarChar, contrasenaEncriptada)
            .input('rol', sql.Int, Number(rol))
            .query(`
                INSERT INTO CuentaLinaje (usuario, contrasena, rol)
                VALUES (@usuario, @contrasena, @rol)
            `);

        res.json({
            success: true,
            message: "Cuenta creada correctamente"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al crear la cuenta",
            error: error.message
        });
    }
});


// ==============================================================================================================================
// 16. API ELIMINAR CUENTA DESDE EL PANEL ADMINISTRADOR
// Qué hace: elimina una cuenta, elimina sus datos de ClienteLinaje si existen y borra la imagen física del rostro.
// Ruta: DELETE /api/admin/eliminar-cuenta/:id
// ==============================================================================================================================
app.delete('/api/admin/eliminar-cuenta/:id', async (req, res) => {
    let transaction;

    try {
        const { id } = req.params;

        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos"
            });
        }

        const existeCuenta = await sebas
            .request()
            .input('id', sql.Int, id)
            .query(`
                SELECT id, usuario, rol
                FROM CuentaLinaje
                WHERE id = @id
            `);

        if (existeCuenta.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "La cuenta no existe"
            });
        }

        const cuenta = existeCuenta.recordset[0];

        const clienteResult = await sebas
            .request()
            .input('id_cuenta', sql.Int, id)
            .query(`
                SELECT id_cliente, rostro_ruta
                FROM ClienteLinaje
                WHERE id_cuenta = @id_cuenta
            `);

        transaction = new sql.Transaction(sebas);
        await transaction.begin();

        try {
            await new sql.Request(transaction)
                .input('id_cuenta', sql.Int, id)
                .query(`
                    DELETE FROM ClienteLinaje
                    WHERE id_cuenta = @id_cuenta
                `);

            await new sql.Request(transaction)
                .input('id', sql.Int, id)
                .query(`
                    DELETE FROM CuentaLinaje
                    WHERE id = @id
                `);

            await transaction.commit();

            if (clienteResult.recordset.length > 0) {
                const rostroRuta = clienteResult.recordset[0].rostro_ruta;

                if (rostroRuta) {
                    const rutaFisica = path.join(__dirname, rostroRuta.replace(/^\//, ''));

                    if (fs.existsSync(rutaFisica)) {
                        fs.unlinkSync(rutaFisica);
                    }
                }
            }

            return res.json({
                success: true,
                message: `Cuenta "${cuenta.usuario}" eliminada correctamente`
            });

        } catch (errorTransaction) {
            await transaction.rollback();

            return res.status(500).json({
                success: false,
                message: "Error al eliminar la cuenta en la base de datos",
                error: errorTransaction.message
            });
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al eliminar la cuenta",
            error: error.message
        });
    }
});

// ==============================================================================================================================
// IA PROLOG - FUNCIONES AUXILIARES
// ==============================================================================================================================
function escaparTextoProlog(texto) {
    return String(texto || "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}

function convertirCategoriaProlog(categoria) {
    return String(categoria || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
}

async function generarHechosPrologDesdeSQL(idCliente) {
    const sebas = await global.conectarSebasDB();

    if (!sebas) {
        throw new Error("No se pudo conectar con la base de datos");
    }

    const productosResult = await sebas.request().query(`
        SELECT 
            id_producto,
            nombre,
            categoria,
            precio,
            imagen_ruta
        FROM ProductoLinaje
        WHERE estado = 1
        ORDER BY id_producto
    `);

    const comprasResult = await sebas
        .request()
        .input("id_cliente", sql.Int, Number(idCliente))
        .query(`
            SELECT DISTINCT
                dp.id_producto
            FROM PedidoLinaje p
            INNER JOIN DetallePedidoLinaje dp ON p.id_pedido = dp.id_pedido
            WHERE p.id_cliente = @id_cliente
        `);

    let contenido = "";

    contenido += "% Archivo generado automaticamente desde SQL Server\n";
    contenido += `% Cliente: ${idCliente}\n\n`;

    productosResult.recordset.forEach(producto => {
        const idProducto = Number(producto.id_producto);
        const nombre = escaparTextoProlog(producto.nombre);
        const categoria = convertirCategoriaProlog(producto.categoria);
        const precio = Number(producto.precio || 0);
        const imagen = escaparTextoProlog(producto.imagen_ruta || "");

        contenido += `producto(${idProducto}, '${nombre}', ${categoria}, ${precio}, '${imagen}').\n`;
    });

    contenido += "\n";

    comprasResult.recordset.forEach(compra => {
        contenido += `compra(${Number(idCliente)}, ${Number(compra.id_producto)}).\n`;
    });

    const carpetaProlog = path.join(__dirname, "prolog");

    if (!fs.existsSync(carpetaProlog)) {
        fs.mkdirSync(carpetaProlog);
    }

    const rutaHechos = path.join(carpetaProlog, `hechos_cliente_${idCliente}.pl`);

    fs.writeFileSync(rutaHechos, contenido, "utf8");

    return rutaHechos;
}

function ejecutarPrologRecomendaciones(idCliente, rutaHechos) {
    return new Promise((resolve, reject) => {
        const rutaSwipl = "C:\\Program Files\\swipl\\bin\\swipl.exe";
        const rutaReglas = path.join(__dirname, "prolog", "reglas_linaje.pl");
        const consulta = `responder_recomendaciones(${idCliente}),halt.`;

        execFile(
            rutaSwipl,
            ["-q", "-s", rutaHechos, "-s", rutaReglas, "-g", consulta],
            { windowsHide: true },
            (error, stdout, stderr) => {
                if (error) {
                    return reject(new Error(stderr || error.message));
                }

                try {
                    const resultado = JSON.parse(stdout);
                    resolve(resultado);
                } catch (parseError) {
                    reject(new Error("Prolog no devolvió JSON válido: " + stdout));
                }
            }
        );
    });
}

// ==============================================================================================================================
// IA PROLOG - RECOMENDACIONES INTELIGENTES DESDE SQL SERVER
// Qué hace: genera hechos Prolog desde ProductoLinaje, PedidoLinaje y DetallePedidoLinaje.
// Ruta: GET /api/ia/recomendaciones/:idCliente
// ==============================================================================================================================
app.get("/api/ia/recomendaciones/:idCliente", async (req, res) => {
    try {
        const idCliente = Number(req.params.idCliente);

        if (!idCliente) {
            return res.status(400).json({
                success: false,
                message: "ID de cliente no válido."
            });
        }

        const rutaHechos = await generarHechosPrologDesdeSQL(idCliente);
        const resultado = await ejecutarPrologRecomendaciones(idCliente, rutaHechos);

        return res.json(resultado);

    } catch (error) {
        console.error("Error en recomendaciones Prolog:", error);

        return res.status(500).json({
            success: false,
            message: "Error ejecutando recomendaciones inteligentes con Prolog.",
            error: error.message
        });
    }
});

// ==============================================================================================================================
// PEDIDOS - VALIDAR ROSTRO Y REGISTRAR PEDIDO
// Ruta: POST /api/pedidos/validar-rostro-y-registrar
// Qué hace:
// 1. Recibe carrito e imagen facial actual.
// 2. Busca el rostro registrado del cliente.
// 3. Valida identidad con py/validar_rostro.py usando Python del .venv.
// 4. Si el rostro coincide, registra PedidoLinaje y DetallePedidoLinaje.
// ==============================================================================================================================
app.post("/api/pedidos/validar-rostro-y-registrar", async (req, res) => {
    try {
        const { id_cliente, metodo_pago, carrito, imagenRostro } = req.body;

        if (!id_cliente || !Array.isArray(carrito) || carrito.length === 0 || !imagenRostro) {
            return res.status(400).json({
                success: false,
                message: "Datos incompletos para registrar el pedido."
            });
        }

        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos."
            });
        }

        // =====================================================================
        // BUSCAR CLIENTE Y ROSTRO REGISTRADO
        // =====================================================================
        const clienteResult = await sebas
            .request()
            .input("id_cliente", sql.Int, Number(id_cliente))
            .query(`
                SELECT 
                    id_cliente,
                    rostro_ruta
                FROM ClienteLinaje
                WHERE id_cliente = @id_cliente
            `);

        if (clienteResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cliente no encontrado."
            });
        }

        const cliente = clienteResult.recordset[0];

        if (!cliente.rostro_ruta) {
            return res.status(400).json({
                success: false,
                message: "El cliente no tiene rostro registrado."
            });
        }

        // =====================================================================
        // GUARDAR IMAGEN ACTUAL CAPTURADA PARA VALIDACIÓN
        // =====================================================================
        const base64Data = imagenRostro.replace(/^data:image\/png;base64,/, "");
        const nombreValidacion = `validacion_pedido_${Date.now()}_${id_cliente}.png`;

        const carpetaValidaciones = path.join(__dirname, "IMG", "Rostros", "Validaciones");

        if (!fs.existsSync(carpetaValidaciones)) {
            fs.mkdirSync(carpetaValidaciones, { recursive: true });
        }

        const rutaImagenActual = path.join(carpetaValidaciones, nombreValidacion);
        fs.writeFileSync(rutaImagenActual, base64Data, "base64");

        const rutaImagenRegistrada = path.join(
            __dirname,
            cliente.rostro_ruta.replace(/^\/+/, "")
        );

        if (!fs.existsSync(rutaImagenRegistrada)) {
            return res.status(400).json({
                success: false,
                message: "No se encontró la imagen del rostro registrado.",
                ruta: rutaImagenRegistrada
            });
        }

            // =====================================================================
            // VALIDAR ROSTRO CON PYTHON DEL ENTORNO VIRTUAL
            // =====================================================================
            const rutaPython = path.join(__dirname, "py", "validar_rostro.py");
            const rutaPythonExe = path.join(__dirname, ".venv", "Scripts", "python.exe");

            if (!fs.existsSync(rutaPythonExe)) {
                return res.status(500).json({
                    success: false,
                    message: "No se encontró el Python del entorno virtual .venv.",
                    ruta: rutaPythonExe
                });
            }

            if (!fs.existsSync(rutaPython)) {
                return res.status(500).json({
                    success: false,
                    message: "No se encontró el archivo validar_rostro.py.",
                    ruta: rutaPython
                });
            }

            console.log("Python usado para DeepFace:", rutaPythonExe);

            let resultadoFacial = null;

            try {
                resultadoFacial = await new Promise((resolve, reject) => {
                    execFile(
                        rutaPythonExe,
                        [rutaPython, rutaImagenRegistrada, rutaImagenActual],
                        { windowsHide: true },
                        (error, stdout, stderr) => {
                            if (error) {
                                return reject(new Error(stderr || error.message));
                            }

                            try {
                                resolve(JSON.parse(stdout));
                            } catch (parseError) {
                                reject(new Error("Python no devolvió JSON válido: " + stdout));
                            }
                        }
                    );
                });
            } finally {
                if (fs.existsSync(rutaImagenActual)) {
                    fs.unlinkSync(rutaImagenActual);
                }
            }

            if (!resultadoFacial.success || !resultadoFacial.verified) {
                return res.status(401).json({
                    success: false,
                    message: resultadoFacial.message || "La validación facial no fue aprobada.",
                    facial: resultadoFacial
                });
}

        // =====================================================================
        // VALIDAR PRODUCTOS DEL CARRITO
        // =====================================================================
        for (const item of carrito) {
            if (!item.id_producto || !item.cantidad || !item.precio) {
                return res.status(400).json({
                    success: false,
                    message: "El carrito contiene productos con datos incompletos."
                });
            }

            if (Number(item.cantidad) <= 0 || Number(item.precio) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "El carrito contiene cantidades o precios no válidos."
                });
            }
        }

        const total = carrito.reduce((sum, item) => {
            return sum + Number(item.precio) * Number(item.cantidad);
        }, 0);

        // =====================================================================
        // REGISTRAR PEDIDO Y DETALLE EN TRANSACCIÓN
        // =====================================================================
        const transaction = new sql.Transaction(sebas);

        await transaction.begin();

        try {
            const pedidoRequest = new sql.Request(transaction);

            const pedidoResult = await pedidoRequest
                .input("id_cliente", sql.Int, Number(id_cliente))
                .input("estado", sql.VarChar(30), "Registrado")
                .input("metodo_pago", sql.VarChar(50), metodo_pago || "Efectivo")
                .input("total", sql.Decimal(10, 2), Number(total.toFixed(2)))
                .query(`
                    INSERT INTO PedidoLinaje 
                    (id_cliente, estado, metodo_pago, total)
                    OUTPUT INSERTED.id_pedido
                    VALUES 
                    (@id_cliente, @estado, @metodo_pago, @total)
                `);

            const idPedido = pedidoResult.recordset[0].id_pedido;

            for (const item of carrito) {
                const cantidad = Number(item.cantidad);
                const precioUnitario = Number(item.precio);
                const subtotal = cantidad * precioUnitario;

                const detalleRequest = new sql.Request(transaction);

                await detalleRequest
                    .input("id_pedido", sql.Int, idPedido)
                    .input("id_producto", sql.Int, Number(item.id_producto))
                    .input("cantidad", sql.Int, cantidad)
                    .input("precio_unitario", sql.Decimal(10, 2), Number(precioUnitario.toFixed(2)))
                    .input("subtotal", sql.Decimal(10, 2), Number(subtotal.toFixed(2)))
                    .query(`
                        INSERT INTO DetallePedidoLinaje
                        (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
                        VALUES
                        (@id_pedido, @id_producto, @cantidad, @precio_unitario, @subtotal)
                    `);
            }

            await transaction.commit();

            return res.json({
                success: true,
                message: "Identidad facial validada y pedido registrado correctamente.",
                id_pedido: idPedido,
                total: Number(total.toFixed(2)),
                facial: resultadoFacial
            });

        } catch (errorTransaction) {
            await transaction.rollback();
            throw errorTransaction;
        }

    } catch (error) {
        console.error("Error registrando pedido con validación facial:", error);

        return res.status(500).json({
            success: false,
            message: "Error interno al registrar el pedido.",
            error: error.message
        });
    }
});

// ==============================================================================================================================
// PEDIDOS - LISTAR PEDIDOS DEL CLIENTE
// Ruta: GET /api/pedidos/cliente/:idCliente
// ==============================================================================================================================
app.get("/api/pedidos/cliente/:idCliente", async (req, res) => {
    try {
        const idCliente = Number(req.params.idCliente);

        if (!idCliente) {
            return res.status(400).json({
                success: false,
                message: "ID de cliente no válido."
            });
        }

        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos."
            });
        }

        const pedidosResult = await sebas
            .request()
            .input("id_cliente", sql.Int, idCliente)
            .query(`
                SELECT 
                    id_pedido,
                    id_cliente,
                    fecha_pedido,
                    estado,
                    metodo_pago,
                    total
                FROM PedidoLinaje
                WHERE id_cliente = @id_cliente
                ORDER BY fecha_pedido DESC
            `);

        return res.json({
            success: true,
            pedidos: pedidosResult.recordset
        });

    } catch (error) {
        console.error("Error listando pedidos del cliente:", error);

        return res.status(500).json({
            success: false,
            message: "Error interno al cargar pedidos.",
            error: error.message
        });
    }
});

// ==============================================================================================================================
// PEDIDOS - DETALLE DE PEDIDO DEL CLIENTE
// Ruta: GET /api/pedidos/detalle/:idPedido
// ==============================================================================================================================
app.get("/api/pedidos/detalle/:idPedido", async (req, res) => {
    try {
        const idPedido = Number(req.params.idPedido);

        if (!idPedido) {
            return res.status(400).json({
                success: false,
                message: "ID de pedido no válido."
            });
        }

        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos."
            });
        }

        const pedidoResult = await sebas
            .request()
            .input("id_pedido", sql.Int, idPedido)
            .query(`
                SELECT 
                    id_pedido,
                    id_cliente,
                    fecha_pedido,
                    estado,
                    metodo_pago,
                    total
                FROM PedidoLinaje
                WHERE id_pedido = @id_pedido
            `);

        if (pedidoResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado."
            });
        }

        const detalleResult = await sebas
            .request()
            .input("id_pedido", sql.Int, idPedido)
            .query(`
                SELECT 
                    dp.id_detalle,
                    dp.id_pedido,
                    dp.id_producto,
                    p.nombre,
                    p.descripcion,
                    p.categoria,
                    p.imagen_ruta,
                    dp.cantidad,
                    dp.precio_unitario,
                    dp.subtotal
                FROM DetallePedidoLinaje dp
                INNER JOIN ProductoLinaje p ON dp.id_producto = p.id_producto
                WHERE dp.id_pedido = @id_pedido
                ORDER BY dp.id_detalle
            `);

        return res.json({
            success: true,
            pedido: pedidoResult.recordset[0],
            detalle: detalleResult.recordset
        });

    } catch (error) {
        console.error("Error cargando detalle del pedido:", error);

        return res.status(500).json({
            success: false,
            message: "Error interno al cargar el detalle del pedido.",
            error: error.message
        });
    }
});

// ==============================================================================================================================
// ADMIN - LISTAR TODOS LOS PEDIDOS
// Ruta: GET /api/admin/pedidos
// ==============================================================================================================================
app.get("/api/admin/pedidos", async (req, res) => {
    try {
        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos."
            });
        }

        const result = await sebas.request().query(`
            SELECT 
                p.id_pedido,
                p.id_cliente,
                c.nombres,
                c.apellidos,
                c.celular,
                p.fecha_pedido,
                p.estado,
                p.metodo_pago,
                p.total
            FROM PedidoLinaje p
            INNER JOIN ClienteLinaje c ON p.id_cliente = c.id_cliente
            ORDER BY p.fecha_pedido DESC
        `);

        return res.json({
            success: true,
            pedidos: result.recordset
        });

    } catch (error) {
        console.error("Error cargando pedidos admin:", error);

        return res.status(500).json({
            success: false,
            message: "Error interno al cargar pedidos.",
            error: error.message
        });
    }
});


// ==============================================================================================================================
// ADMIN - CAMBIAR ESTADO DEL PEDIDO
// Ruta: PUT /api/admin/pedidos/:idPedido/estado
// ==============================================================================================================================
app.put("/api/admin/pedidos/:idPedido/estado", async (req, res) => {
    try {
        const idPedido = Number(req.params.idPedido);
        const { estado } = req.body;

        if (!idPedido || !estado) {
            return res.status(400).json({
                success: false,
                message: "Datos incompletos para actualizar el estado."
            });
        }

        const estadosPermitidos = [
            "Registrado",
            "En preparación",
            "Listo",
            "Entregado",
            "Cancelado"
        ];

        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: "Estado no válido."
            });
        }

        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos."
            });
        }

        await sebas
            .request()
            .input("id_pedido", sql.Int, idPedido)
            .input("estado", sql.VarChar(30), estado)
            .query(`
                UPDATE PedidoLinaje
                SET estado = @estado
                WHERE id_pedido = @id_pedido
            `);

        return res.json({
            success: true,
            message: "Estado del pedido actualizado correctamente."
        });

    } catch (error) {
        console.error("Error actualizando estado del pedido:", error);

        return res.status(500).json({
            success: false,
            message: "Error interno al actualizar estado.",
            error: error.message
        });
    }
});


// ==============================================================================================================================
// ADMIN - DETALLE DE PEDIDO
// Ruta: GET /api/admin/pedidos/detalle/:idPedido
// ==============================================================================================================================
app.get("/api/admin/pedidos/detalle/:idPedido", async (req, res) => {
    try {
        const idPedido = Number(req.params.idPedido);

        if (!idPedido) {
            return res.status(400).json({
                success: false,
                message: "ID de pedido no válido."
            });
        }

        const sebas = await global.conectarSebasDB();

        if (!sebas) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con la base de datos."
            });
        }

        const pedidoResult = await sebas
            .request()
            .input("id_pedido", sql.Int, idPedido)
            .query(`
                SELECT 
                    p.id_pedido,
                    p.id_cliente,
                    c.nombres,
                    c.apellidos,
                    c.celular,
                    c.direccion,
                    c.referencia,
                    p.fecha_pedido,
                    p.estado,
                    p.metodo_pago,
                    p.total
                FROM PedidoLinaje p
                INNER JOIN ClienteLinaje c ON p.id_cliente = c.id_cliente
                WHERE p.id_pedido = @id_pedido
            `);

        if (pedidoResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado."
            });
        }

        const detalleResult = await sebas
            .request()
            .input("id_pedido", sql.Int, idPedido)
            .query(`
                SELECT 
                    dp.id_detalle,
                    dp.id_pedido,
                    dp.id_producto,
                    pr.nombre,
                    pr.descripcion,
                    pr.categoria,
                    pr.imagen_ruta,
                    dp.cantidad,
                    dp.precio_unitario,
                    dp.subtotal
                FROM DetallePedidoLinaje dp
                INNER JOIN ProductoLinaje pr ON dp.id_producto = pr.id_producto
                WHERE dp.id_pedido = @id_pedido
                ORDER BY dp.id_detalle
            `);

        return res.json({
            success: true,
            pedido: pedidoResult.recordset[0],
            detalle: detalleResult.recordset
        });

    } catch (error) {
        console.error("Error cargando detalle admin:", error);

        return res.status(500).json({
            success: false,
            message: "Error interno al cargar detalle.",
            error: error.message
        });
    }
});

// ==============================================================================================================================
// ADMIN - VER DETALLE DE PEDIDO EN MODAL
// ==============================================================================================================================
async function verDetallePedidoAdmin(idPedido) {
    const modal = document.getElementById("modalDetallePedidoAdmin");
    const resumen = document.getElementById("detalleAdminResumen");
    const contenido = document.getElementById("contenidoDetallePedidoAdmin");

    if (!modal || !contenido) {
        alert("No se encontró el modal de detalle del pedido.");
        return;
    }

    modal.classList.add("active");
    contenido.innerHTML = "<p>Cargando detalle del pedido...</p>";

    try {
        const respuesta = await fetch(`/api/admin/pedidos/detalle/${idPedido}`);
        const data = await respuesta.json();

        if (!data.success) {
            contenido.innerHTML = `<p>${data.message || "No se pudo cargar el detalle del pedido."}</p>`;
            return;
        }

        const pedido = data.pedido;
        const detalle = data.detalle || [];

        const clienteNombre = `${pedido.nombres || ""} ${pedido.apellidos || ""}`.trim();

        if (resumen) {
            resumen.textContent = `Pedido #${pedido.id_pedido} | ${formatearFechaAdminLinaje(pedido.fecha_pedido)} | Total: S/ ${Number(pedido.total).toFixed(2)}`;
        }

        document.getElementById("detalleAdminCliente").textContent = clienteNombre || "Cliente";
        document.getElementById("detalleAdminCelular").textContent = pedido.celular || "Sin celular";
        document.getElementById("detalleAdminMetodoPago").textContent = pedido.metodo_pago || "No definido";
        document.getElementById("detalleAdminEstado").textContent = pedido.estado || "Sin estado";
        document.getElementById("detalleAdminDireccion").textContent = pedido.direccion || "Sin dirección";
        document.getElementById("detalleAdminReferencia").textContent = pedido.referencia || "Sin referencia";

        if (detalle.length === 0) {
            contenido.innerHTML = "<p>Este pedido no tiene productos registrados.</p>";
            return;
        }

        contenido.innerHTML = "";

        detalle.forEach(item => {
            contenido.innerHTML += `
                <div class="detalle-admin-producto">
                    <img src="${item.imagen_ruta}" alt="${item.nombre}">

                    <div class="detalle-admin-producto-info">
                        <h4>${item.nombre}</h4>
                        <p>${item.descripcion || "Producto del restaurante Linaje."}</p>
                        <p>
                            Categoría: ${formatearCategoriaAdmin(item.categoria)} |
                            Cantidad: ${item.cantidad}
                        </p>
                    </div>

                    <div class="detalle-admin-producto-monto">
                        <span>S/ ${Number(item.precio_unitario).toFixed(2)} c/u</span>
                        S/ ${Number(item.subtotal).toFixed(2)}
                    </div>
                </div>
            `;
        });

        contenido.innerHTML += `
            <div class="detalle-admin-total">
                <span>Total del pedido</span>
                <strong>S/ ${Number(pedido.total).toFixed(2)}</strong>
            </div>
        `;

    } catch (error) {
        console.error("Error cargando detalle admin:", error);
        contenido.innerHTML = "<p>Error al conectar con el servidor.</p>";
    }
}

// ==============================================================================================================================
// ADMIN - MODAL DETALLE PEDIDO
// ==============================================================================================================================
function configurarModalDetallePedidoAdmin() {
    const modal = document.getElementById("modalDetallePedidoAdmin");
    const btnCerrar = document.getElementById("btnCerrarDetallePedidoAdmin");

    if (btnCerrar) {
        btnCerrar.addEventListener("click", cerrarDetallePedidoAdmin);
    }

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                cerrarDetallePedidoAdmin();
            }
        });
    }
}

function cerrarDetallePedidoAdmin() {
    const modal = document.getElementById("modalDetallePedidoAdmin");

    if (modal) {
        modal.classList.remove("active");
    }
}

function formatearCategoriaAdmin(categoria) {
    const categorias = {
        hamburguesa: "Hamburguesa",
        salchipapa: "Salchipapa",
        combo: "Combo",
        bebida: "Bebida",
        postre: "Postre"
    };

    return categorias[categoria] || categoria || "Sin categoría";
}

// ==============================================================================================================================
// 17. LEVANTAR SERVIDOR
// Qué hace: inicia el servidor en localhost:3000 y prueba automáticamente la conexión con SQL Server.
// ==============================================================================================================================
app.listen(PORT, async () => {
    console.log(`Servidor corriendo en http://localhost:${PORT} 🚀`);
    await global.testSebasConnection();
});