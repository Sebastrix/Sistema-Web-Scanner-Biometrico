// ==============================================================================================================================
// LOGIN TRADICIONAL - INICIALIZACIÓN
// ==============================================================================================================================
document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("formLogin");
    if (!formLogin) {
        console.error("No se encontró el formulario con id formLogin");
        return;
    }
    formLogin.addEventListener("submit", iniciarSesion);
});

// ==============================================================================================================================
// LOGIN TRADICIONAL - EVENTOS DEL MODAL FACIAL
// ==============================================================================================================================
document.addEventListener("DOMContentLoaded", () => {
    const btnAbrirLoginFacial    = document.getElementById("btnAbrirLoginFacial");
    const btnCerrarLoginFacial   = document.getElementById("btnCerrarLoginFacial");
    const btnActivarCamaraFacial = document.getElementById("btnActivarCamaraFacial");
    const btnCapturarLoginFacial = document.getElementById("btnCapturarLoginFacial");

    if (btnAbrirLoginFacial)    btnAbrirLoginFacial.addEventListener("click", abrirModalLoginFacial);
    if (btnCerrarLoginFacial)   btnCerrarLoginFacial.addEventListener("click", cerrarModalLoginFacial);
    if (btnActivarCamaraFacial) btnActivarCamaraFacial.addEventListener("click", activarCamaraFacial);
    if (btnCapturarLoginFacial) btnCapturarLoginFacial.addEventListener("click", capturarLoginFacial);
});

// ==============================================================================================================================
// LOGIN TRADICIONAL - FUNCIÓN PRINCIPAL
// ==============================================================================================================================
async function iniciarSesion(e) {
    e.preventDefault();

    const usuario    = document.getElementById("usuario").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();

    if (!usuario || !contrasena) {
        mostrarMensaje("Debe ingresar usuario y contraseña", "red");
        return;
    }

    mostrarMensaje("Validando usuario...", "#2a5298");

    try {
        const respuesta = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, contrasena })
        });

        const data = await respuesta.json();

        if (!data.success) {
            mostrarMensaje(data.message || "Usuario o contraseña incorrectos", "red");
            return;
        }

        localStorage.setItem("cuentaLinaje", JSON.stringify(data.cuenta));
        mostrarMensaje("Inicio de sesión correcto. Redirigiendo...", "green");
        setTimeout(() => redirigirPorRol(data.cuenta), 1000);

    } catch (error) {
        console.error("Error en login:", error);
        mostrarMensaje("Error al conectar con el servidor", "red");
    }
}

// ==============================================================================================================================
// LOGIN TRADICIONAL - REDIRECCIÓN POR ROL
// ==============================================================================================================================
function redirigirPorRol(cuenta) {
    if (!cuenta) { window.location.href = "/login"; return; }
    const rol = Number(cuenta.rol);
    if (rol === 1)      window.location.href = "/admin";
    else if (rol === 0) window.location.href = "/usuario";
    else {
        alert("Rol no reconocido. Comuníquese con el administrador.");
        localStorage.removeItem("cuentaLinaje");
        window.location.href = "/login";
    }
}

function mostrarMensaje(texto, color) {
    const mensaje = document.getElementById("mensajeLogin");
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.style.color = color;
}

// ==============================================================================================================================
// LOGIN FACIAL - VARIABLES DE ESTADO
// ==============================================================================================================================
let streamFacial      = null;
let modelosCargados   = false;
let loopDeteccion     = null;
let rostroEnPosicion  = false;

// ==============================================================================================================================
// LOGIN FACIAL - CARGAR MODELOS
// ==============================================================================================================================
async function cargarModelos() {
    if (modelosCargados) return true;

    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        console.log("Redes neuronales cargadas");
        modelosCargados = true;
        return true;
    } catch (error) {
        console.error("Error cargando redes:", error);
        mostrarMensajeFacial("Error crítico: No se pudieron cargar las redes neuronales.", "red");
        return false;
    }
}

// ==============================================================================================================================
// LOGIN FACIAL - ABRIR MODAL
// ==============================================================================================================================
async function abrirModalLoginFacial() {
    const modal         = document.getElementById("modalLoginFacial");
    const usuarioNormal = document.getElementById("usuario");
    const usuarioFacial = document.getElementById("usuarioFacial");

    if (usuarioNormal && usuarioFacial) {
        usuarioFacial.value = usuarioNormal.value.trim();
    }

    modal.classList.add("active");
    mostrarMensajeFacial("Cargando inteligencia artificial...", "#f6a019");

    const listos = await cargarModelos();
    if (listos) mostrarMensajeFacial("Módulos listos. Activa la cámara.", "#2a5298");
}

// ==============================================================================================================================
// LOGIN FACIAL - CERRAR MODAL
// ==============================================================================================================================
function cerrarModalLoginFacial() {
    const modal = document.getElementById("modalLoginFacial");
    detenerCamaraFacial();
    modal.classList.remove("active");
    mostrarMensajeFacial("", "");
}

