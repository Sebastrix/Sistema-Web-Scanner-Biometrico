document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("formLogin");

    if (!formLogin) {
        console.error("No se encontró el formulario con id formLogin");
        return;
    }

    formLogin.addEventListener("submit", iniciarSesion);
});

// ==============================================================================================================================
// FUNCIÓN PRINCIPAL LOGIN
// ==============================================================================================================================
async function iniciarSesion(e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();

    if (!usuario || !contrasena) {
        mostrarMensaje("Debe ingresar usuario y contraseña", "red");
        return;
    }

    mostrarMensaje("Validando usuario...", "#2a5298");

    try {
        const respuesta = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario: usuario,
                contrasena: contrasena
            })
        });

        const data = await respuesta.json();

        if (!data.success) {
            mostrarMensaje(data.message || "Usuario o contraseña incorrectos", "red");
            return;
        }

        localStorage.setItem("cuentaLinaje", JSON.stringify(data.cuenta));

        mostrarMensaje("Inicio de sesión correcto. Redirigiendo...", "green");

        setTimeout(() => {
            redirigirPorRol(data.cuenta);
        }, 1000);

    } catch (error) {
        console.error("Error en login:", error);
        mostrarMensaje("Error al conectar con el servidor", "red");
    }
}

// ==============================================================================================================================
// REDIRECCIÓN SEGÚN ROL
// rol 0 = Usuario / Cliente
// rol 1 = Administrador
// ==============================================================================================================================
function redirigirPorRol(cuenta) {
    if (!cuenta) {
        window.location.href = "/login";
        return;
    }

    const rol = Number(cuenta.rol);

    if (rol === 1) {
        window.location.href = "/admin";
    } else if (rol === 0) {
        window.location.href = "/usuario";
    } else {
        alert("Rol no reconocido. Comuníquese con el administrador.");
        localStorage.removeItem("cuentaLinaje");
        window.location.href = "/login";
    }
}

// ==============================================================================================================================
// MOSTRAR MENSAJES EN EL LOGIN
// ==============================================================================================================================
function mostrarMensaje(texto, color) {
    const mensaje = document.getElementById("mensajeLogin");

    if (!mensaje) return;

    mensaje.textContent = texto;
    mensaje.style.color = color;
}

// ==============================================================================================================================
// LOGIN FACIAL - VARIABLES
// ==============================================================================================================================
let streamFacial = null;

// ==============================================================================================================================
// LOGIN FACIAL - EVENTOS
// ==============================================================================================================================
document.addEventListener("DOMContentLoaded", () => {
    const btnAbrirLoginFacial = document.getElementById("btnAbrirLoginFacial");
    const btnCerrarLoginFacial = document.getElementById("btnCerrarLoginFacial");
    const btnActivarCamaraFacial = document.getElementById("btnActivarCamaraFacial");
    const btnCapturarLoginFacial = document.getElementById("btnCapturarLoginFacial");

    if (btnAbrirLoginFacial) {
        btnAbrirLoginFacial.addEventListener("click", abrirModalLoginFacial);
    }

    if (btnCerrarLoginFacial) {
        btnCerrarLoginFacial.addEventListener("click", cerrarModalLoginFacial);
    }

    if (btnActivarCamaraFacial) {
        btnActivarCamaraFacial.addEventListener("click", activarCamaraFacial);
    }

    if (btnCapturarLoginFacial) {
        btnCapturarLoginFacial.addEventListener("click", capturarLoginFacial);
    }
});

// ==============================================================================================================================
// ABRIR MODAL LOGIN FACIAL
// ==============================================================================================================================
function abrirModalLoginFacial() {
    const modal = document.getElementById("modalLoginFacial");
    const usuarioNormal = document.getElementById("usuario");
    const usuarioFacial = document.getElementById("usuarioFacial");

    if (usuarioNormal && usuarioFacial) {
        usuarioFacial.value = usuarioNormal.value.trim();
    }

    modal.classList.add("active");
    mostrarMensajeFacial("Primero activa la cámara.", "#2a5298");
}

// ==============================================================================================================================
// CERRAR MODAL LOGIN FACIAL
// ==============================================================================================================================
function cerrarModalLoginFacial() {
    const modal = document.getElementById("modalLoginFacial");

    detenerCamaraFacial();

    modal.classList.remove("active");
    mostrarMensajeFacial("", "");
}

// ==============================================================================================================================
// ACTIVAR CÁMARA FACIAL
// ==============================================================================================================================
async function activarCamaraFacial() {
    try {
        const video = document.getElementById("videoFacial");

        streamFacial = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        video.srcObject = streamFacial;

        mostrarMensajeFacial("Cámara activada. Coloca tu rostro al centro.", "green");

    } catch (error) {
        console.error("Error activando cámara:", error);
        mostrarMensajeFacial("No se pudo activar la cámara.", "red");
    }
}

// ==============================================================================================================================
// DETENER CÁMARA FACIAL
// ==============================================================================================================================
function detenerCamaraFacial() {
    if (streamFacial) {
        streamFacial.getTracks().forEach(track => track.stop());
        streamFacial = null;
    }

    const video = document.getElementById("videoFacial");

    if (video) {
        video.srcObject = null;
    }
}

// ==============================================================================================================================
// CAPTURAR ROSTRO Y HACER LOGIN FACIAL
// ==============================================================================================================================
async function capturarLoginFacial() {
    const usuario = document.getElementById("usuarioFacial").value.trim();
    const video = document.getElementById("videoFacial");
    const canvas = document.getElementById("canvasFacial");

    if (!usuario) {
        mostrarMensajeFacial("Debe ingresar su usuario.", "red");
        return;
    }

    if (!streamFacial) {
        mostrarMensajeFacial("Primero active la cámara.", "red");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const contexto = canvas.getContext("2d");
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imagenRostro = canvas.toDataURL("image/png");

    mostrarMensajeFacial("Validando identidad facial...", "#2a5298");

    try {
        const respuesta = await fetch("/api/login-facial", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario: usuario,
                imagenRostro: imagenRostro
            })
        });

        const data = await respuesta.json();

        if (!data.success) {
            mostrarMensajeFacial(data.message || "No se pudo validar el rostro.", "red");
            return;
        }

        localStorage.setItem("cuentaLinaje", JSON.stringify(data.cuenta));

        const nombreCliente = data.cuenta.nombres || data.cuenta.usuario;

        mostrarMensajeFacial(
            `Bienvenido, ${nombreCliente}. Identidad facial validada correctamente.`,
            "green"
        );

        detenerCamaraFacial();

        setTimeout(() => {
            redirigirPorRol(data.cuenta);
        }, 1000);

    } catch (error) {
        console.error("Error en login facial:", error);
        mostrarMensajeFacial("Error al conectar con el servidor.", "red");
    }
}

// ==============================================================================================================================
// MOSTRAR MENSAJE LOGIN FACIAL
// ==============================================================================================================================
function mostrarMensajeFacial(texto, color) {
    const mensaje = document.getElementById("mensajeFacial");

    if (!mensaje) return;

    mensaje.textContent = texto;
    mensaje.style.color = color;
}