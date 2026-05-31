document.addEventListener("DOMContentLoaded", () => {
    verificarAdminLinaje();
    cargarResumenAdminLinaje();
    cargarCuentasAdminLinaje();
    cargarPedidosAdminLinaje();
    configurarNavegacionAdminLinaje();
    configurarModalAdminLinaje();
    configurarModalDetallePedidoAdmin();
    cerrarSesionAdminLinaje();

    const btnRecargarPedidos = document.getElementById("btnRecargarPedidos");

    if (btnRecargarPedidos) {
        btnRecargarPedidos.addEventListener("click", cargarPedidosAdminLinaje);
    }
});
// ==============================================================================================================================
// VERIFICAR SI ES ADMINISTRADOR
// ==============================================================================================================================
function verificarAdminLinaje() {
    const cuenta = JSON.parse(localStorage.getItem("cuentaLinaje"));

    if (!cuenta) {
        window.location.href = "/login";
        return;
    }

    if (Number(cuenta.rol) !== 1) {
        alert("Acceso denegado. Solo administradores.");
        window.location.href = "/login";
        return;
    }

    document.getElementById("nombreAdmin").textContent = cuenta.usuario;
}

// ==============================================================================================================================
// NAVEGACIÓN DEL PANEL
// ==============================================================================================================================
function configurarNavegacionAdminLinaje() {
    const enlaces = document.querySelectorAll(".sidebar nav a");
    const secciones = document.querySelectorAll(".section");

    enlaces.forEach(enlace => {
        enlace.addEventListener("click", (e) => {
            e.preventDefault();

            enlaces.forEach(item => item.classList.remove("active"));
            enlace.classList.add("active");

            const sectionId = enlace.getAttribute("data-section");

            secciones.forEach(section => {
                section.classList.remove("active-section");
            });

            document.getElementById(sectionId).classList.add("active-section");
        });
    });
}

// ==============================================================================================================================
// MODAL CREAR CUENTA
// ==============================================================================================================================
function configurarModalAdminLinaje() {
    const modal = document.getElementById("modalCuenta");
    const btnAbrir = document.getElementById("btnAbrirModal");
    const btnCerrar = document.getElementById("btnCerrarModal");
    const form = document.getElementById("formNuevaCuenta");

    btnAbrir.addEventListener("click", () => {
        modal.classList.add("active");
        document.getElementById("mensajeCuenta").textContent = "";
    });

    btnCerrar.addEventListener("click", () => {
        modal.classList.remove("active");
        form.reset();
    });

    form.addEventListener("submit", crearCuentaAdminLinaje);
}

// ==============================================================================================================================
// CERRAR SESIÓN
// ==============================================================================================================================
function cerrarSesionAdminLinaje() {
    document.getElementById("btnCerrarSesion").addEventListener("click", () => {
        localStorage.removeItem("cuentaLinaje");
        window.location.href = "/login";
    });
}

// ==============================================================================================================================
// CARGAR RESUMEN
// ==============================================================================================================================
async function cargarResumenAdminLinaje() {
    try {
        const respuesta = await fetch("/api/admin/resumen");
        const data = await respuesta.json();

        if (data.success) {
            document.getElementById("totalCuentas").textContent = data.resumen.totalCuentas;
            document.getElementById("totalAdmins").textContent = data.resumen.totalAdmins;
            document.getElementById("totalClientes").textContent = data.resumen.totalClientes;
        }

    } catch (error) {
        console.error("Error cargando resumen:", error);
    }
}