// ==============================================================================================================================
// LOGIN FACIAL - ACTIVAR CÁMARA
// ==============================================================================================================================
async function activarCamaraFacial() {
    if (!modelosCargados) {
        mostrarMensajeFacial("Espera a que carguen los módulos neuronales.", "#f6a019");
        return;
    }

    try {
        const video = document.getElementById("videoFacial");

        streamFacial = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: "user" },
            audio: false
        });

        video.srcObject = streamFacial;
        rostroEnPosicion = false;

        video.onloadedmetadata = () => {
            video.play();
            iniciarScannerFacial();
        };

        mostrarMensajeFacial("Centra tu cara dentro del óvalo.", "#f6a019");

    } catch (error) {
        console.error("Error activando cámara:", error);
        mostrarMensajeFacial("No se pudo acceder a la cámara.", "red");
    }
}

// ==============================================================================================================================
// LOGIN FACIAL - DETENER CÁMARA
// ==============================================================================================================================
function detenerCamaraFacial() {
    if (loopDeteccion) {
        cancelAnimationFrame(loopDeteccion);
        loopDeteccion = null;
    }

    const canvas = document.getElementById("canvasOverlay");
    if (canvas) {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    }

    setEstadoOvalo("neutral");
    rostroEnPosicion = false;

    if (streamFacial) {
        streamFacial.getTracks().forEach(t => t.stop());
        streamFacial = null;
    }

    const video = document.getElementById("videoFacial");
    if (video) { video.srcObject = null; video.onloadedmetadata = null; }
}

// ==============================================================================================================================
// SCANNER FACIAL - LÓGICA PRINCIPAL EN TIEMPO REAL
// Detecta cara → dibuja puntos → evalúa posición → cambia colores
// ==============================================================================================================================
async function iniciarScannerFacial() {
    const video  = document.getElementById("videoFacial");
    const canvas = document.getElementById("canvasOverlay");

    if (!video || !canvas || !streamFacial) return;

    // Espera dimensiones reales del stream
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        loopDeteccion = requestAnimationFrame(iniciarScannerFacial);
        return;
    }

    // Canvas trabaja en coordenadas reales del stream (no CSS)
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    async function tick() {
        if (!streamFacial) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        try {
            const deteccion = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 320,
                    scoreThreshold: 0.4
                }))
                .withFaceLandmarks(true);

            if (deteccion) {
                const estaEnPosicion = evaluarPosicionRostro(deteccion, canvas.width, canvas.height);

                if (estaEnPosicion) {
                    // CARA BIEN POSICIONADA → verde
                    dibujarLandmarks(ctx, deteccion, {
                        colorPunto: "rgba(0, 255, 120, 1)",
                        colorLinea: "rgba(0, 255, 120, 0.85)",
                        colorCaja:  "rgba(0, 255, 120, 0.6)"
                    });
                    setEstadoOvalo("ok");

                    if (!rostroEnPosicion) {
                        rostroEnPosicion = true;
                        mostrarMensajeFacial("✅ Cara detectada. Puedes capturar.", "green");
                    }

                } else {
                    // CARA FUERA DE POSICIÓN → amarillo
                    dibujarLandmarks(ctx, deteccion, {
                        colorPunto: "rgba(255, 200, 0, 1)",
                        colorLinea: "rgba(255, 200, 0, 0.8)",
                        colorCaja:  "rgba(255, 200, 0, 0.5)"
                    });
                    setEstadoOvalo("warning");
                    rostroEnPosicion = false;
                    mostrarMensajeFacial("⚠️ Centra tu cara dentro del óvalo.", "#f6a019");
                }

            } else {
                // SIN CARA → rojo
                setEstadoOvalo("error");
                rostroEnPosicion = false;
                mostrarMensajeFacial("❌ No se detecta ningún rostro.", "red");
            }

        } catch (err) {
            // Silencia errores de frame individual para no romper el loop
        }

        loopDeteccion = requestAnimationFrame(tick);
    }

    tick();
}

// ==============================================================================================================================
// SCANNER FACIAL - EVALÚA SI EL ROSTRO ESTÁ CENTRADO EN EL ÓVALO
// ==============================================================================================================================
function evaluarPosicionRostro(deteccion, canvasW, canvasH) {
    const box = deteccion.detection.box;

    const caraCentroX = box.x + box.width  / 2;
    const caraCentroY = box.y + box.height / 2;

    const centroCX = canvasW / 2;
    const centroCY = canvasH / 2;

    // Tolerancia del 25% del canvas en cada eje
    const tolX = canvasW * 0.25;
    const tolY = canvasH * 0.25;

    // La cara debe tener un tamaño razonable
    const tamanoMinimo = canvasW * 0.15;
    const tamanoMaximo = canvasW * 0.85;

    const centradoX = Math.abs(caraCentroX - centroCX) < tolX;
    const centradoY = Math.abs(caraCentroY - centroCY) < tolY;
    const tamanoOk  = box.width > tamanoMinimo && box.width < tamanoMaximo;

    return centradoX && centradoY && tamanoOk;
}

