// ==============================================================================================================================
// ADMIN LINAJE - PANEL ADMINISTRADOR
// Archivo corregido e integrado con gestión de productos
// ==============================================================================================================================

let productosAdminLinajeCache = [];

// ==============================================================================================================================
// INICIO
// ==============================================================================================================================
document.addEventListener("DOMContentLoaded", () => {
    verificarAdminLinaje();

    cargarResumenAdminLinaje();
    cargarCuentasAdminLinaje();
    cargarPedidosAdminLinaje();

    cargarProductosAdminLinaje();

    configurarNavegacionAdminLinaje();
    configurarModalAdminLinaje();
    configurarModalProducto();
    configurarSubidaImagenProducto();
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
    const cuentaGuardada = localStorage.getItem("cuentaLinaje");

    if (!cuentaGuardada) {
        window.location.href = "/login";
        return;
    }

    let cuenta = null;

    try {
        cuenta = JSON.parse(cuentaGuardada);
    } catch (error) {
        localStorage.removeItem("cuentaLinaje");
        window.location.href = "/login";
        return;
    }

    if (!cuenta || Number(cuenta.rol) !== 1) {
        alert("Acceso denegado. Solo administradores.");
        localStorage.removeItem("cuentaLinaje");
        window.location.href = "/login";
        return;
    }

    const nombreAdmin = document.getElementById("nombreAdmin");

    if (nombreAdmin) {
        nombreAdmin.textContent = cuenta.usuario || "Administrador";
    }
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
            const seccionSeleccionada = document.getElementById(sectionId);

            secciones.forEach(section => {
                section.classList.remove("active-section");
            });

            if (seccionSeleccionada) {
                seccionSeleccionada.classList.add("active-section");
            }

            if (sectionId === "menu") {
                cargarProductosAdminLinaje();
            }

            if (sectionId === "pedidos") {
                cargarPedidosAdminLinaje();
            }
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

    if (!modal || !btnAbrir || !btnCerrar || !form) {
        return;
    }

    btnAbrir.addEventListener("click", () => {
        modal.classList.add("active");

        const mensaje = document.getElementById("mensajeCuenta");

        if (mensaje) {
            mensaje.textContent = "";
        }
    });

    btnCerrar.addEventListener("click", () => {
        modal.classList.remove("active");
        form.reset();
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("active");
            form.reset();
        }
    });

    form.addEventListener("submit", crearCuentaAdminLinaje);
}