// ==============================================================================================================================
// CARGAR CUENTAS
// ==============================================================================================================================
async function cargarCuentasAdminLinaje() {
    const tabla = document.getElementById("tablaCuentas");

    try {
        const respuesta = await fetch("/api/admin/cuentas");
        const data = await respuesta.json();

        if (!data.success) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="5">No se pudieron cargar las cuentas</td>
                </tr>
            `;
            return;
        }

        if (data.cuentas.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="5">No hay cuentas registradas</td>
                </tr>
            `;
            return;
        }

        tabla.innerHTML = "";

        data.cuentas.forEach(cuenta => {
            const rolTexto = cuenta.rol === 1 ? "Administrador" : "Cliente";
            const rolClase = cuenta.rol === 1 ? "badge-admin" : "badge-cliente";

            tabla.innerHTML += `
                <tr>
                    <td>${cuenta.id}</td>
                    <td>${cuenta.usuario}</td>
                    <td><span class="${rolClase}">${rolTexto}</span></td>
                    <td>${formatearFechaAdminLinaje(cuenta.fecha_creacion)}</td>
                    <td>
                        <button class="btn-eliminar" onclick="eliminarCuentaAdminLinaje(${cuenta.id})">
                            Eliminar
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error cargando cuentas:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="5">Error al conectar con el servidor</td>
            </tr>
        `;
    }
}

// ==============================================================================================================================
// CREAR CUENTA
// ==============================================================================================================================
async function crearCuentaAdminLinaje(e) {
    e.preventDefault();

    const usuario = document.getElementById("nuevoUsuario").value.trim();
    const contrasena = document.getElementById("nuevaContrasena").value.trim();
    const rol = document.getElementById("nuevoRol").value;
    const mensaje = document.getElementById("mensajeCuenta");

    if (!usuario || !contrasena || rol === "") {
        mensaje.textContent = "Complete todos los campos";
        mensaje.style.color = "red";
        return;
    }

    if (contrasena.length < 6) {
        mensaje.textContent = "La contraseña debe tener mínimo 6 caracteres";
        mensaje.style.color = "red";
        return;
    }

    mensaje.textContent = "Guardando cuenta...";
    mensaje.style.color = "#2a5298";

    try {
        const respuesta = await fetch("/api/admin/crear-cuenta", {
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

            document.getElementById("formNuevaCuenta").reset();

            setTimeout(() => {
                document.getElementById("modalCuenta").classList.remove("active");
                cargarCuentasAdminLinaje();
                cargarResumenAdminLinaje();
            }, 800);

        } else {
            mensaje.textContent = data.message;
            mensaje.style.color = "red";
        }

    } catch (error) {
        mensaje.textContent = "Error al conectar con el servidor";
        mensaje.style.color = "red";
        console.error(error);
    }
}

// ==============================================================================================================================
// ELIMINAR CUENTA
// ==============================================================================================================================
async function eliminarCuentaAdminLinaje(id) {
    const cuentaActual = JSON.parse(localStorage.getItem("cuentaLinaje"));

    if (cuentaActual && Number(cuentaActual.id) === Number(id)) {
        alert("No puedes eliminar tu propia cuenta mientras estás conectado.");
        return;
    }

    const confirmar = confirm("¿Seguro que deseas eliminar esta cuenta?");

    if (!confirmar) {
        return;
    }

    try {
        const respuesta = await fetch(`/api/admin/eliminar-cuenta/${id}`, {
            method: "DELETE"
        });

        const data = await respuesta.json();

        console.log("Respuesta eliminar cuenta:", data);

        if (data.success) {
            alert(data.message);
            await cargarCuentasAdminLinaje();
            await cargarResumenAdminLinaje();
        } else {
            alert(data.message || "No se pudo eliminar la cuenta");
            console.error("Error backend:", data.error);
        }

    } catch (error) {
        console.error("Error al eliminar cuenta:", error);
        alert("Error al conectar con el servidor");
    }
}

// ==============================================================================================================================
// FORMATEAR FECHA
// ==============================================================================================================================
function formatearFechaAdminLinaje(fecha) {
    if (!fecha) return "Sin fecha";

    const date = new Date(fecha);

    return date.toLocaleDateString("es-PE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
}

// ==============================================================================================================================
// ADMIN - CARGAR PEDIDOS
// ==============================================================================================================================
async function cargarPedidosAdminLinaje() {
    const tabla = document.getElementById("tablaPedidosAdmin");

    if (!tabla) {
        return;
    }

    tabla.innerHTML = `
        <tr>
            <td colspan="7">Cargando pedidos...</td>
        </tr>
    `;

    try {
        const respuesta = await fetch("/api/admin/pedidos");
        const data = await respuesta.json();

        if (!data.success) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="7">${data.message || "No se pudieron cargar los pedidos."}</td>
                </tr>
            `;
            return;
        }

        if (!data.pedidos || data.pedidos.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="7">No hay pedidos registrados.</td>
                </tr>
            `;
            return;
        }

        tabla.innerHTML = "";

        data.pedidos.forEach(pedido => {
            const cliente = `${pedido.nombres || ""} ${pedido.apellidos || ""}`.trim();

            tabla.innerHTML += `
                <tr>
                    <td>#${pedido.id_pedido}</td>
                    <td>
                        <strong>${cliente || "Cliente"}</strong><br>
                        <small>${pedido.celular || "Sin celular"}</small>
                    </td>
                    <td>${formatearFechaAdminLinaje(pedido.fecha_pedido)}</td>
                    <td>${pedido.metodo_pago || "No definido"}</td>
                    <td>S/ ${Number(pedido.total).toFixed(2)}</td>
                    <td>
                        <select class="select-estado-pedido" onchange="cambiarEstadoPedidoAdmin(${pedido.id_pedido}, this.value)">
                            <option value="Registrado" ${pedido.estado === "Registrado" ? "selected" : ""}>Registrado</option>
                            <option value="En preparación" ${pedido.estado === "En preparación" ? "selected" : ""}>En preparación</option>
                            <option value="Listo" ${pedido.estado === "Listo" ? "selected" : ""}>Listo</option>
                            <option value="Entregado" ${pedido.estado === "Entregado" ? "selected" : ""}>Entregado</option>
                            <option value="Cancelado" ${pedido.estado === "Cancelado" ? "selected" : ""}>Cancelado</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn-ver-detalle" onclick="verDetallePedidoAdmin(${pedido.id_pedido})">
                            Ver detalle
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error cargando pedidos admin:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="7">Error al conectar con el servidor.</td>
            </tr>
        `;
    }
}


// ==============================================================================================================================
// ADMIN - CAMBIAR ESTADO DE PEDIDO
// ==============================================================================================================================
async function cambiarEstadoPedidoAdmin(idPedido, nuevoEstado) {
    try {
        const respuesta = await fetch(`/api/admin/pedidos/${idPedido}/estado`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                estado: nuevoEstado
            })
        });

        const data = await respuesta.json();

        if (!data.success) {
            alert(data.message || "No se pudo actualizar el estado.");
            await cargarPedidosAdminLinaje();
            return;
        }

        console.log(data.message);

    } catch (error) {
        console.error("Error cambiando estado:", error);
        alert("Error al conectar con el servidor.");
        await cargarPedidosAdminLinaje();
    }
}


// ==============================================================================================================================
// ADMIN - VER DETALLE DE PEDIDO
// ==============================================================================================================================
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