// ==============================================================================================================================
// SCANNER FACIAL - DIBUJA LOS 68 PUNTOS + MALLA FACIAL
// Colores dinámicos según estado: verde (ok), amarillo (warning)
// ==============================================================================================================================
function dibujarLandmarks(ctx, deteccion, colores) {
    const puntos = deteccion.landmarks.positions;
    const box    = deteccion.detection.box;

    // 1. Caja del rostro detectado
    ctx.strokeStyle = colores.colorCaja;
    ctx.lineWidth   = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // 2. Malla facial por segmentos anatómicos
    ctx.strokeStyle = colores.colorLinea;
    ctx.lineWidth   = 1.2;

    const segmentos = [
        [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],     // mandíbula
        [17,18,19,20,21],                                  // ceja izquierda
        [22,23,24,25,26],                                  // ceja derecha
        [27,28,29,30],                                     // puente nariz
        [30,31,32,33,34,35],                               // fosas nasales
        [36,37,38,39,40,41,36],                            // ojo izquierdo
        [42,43,44,45,46,47,42],                            // ojo derecho
        [48,49,50,51,52,53,54,55,56,57,58,59,48],         // labio exterior
        [60,61,62,63,64,65,66,67,60]                      // labio interior
    ];

    segmentos.forEach(seg => {
        ctx.beginPath();
        ctx.moveTo(puntos[seg[0]].x, puntos[seg[0]].y);
        for (let i = 1; i < seg.length; i++) {
            ctx.lineTo(puntos[seg[i]].x, puntos[seg[i]].y);
        }
        ctx.stroke();
    });

    // 3. Puntos individuales encima de las líneas
    puntos.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = colores.colorPunto;
        ctx.fill();
    });
}

// ==============================================================================================================================
// SCANNER FACIAL - CAMBIA EL ESTADO VISUAL DEL ÓVALO
// neutral → blanco | ok → verde | warning → naranja | error → rojo
// ==============================================================================================================================
function setEstadoOvalo(estado) {
    const ovalo = document.querySelector(".face-oval-guide");
    if (!ovalo) return;

    ovalo.classList.remove("ovalo-ok", "ovalo-warning", "ovalo-error");

    if (estado === "ok")      ovalo.classList.add("ovalo-ok");
    if (estado === "warning") ovalo.classList.add("ovalo-warning");
    if (estado === "error")   ovalo.classList.add("ovalo-error");
}

// ==============================================================================================================================
// LOGIN FACIAL - CAPTURAR Y ENVIAR AL BACKEND
// ==============================================================================================================================
async function capturarLoginFacial() {
    const usuario = document.getElementById("usuarioFacial").value.trim();
    const video   = document.getElementById("videoFacial");
    const canvas  = document.getElementById("canvasFacial");

    if (!usuario) {
        mostrarMensajeFacial("Debe ingresar su usuario.", "red");
        return;
    }

    if (!streamFacial) {
        mostrarMensajeFacial("Primero activa la cámara.", "red");
        return;
    }

    if (!rostroEnPosicion) {
        mostrarMensajeFacial("⚠️ Centra tu cara en el óvalo antes de capturar.", "#f6a019");
        return;
    }

    mostrarMensajeFacial("Analizando rostro...", "#f6a019");

    try {
        const deteccionLocal = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks(true);

        if (!deteccionLocal) {
            mostrarMensajeFacial("❌ No se detectó ningún rostro. Intenta de nuevo.", "red");
            return;
        }

        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

        const imagenRostro = canvas.toDataURL("image/png");
        mostrarMensajeFacial("Rostro validado. Contrastando datos biométricos...", "#2a5298");

        const respuesta = await fetch("/api/login-facial", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, imagenRostro })
        });

        const data = await respuesta.json();

        if (!data.success || !data.verified) {
            mostrarMensajeFacial(data.message || "No se pudo validar el rostro.", "red");
            setEstadoOvalo("error");
            return;
        }

        localStorage.setItem("cuentaLinaje", JSON.stringify(data.cuenta));
        const nombre = data.cuenta.nombres || data.cuenta.usuario;

        mostrarMensajeFacial(`¡Bienvenido, ${nombre}! Identidad validada.`, "green");
        setEstadoOvalo("ok");
        detenerCamaraFacial();

        setTimeout(() => redirigirPorRol(data.cuenta), 1200);

    } catch (error) {
        console.error("Error en login facial:", error);
        mostrarMensajeFacial("Error al conectar con el servidor.", "red");
    }
}

// ==============================================================================================================================
// UTILIDAD - MOSTRAR MENSAJE EN EL MODAL
// ==============================================================================================================================
function mostrarMensajeFacial(texto, color) {
    const mensaje = document.getElementById("mensajeFacial");
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.style.color = color;
}