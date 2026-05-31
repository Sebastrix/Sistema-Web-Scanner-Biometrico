let streamCamara = null;
let imagenRostroBase64 = null;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnActivarCamara").addEventListener("click", activarCamara);
    document.getElementById("btnCapturarRostro").addEventListener("click", capturarRostro);
    document.getElementById("formRegistroUsuario").addEventListener("submit", registrarUsuario);
});

// ==============================================================================================================================
// ACTIVAR CÁMARA
// ==============================================================================================================================
async function activarCamara() {
    const video = document.getElementById("video");

    try {
        streamCamara = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        video.srcObject = streamCamara;
        mostrarMensaje("Cámara activada. Coloca tu rostro al centro.", "#2a5298");

    } catch (error) {
        console.error(error);
        mostrarMensaje("No se pudo acceder a la cámara.", "red");
    }
}

// ==============================================================================================================================
// CAPTURAR ROSTRO
// ==============================================================================================================================
function capturarRostro() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const preview = document.getElementById("previewRostro");

    if (!streamCamara) {
        mostrarMensaje("Primero debes activar la cámara.", "red");
        return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
        mostrarMensaje("La cámara aún no está lista. Intenta nuevamente.", "red");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const contexto = canvas.getContext("2d");
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    imagenRostroBase64 = canvas.toDataURL("image/png");

    preview.src = imagenRostroBase64;
    preview.style.display = "block";

    mostrarMensaje("Rostro capturado correctamente.", "green");
}

// ==============================================================================================================================
// REGISTRAR USUARIO
// ==============================================================================================================================
async function registrarUsuario(e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const nombres = document.getElementById("nombres").value.trim();
    const apellidos = document.getElementById("apellidos").value.trim();
    const celular = document.getElementById("celular").value.trim();
    const direccion = document.getElementById("direccion").value.trim();
    const referencia = document.getElementById("referencia").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();
    const confirmarContrasena = document.getElementById("confirmarContrasena").value.trim();

    if (!usuario || !nombres || !apellidos || !celular || !direccion || !contrasena || !confirmarContrasena) {
        mostrarMensaje("Completa todos los campos obligatorios.", "red");
        return;
    }

    if (!validarCelular(celular)) {
        mostrarMensaje("Ingrese un número de celular válido.", "red");
        return;
    }

    if (contrasena !== confirmarContrasena) {
        mostrarMensaje("Las contraseñas no coinciden.", "red");
        return;
    }

    if (contrasena.length < 6) {
        mostrarMensaje("La contraseña debe tener mínimo 6 caracteres.", "red");
        return;
    }

    if (!imagenRostroBase64) {
        mostrarMensaje("Debes capturar tu rostro antes de registrarte.", "red");
        return;
    }

    mostrarMensaje("Registrando cliente...", "#2a5298");

    try {
        const respuesta = await fetch("/api/registro-cliente", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario: usuario,
                nombres: nombres,
                apellidos: apellidos,
                celular: celular,
                direccion: direccion,
                referencia: referencia,
                contrasena: contrasena,
                imagenRostro: imagenRostroBase64
            })
        });

        const data = await respuesta.json();

        if (data.success) {
            mostrarMensaje(data.message, "green");

            detenerCamara();

            setTimeout(() => {
                window.location.href = "/login";
            }, 1500);

        } else {
            mostrarMensaje(data.message || "No se pudo registrar el cliente.", "red");
            console.error(data.error);
        }

    } catch (error) {
        console.error(error);
        mostrarMensaje("Error al conectar con el servidor.", "red");
    }
}

// ==============================================================================================================================
// VALIDAR CELULAR
// ==============================================================================================================================
function validarCelular(celular) {
    const soloNumeros = /^[0-9]{9,15}$/;
    return soloNumeros.test(celular);
}

// ==============================================================================================================================
// DETENER CÁMARA
// ==============================================================================================================================
function detenerCamara() {
    if (streamCamara) {
        streamCamara.getTracks().forEach(track => track.stop());
        streamCamara = null;
    }
}

// ==============================================================================================================================
// MOSTRAR MENSAJE
// ==============================================================================================================================
function mostrarMensaje(texto, color) {
    const mensaje = document.getElementById("mensajeRegistro");

    mensaje.textContent = texto;
    mensaje.style.color = color;
}