// ==============================================================================================================================
// CERRAR SESIÓN
// ==============================================================================================================================
function cerrarSesionAdminLinaje() {
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");

    if (!btnCerrarSesion) {
        return;
    }

    btnCerrarSesion.addEventListener("click", () => {
        localStorage.removeItem("cuentaLinaje");
        sessionStorage.clear();
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

        if (data.success && data.resumen) {
            const totalCuentas = document.getElementById("totalCuentas");
            const totalAdmins = document.getElementById("totalAdmins");
            const totalClientes = document.getElementById("totalClientes");

            if (totalCuentas) totalCuentas.textContent = data.resumen.totalCuentas || 0;
            if (totalAdmins) totalAdmins.textContent = data.resumen.totalAdmins || 0;
            if (totalClientes) totalClientes.textContent = data.resumen.totalClientes || 0;
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

    if (!tabla) {
        return;
    }

    tabla.innerHTML = `
        <tr>
            <td colspan="5">Cargando cuentas...</td>
        </tr>
    `;

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

        if (!data.cuentas || data.cuentas.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="5">No hay cuentas registradas</td>
                </tr>
            `;
            return;
        }

        tabla.innerHTML = "";

        data.cuentas.forEach(cuenta => {
            const rolTexto = Number(cuenta.rol) === 1 ? "Administrador" : "Cliente";
            const rolClase = Number(cuenta.rol) === 1 ? "badge-admin" : "badge-cliente";

            tabla.innerHTML += `
                <tr>
                    <td>${cuenta.id}</td>
                    <td>${escaparHtml(cuenta.usuario)}</td>
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

    const usuario = document.getElementById("nuevoUsuario")?.value.trim();
    const contrasena = document.getElementById("nuevaContrasena")?.value.trim();
    const rol = document.getElementById("nuevoRol")?.value;
    const mensaje = document.getElementById("mensajeCuenta");

    if (!usuario || !contrasena || rol === "") {
        mostrarMensajeElemento(mensaje, "Complete todos los campos", "red");
        return;
    }

    if (contrasena.length < 6) {
        mostrarMensajeElemento(mensaje, "La contraseña debe tener mínimo 6 caracteres", "red");
        return;
    }

    mostrarMensajeElemento(mensaje, "Guardando cuenta...", "#2a5298");

    try {
        const respuesta = await fetch("/api/admin/crear-cuenta", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario,
                contrasena,
                rol: parseInt(rol)
            })
        });

        const data = await respuesta.json();

        if (data.success) {
            mostrarMensajeElemento(mensaje, data.message || "Cuenta creada correctamente", "green");

            const form = document.getElementById("formNuevaCuenta");
            const modal = document.getElementById("modalCuenta");

            if (form) form.reset();

            setTimeout(() => {
                if (modal) modal.classList.remove("active");

                cargarCuentasAdminLinaje();
                cargarResumenAdminLinaje();
            }, 800);

        } else {
            mostrarMensajeElemento(mensaje, data.message || "No se pudo crear la cuenta", "red");
        }

    } catch (error) {
        mostrarMensajeElemento(mensaje, "Error al conectar con el servidor", "red");
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

        if (data.success) {
            alert(data.message || "Cuenta eliminada correctamente");
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
// ADMIN - CARGAR PEDIDOS
// ==============================================================================================================================
async function cargarPedidosAdminLinaje() {
    const tabla = document.getElementById("tablaPedidosAdmin");

    if (!tabla) {
        return;
    }

    tabla.innerHTML = `
        <tr>
            <td colspan="8">Cargando pedidos...</td>
        </tr>
    `;

    try {
        const respuesta = await fetch("/api/admin/pedidos");
        const data = await respuesta.json();

        if (!data.success) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="8">${data.message || "No se pudieron cargar los pedidos."}</td>
                </tr>
            `;
            return;
        }

        if (!data.pedidos || data.pedidos.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="8">No hay pedidos registrados.</td>
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
                <strong>${escaparHtml(cliente || "Cliente")}</strong><br>
                <small>${escaparHtml(pedido.celular || "Sin celular")}</small>
            </td>

            <td>${formatearFechaAdminLinaje(pedido.fecha_pedido)}</td>

            <td>${escaparHtml(pedido.metodo_pago || "No definido")}</td>

            <td>S/ ${Number(pedido.total || 0).toFixed(2)}</td>

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
                <button
                    type="button"
                    class="btn-ver-detalle"
                    onclick="verDetallePedidoAdmin(${pedido.id_pedido})"
                >
                    Ver detalle
                </button>
            </td>

            <td>
                <button
                    type="button"
                    class="btn-eliminar-pedido"
                    onclick="eliminarPedidoAdminLinaje(${pedido.id_pedido})"
                >
                    Eliminar
                </button>
            </td>
        </tr>
    `;
});
    } catch (error) {
        console.error("Error cargando pedidos admin:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="8">Error al conectar con el servidor.</td>
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

        console.log(data.message || "Estado actualizado correctamente");

    } catch (error) {
        console.error("Error cambiando estado:", error);
        alert("Error al conectar con el servidor.");
        await cargarPedidosAdminLinaje();
    }
}

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
            resumen.textContent =
                `Pedido #${pedido.id_pedido} | ${formatearFechaAdminLinaje(pedido.fecha_pedido)} | Total: S/ ${Number(pedido.total || 0).toFixed(2)}`;
        }

        setTextContent("detalleAdminCliente", clienteNombre || "Cliente");
        setTextContent("detalleAdminCelular", pedido.celular || "Sin celular");
        setTextContent("detalleAdminMetodoPago", pedido.metodo_pago || "No definido");
        setTextContent("detalleAdminEstado", pedido.estado || "Sin estado");
        setTextContent("detalleAdminDireccion", pedido.direccion || "Sin dirección");
        setTextContent("detalleAdminReferencia", pedido.referencia || "Sin referencia");

        if (detalle.length === 0) {
            contenido.innerHTML = "<p>Este pedido no tiene productos registrados.</p>";
            return;
        }

        contenido.innerHTML = "";

        detalle.forEach(item => {
            const imagen = item.imagen_ruta || "/IMG/Productos/sin-imagen.png";

            contenido.innerHTML += `
                <div class="detalle-admin-producto">
                    <img src="${imagen}" alt="${escaparHtml(item.nombre || "Producto")}">

                    <div class="detalle-admin-producto-info">
                        <h4>${escaparHtml(item.nombre || "Producto")}</h4>
                        <p>${escaparHtml(item.descripcion || "Producto del restaurante Linaje.")}</p>
                        <p>
                            Categoría: ${formatearCategoriaAdmin(item.categoria)} |
                            Cantidad: ${item.cantidad}
                        </p>
                    </div>

                    <div class="detalle-admin-producto-monto">
                        <span>S/ ${Number(item.precio_unitario || 0).toFixed(2)} c/u</span>
                        S/ ${Number(item.subtotal || 0).toFixed(2)}
                    </div>
                </div>
            `;
        });

        contenido.innerHTML += `
            <div class="detalle-admin-total">
                <span>Total del pedido</span>
                <strong>S/ ${Number(pedido.total || 0).toFixed(2)}</strong>
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

// ==============================================================================================================================
// PRODUCTOS - MODAL
// ==============================================================================================================================
function configurarModalProducto() {
    const modal = document.getElementById("modalProducto");
    const btnAbrir = document.getElementById("btnAbrirModalProducto");
    const btnCerrar = document.getElementById("btnCerrarModalProducto");
    const form = document.getElementById("formProducto");

    if (!modal || !btnAbrir || !btnCerrar || !form) {
        return;
    }

    btnAbrir.addEventListener("click", () => {
        abrirModalProducto();
    });

    btnCerrar.addEventListener("click", () => {
        cerrarModalProducto();
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            cerrarModalProducto();
        }
    });

    form.addEventListener("submit", guardarProductoAdminLinaje);
}

function abrirModalProducto(producto = null) {
    const modal = document.getElementById("modalProducto");
    const form = document.getElementById("formProducto");
    const titulo = document.getElementById("tituloModalProducto");
    const mensaje = document.getElementById("mensajeProducto");

    if (!modal || !form) {
        return;
    }

    form.reset();

    if (mensaje) {
        mensaje.textContent = "";
        mensaje.style.color = "";
    }

    if (producto) {
        setValue("productoId", producto.id_producto);
        setValue("productoNombre", producto.nombre);
        setValue("productoDescripcion", producto.descripcion);
        setValue("productoCategoria", producto.categoria);
        setValue("productoPrecio", producto.precio);
        setValue("productoImagen", producto.imagen_ruta);

        const preview = document.getElementById("previewImagenProducto");

        if (preview && producto.imagen_ruta) {
            preview.innerHTML = `
                <img src="${producto.imagen_ruta}" alt="Imagen del producto">
            `;
        }
        
        if (titulo) {
            titulo.textContent = "Editar Producto";
        }
    } else {
        setValue("productoId", "");

        const preview = document.getElementById("previewImagenProducto");

        if (preview) {
            preview.innerHTML = `
                <span>📷</span>
                <p>Arrastra una imagen aquí</p>
                <small>o haz clic para seleccionar</small>
            `;
        }   

        if (titulo) {
            titulo.textContent = "Nuevo Producto";
        }
    }

    modal.classList.add("active");
}

function cerrarModalProducto() {
    const modal = document.getElementById("modalProducto");
    const form = document.getElementById("formProducto");
    const mensaje = document.getElementById("mensajeProducto");

    if (modal) {
        modal.classList.remove("active");
    }

    if (form) {
        form.reset();
    }

    if (mensaje) {
        mensaje.textContent = "";
        mensaje.style.color = "";
    }
}

// ==============================================================================================================================
// PRODUCTOS - LISTAR
// ==============================================================================================================================
// ==============================================================================================================================
// PRODUCTOS - LISTAR
// ==============================================================================================================================
async function cargarProductosAdminLinaje() {
    const tabla = document.getElementById("tablaProductos");

    if (!tabla) {
        return;
    }

    tabla.innerHTML = `
        <tr>
            <td colspan="8">Cargando productos...</td>
        </tr>
    `;

    try {
        const respuesta = await fetch("/api/admin/productos");
        const data = await respuesta.json();

        if (!data.success) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="8">${data.message || "No se pudieron cargar productos."}</td>
                </tr>
            `;
            return;
        }

        productosAdminLinajeCache = data.productos || [];

        if (productosAdminLinajeCache.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="8">No hay productos registrados.</td>
                </tr>
            `;
            return;
        }

        tabla.innerHTML = "";

        productosAdminLinajeCache.forEach(producto => {
            const imagen = producto.imagen_ruta || "/IMG/Productos/sin-imagen.png";
            const estadoActivo = Number(producto.estado) === 1;

            tabla.innerHTML += `
                <tr>
                    <td>${producto.id_producto}</td>

                    <td>
                        <img
                            src="${imagen}"
                            class="imagen-producto-admin"
                            alt="${escaparHtml(producto.nombre || "Producto")}"
                        >
                    </td>

                    <td>
                        <strong>${escaparHtml(producto.nombre || "Sin nombre")}</strong><br>
                        <small>${escaparHtml(producto.descripcion || "Sin descripción")}</small>
                    </td>

                    <td>${formatearCategoriaAdmin(producto.categoria)}</td>

                    <td>S/ ${Number(producto.precio || 0).toFixed(2)}</td>

                    <td>
                        ${
                            estadoActivo
                                ? '<span class="badge-activo">Activo</span>'
                                : '<span class="badge-inactivo">Inactivo</span>'
                        }
                    </td>

                    <td>
                        <button
                            type="button"
                            class="btn-editar"
                            onclick="editarProductoAdminLinaje(${producto.id_producto})"
                        >
                            Editar
                        </button>

                        ${
                            estadoActivo
                                ? `
                                    <button
                                        type="button"
                                        class="btn-desactivar"
                                        onclick="cambiarEstadoProductoAdminLinaje(${producto.id_producto}, 0)"
                                    >
                                        Desactivar
                                    </button>
                                `
                                : `
                                    <button
                                        type="button"
                                        class="btn-activar"
                                        onclick="cambiarEstadoProductoAdminLinaje(${producto.id_producto}, 1)"
                                    >
                                        Activar
                                    </button>
                                `
                        }
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error cargando productos:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="8">Error al conectar con el servidor.</td>
            </tr>
        `;
    }
}

// ==============================================================================================================================
// PRODUCTOS - GUARDAR / ACTUALIZAR
// ==============================================================================================================================
async function guardarProductoAdminLinaje(e) {
    e.preventDefault();

    const id = document.getElementById("productoId")?.value.trim();
    const nombre = document.getElementById("productoNombre")?.value.trim();
    const descripcion = document.getElementById("productoDescripcion")?.value.trim();
    const categoria = document.getElementById("productoCategoria")?.value.trim();
    const precio = document.getElementById("productoPrecio")?.value.trim();
    const imagen = document.getElementById("productoImagen")?.value.trim();
    const mensaje = document.getElementById("mensajeProducto");

    if (!nombre || !descripcion || !categoria || !precio) {
        mostrarMensajeElemento(mensaje, "Complete nombre, descripción, categoría y precio.", "red");
        return;
    }

    const precioNumero = Number(precio);

    if (Number.isNaN(precioNumero) || precioNumero <= 0) {
        mostrarMensajeElemento(mensaje, "Ingrese un precio válido mayor a 0.", "red");
        return;
    }

    const metodo = id ? "PUT" : "POST";
    const url = id ? `/api/admin/productos/${id}` : "/api/admin/productos";

    mostrarMensajeElemento(mensaje, "Guardando producto...", "#2a5298");

    try {
        const respuesta = await fetch(url, {
            method: metodo,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombre,
                descripcion,
                categoria,
                precio: precioNumero,
                imagen_ruta: imagen || "/IMG/Productos/sin-imagen.png"
            })
        });

        const data = await respuesta.json();

        if (!data.success) {
            mostrarMensajeElemento(mensaje, data.message || "No se pudo guardar el producto.", "red");
            return;
        }

        mostrarMensajeElemento(mensaje, data.message || "Producto guardado correctamente.", "green");

        setTimeout(() => {
            cerrarModalProducto();
            cargarProductosAdminLinaje();
        }, 700);

    } catch (error) {
        console.error("Error guardando producto:", error);
        mostrarMensajeElemento(mensaje, "Error al conectar con el servidor.", "red");
    }
}

// ==============================================================================================================================
// PRODUCTOS - EDITAR
// ==============================================================================================================================
function editarProductoAdminLinaje(id) {
    const producto = productosAdminLinajeCache.find(
        item => Number(item.id_producto) === Number(id)
    );

    if (!producto) {
        alert("No se encontró el producto seleccionado.");
        return;
    }

    abrirModalProducto(producto);
}

// ==============================================================================================================================
// PRODUCTOS - ELIMINAR / DESACTIVAR
// ==============================================================================================================================
async function eliminarProductoAdminLinaje(id) {
    const producto = productosAdminLinajeCache.find(
        item => Number(item.id_producto) === Number(id)
    );

    const nombreProducto = producto ? producto.nombre : "este producto";

    const confirmar = confirm(
        `¿Seguro que deseas quitar "${nombreProducto}" del menú?\n\nEl producto será desactivado y ya no aparecerá para los clientes.`
    );

    if (!confirmar) {
        return;
    }

    try {
        const respuesta = await fetch(`/api/admin/productos/${id}`, {
            method: "DELETE"
        });

        const data = await respuesta.json();

        if (!data.success) {
            alert(data.message || "No se pudo eliminar el producto.");
            return;
        }

        alert(data.message || "Producto desactivado correctamente.");
        cargarProductosAdminLinaje();

    } catch (error) {
        console.error("Error eliminando producto:", error);
        alert("Error al conectar con el servidor.");
    }
}

// ==============================================================================================================================
// UTILIDADES
// ==============================================================================================================================
function formatearFechaAdminLinaje(fecha) {
    if (!fecha) return "Sin fecha";

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
        return "Sin fecha";
    }

    return date.toLocaleDateString("es-PE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
}

function formatearCategoriaAdmin(categoria) {
    const categorias = {
        hamburguesa: "Hamburguesa",
        salchipapa: "Salchipapa",
        combo: "Combo",
        bebida: "Bebida",
        postre: "Postre",
        alitas: "Alitas",
        makis: "Makis"
    };

    return categorias[categoria] || categoria || "Sin categoría";
}

function mostrarMensajeElemento(elemento, texto, color) {
    if (!elemento) {
        return;
    }

    elemento.textContent = texto;
    elemento.style.color = color;
}

function setTextContent(id, texto) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = texto;
    }
}

function setValue(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.value = valor ?? "";
    }
}

function escaparHtml(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==============================================================================================================================
// PRODUCTOS - ACTIVAR / DESACTIVAR
// ==============================================================================================================================
async function cambiarEstadoProductoAdminLinaje(idProducto, nuevoEstado) {
    const accion = Number(nuevoEstado) === 1 ? "activar" : "desactivar";

    const confirmar = confirm(`¿Seguro que deseas ${accion} este producto?`);

    if (!confirmar) {
        return;
    }

    try {
        const respuesta = await fetch(`/api/admin/productos/${idProducto}/estado`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                estado: Number(nuevoEstado)
            })
        });

        const data = await respuesta.json();

        if (!data.success) {
            alert(data.message || "No se pudo cambiar el estado del producto.");
            return;
        }

        alert(data.message || "Estado del producto actualizado correctamente.");
        cargarProductosAdminLinaje();

    } catch (error) {
        console.error("Error cambiando estado del producto:", error);
        alert("Error al conectar con el servidor.");
    }

}

// ==============================================================================================================================
// PRODUCTOS - SUBIR IMAGEN CON DRAG & DROP
// ==============================================================================================================================
function configurarSubidaImagenProducto() {
    const drop = document.getElementById("dropImagenProducto");
    const input = document.getElementById("inputImagenProducto");
    const preview = document.getElementById("previewImagenProducto");
    const rutaInput = document.getElementById("productoImagen");

    if (!drop || !input || !preview || !rutaInput) {
        return;
    }

    drop.addEventListener("click", () => {
        input.click();
    });

    input.addEventListener("change", () => {
        const archivo = input.files[0];

        if (archivo) {
            subirImagenProducto(archivo);
        }
    });

    drop.addEventListener("dragover", (e) => {
        e.preventDefault();
        drop.classList.add("dragover");
    });

    drop.addEventListener("dragleave", () => {
        drop.classList.remove("dragover");
    });

    drop.addEventListener("drop", (e) => {
        e.preventDefault();
        drop.classList.remove("dragover");

        const archivo = e.dataTransfer.files[0];

        if (archivo) {
            subirImagenProducto(archivo);
        }
    });
}

async function subirImagenProducto(archivo) {
    const preview = document.getElementById("previewImagenProducto");
    const rutaInput = document.getElementById("productoImagen");
    const mensaje = document.getElementById("mensajeProducto");

    if (!archivo.type.startsWith("image/")) {
        mostrarMensajeElemento(mensaje, "Solo puedes subir imágenes.", "red");
        return;
    }

    const formData = new FormData();
    formData.append("imagen", archivo);

    mostrarMensajeElemento(mensaje, "Subiendo imagen...", "#2a5298");

    try {
        const respuesta = await fetch("/api/admin/productos/imagen", {
            method: "POST",
            body: formData
        });

        const data = await respuesta.json();

        if (!data.success) {
            mostrarMensajeElemento(mensaje, data.message || "No se pudo subir la imagen.", "red");
            return;
        }

        rutaInput.value = data.imagen_ruta;

        preview.innerHTML = `
            <img src="${data.imagen_ruta}" alt="Imagen del producto">
        `;

        mostrarMensajeElemento(mensaje, "Imagen subida correctamente.", "green");

    } catch (error) {
        console.error("Error subiendo imagen:", error);
        mostrarMensajeElemento(mensaje, "Error al subir la imagen.", "red");
    }
}