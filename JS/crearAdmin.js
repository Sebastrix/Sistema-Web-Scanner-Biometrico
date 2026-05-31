document.getElementById("formCrearAdmin").addEventListener("submit", async function (e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();
    const confirmarContrasena = document.getElementById("confirmarContrasena").value.trim();
    const rol = document.getElementById("rol").value;
    const mensaje = document.getElementById("mensajeAdmin");

    if (contrasena !== confirmarContrasena) {
        mensaje.textContent = "Las contraseñas no coinciden";
        mensaje.style.color = "red";
        return;
    }

    if (contrasena.length < 6) {
        mensaje.textContent = "La contraseña debe tener mínimo 6 caracteres";
        mensaje.style.color = "red";
        return;
    }

    if (rol === "") {
        mensaje.textContent = "Debe seleccionar un rol";
        mensaje.style.color = "red";
        return;
    }

    mensaje.textContent = "Creando cuenta...";
    mensaje.style.color = "#2a5298";

    try {
        const respuesta = await fetch("http://localhost:3000/api/crear-admin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario: usuario,
                contrasena: contrasena,
                rol: parseInt(rol)
            })
        });

        const data = await respuesta.json();

        if (data.success) {
            mensaje.textContent = data.message;
            mensaje.style.color = "green";

            setTimeout(() => {
                window.location.href = "PrincipalLogin.HTML";
            }, 1500);
        } else {
            mensaje.textContent = data.message;
            mensaje.style.color = "red";
        }

    } catch (error) {
        mensaje.textContent = "Error al conectar con el servidor";
        mensaje.style.color = "red";
        console.error(error);
    }
});