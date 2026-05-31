// ==============================================================================================================================
// USUARIO PRINCIPAL - LINAJE
// ==============================================================================================================================

let cuentaClienteActual = null;

// ==============================================================================================================================
// INICIO
// ==============================================================================================================================
document.addEventListener("DOMContentLoaded", () => {
    verificarSesionCliente();
    iniciarBannerSlider();
    configurarMenuPerfil();
    configurarVistasPerfil();
    configurarFormularioDatosCliente();
    configurarCerrarSesionUsuario();
    cargarRecomendacionesIA();
    configurarModalDetallePedido(); // CORREGIDO: unificado aquí
    configurarCarritoLinaje();
    cargarCarritoDesdeStorage();
});

// ==============================================================================================================================
// VERIFICAR SESIÓN DEL CLIENTE
// ==============================================================================================================================
function verificarSesionCliente() {
    const cuentaGuardada = localStorage.getItem("cuentaLinaje");

    if (!cuentaGuardada) {
        window.location.href = "/login";
        return;
    }

    try {
        cuentaClienteActual = JSON.parse(cuentaGuardada);
    } catch (error) {
        localStorage.removeItem("cuentaLinaje");
        window.location.href = "/login";
        return;
    }

    if (!cuentaClienteActual || Number(cuentaClienteActual.rol) !== 0) {
        localStorage.removeItem("cuentaLinaje");
        window.location.href = "/login";
        return;
    }

    const nombreHeader = document.getElementById("nombreClienteHeader");
    if (nombreHeader) {
        nombreHeader.textContent = cuentaClienteActual.nombres || cuentaClienteActual.usuario;
    }
}

// ==============================================================================================================================
// CERRAR SESIÓN
// ==============================================================================================================================
function configurarCerrarSesionUsuario() {
    const btnCerrarSesion = document.getElementById("btnCerrarSesionUsuario");

    if (!btnCerrarSesion) return;

    btnCerrarSesion.addEventListener("click", () => {
        const confirmar = confirm("¿Deseas cerrar sesión?");
        if (!confirmar) return;

        localStorage.removeItem("cuentaLinaje");
        sessionStorage.clear();
        window.location.href = "/login";
    });
}

// ==============================================================================================================================
// SLIDER DE PORTADAS
// ==============================================================================================================================
function iniciarBannerSlider() {
    const track = document.getElementById("bannerTrack");
    const slides = document.querySelectorAll(".banner-slide");
    const dots = document.querySelectorAll("#bannerDots button");
    const btnPrev = document.getElementById("btnBannerPrev");
    const btnNext = document.getElementById("btnBannerNext");

    if (!track || slides.length === 0) return;

    let indexActual = 0;
    let intervaloSlider;

    function mostrarSlide(index) {
        if (index < 0) {
            indexActual = slides.length - 1;
        } else if (index >= slides.length) {
            indexActual = 0;
        } else {
            indexActual = index;
        }

        track.style.transform = `translateX(-${indexActual * 100}%)`;
        dots.forEach(dot => dot.classList.remove("active"));
        if (dots[indexActual]) dots[indexActual].classList.add("active");
    }

    function iniciarAutoSlide() {
        intervaloSlider = setInterval(() => mostrarSlide(indexActual + 1), 5000);
    }

    function reiniciarAutoSlide() {
        clearInterval(intervaloSlider);
        iniciarAutoSlide();
    }

    if (btnNext) btnNext.addEventListener("click", () => { mostrarSlide(indexActual + 1); reiniciarAutoSlide(); });
    if (btnPrev) btnPrev.addEventListener("click", () => { mostrarSlide(indexActual - 1); reiniciarAutoSlide(); });

    dots.forEach(dot => {
        dot.addEventListener("click", () => {
            mostrarSlide(Number(dot.dataset.index));
            reiniciarAutoSlide();
        });
    });

    mostrarSlide(0);
    iniciarAutoSlide();
}

// ==============================================================================================================================
// MENÚ DESPLEGABLE DEL PERFIL
// ==============================================================================================================================
function configurarMenuPerfil() {
    const btnUsuario = document.getElementById("btnUsuarioSesion");
    const dropdown = document.getElementById("perfilDropdown");

    if (btnUsuario && dropdown) {
        btnUsuario.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("active");
        });
    }

    document.addEventListener("click", () => cerrarDropdownPerfil());
    if (dropdown) dropdown.addEventListener("click", (e) => e.stopPropagation());
}

function cerrarDropdownPerfil() {
    const dropdown = document.getElementById("perfilDropdown");
    if (dropdown) dropdown.classList.remove("active");
}

// ==============================================================================================================================
// CAMBIO DE VISTAS INTERNAS DEL USUARIO
// ==============================================================================================================================
function configurarVistasPerfil() {
    const btnDatosDropdown   = document.getElementById("btnVistaDatosCliente");
    const btnPagoDropdown    = document.getElementById("btnVistaMetodoPago");
    const btnPedidosDropdown = document.getElementById("btnVistaPedidos");

    const btnMenuInicio  = document.getElementById("btnMenuInicio");
    const btnMenuPedidos = document.getElementById("btnMenuPedidos");
    const btnMenuDatos   = document.getElementById("btnMenuDatos");
    const btnMenuPago    = document.getElementById("btnMenuPago");

    if (btnDatosDropdown)   btnDatosDropdown.addEventListener("click",   () => abrirVistaDatosCliente());
    if (btnPagoDropdown)    btnPagoDropdown.addEventListener("click",    () => { mostrarVistaUsuario("vistaMetodoPago"); cerrarDropdownPerfil(); });
    if (btnPedidosDropdown) btnPedidosDropdown.addEventListener("click", () => { mostrarVistaUsuario("vistaPedidos"); cargarMisPedidos(); cerrarDropdownPerfil(); });

    if (btnMenuInicio)  btnMenuInicio.addEventListener("click",  (e) => { e.preventDefault(); mostrarVistaUsuario("vistaInicio"); marcarMenuActivo(btnMenuInicio); });
    if (btnMenuPedidos) btnMenuPedidos.addEventListener("click", (e) => { e.preventDefault(); mostrarVistaUsuario("vistaPedidos"); cargarMisPedidos(); marcarMenuActivo(btnMenuPedidos); });
    if (btnMenuDatos)   btnMenuDatos.addEventListener("click",   (e) => { e.preventDefault(); abrirVistaDatosCliente(); marcarMenuActivo(btnMenuDatos); });
    if (btnMenuPago)    btnMenuPago.addEventListener("click",    (e) => { e.preventDefault(); mostrarVistaUsuario("vistaMetodoPago"); marcarMenuActivo(btnMenuPago); });

    document.querySelectorAll(".btn-volver-inicio").forEach(btn => {
        btn.addEventListener("click", () => {
            mostrarVistaUsuario("vistaInicio");
            if (btnMenuInicio) marcarMenuActivo(btnMenuInicio);
        });
    });
}

function mostrarVistaUsuario(idVista) {
    document.querySelectorAll(".vista-contenido").forEach(v => v.classList.remove("active-view"));
    const vistaSeleccionada = document.getElementById(idVista);
    if (vistaSeleccionada) vistaSeleccionada.classList.add("active-view");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function marcarMenuActivo(enlaceActivo) {
    document.querySelectorAll(".menu a").forEach(e => e.classList.remove("active"));
    if (enlaceActivo) enlaceActivo.classList.add("active");
}

function abrirVistaDatosCliente() {
    mostrarVistaUsuario("vistaDatosCliente");
    cargarDatosClientePerfil();
    cerrarDropdownPerfil();
}

// ==============================================================================================================================
// CARGAR DATOS DEL CLIENTE EN PERFIL
// ==============================================================================================================================
async function cargarDatosClientePerfil() {
    if (!cuentaClienteActual || !cuentaClienteActual.id_cliente) {
        mostrarMensajeDatosCliente("No se encontró el ID del cliente.", "red");
        return;
    }

    try {
        const respuesta = await fetch(`/api/cliente/${cuentaClienteActual.id_cliente}`);
        const data = await respuesta.json();

        if (!data.success) {
            mostrarMensajeDatosCliente(data.message || "No se pudieron cargar los datos.", "red");
            return;
        }

        const cliente = data.cliente;
        document.getElementById("editNombres").value    = cliente.nombres    || "";
        document.getElementById("editApellidos").value  = cliente.apellidos  || "";
        document.getElementById("editCelular").value    = cliente.celular    || "";
        document.getElementById("editUsuario").value    = cliente.usuario    || "";
        document.getElementById("editDireccion").value  = cliente.direccion  || "";
        document.getElementById("editReferencia").value = cliente.referencia || "";
        mostrarMensajeDatosCliente("", "");

    } catch (error) {
        console.error("Error cargando datos del cliente:", error);
        mostrarMensajeDatosCliente("Error al conectar con el servidor.", "red");
    }
}

// ==============================================================================================================================
// GUARDAR DATOS DEL CLIENTE
// ==============================================================================================================================
function configurarFormularioDatosCliente() {
    const formDatosCliente = document.getElementById("formDatosCliente");
    if (formDatosCliente) formDatosCliente.addEventListener("submit", guardarDatosClientePerfil);
}

async function guardarDatosClientePerfil(e) {
    e.preventDefault();

    if (!cuentaClienteActual || !cuentaClienteActual.id_cliente) {
        mostrarMensajeDatosCliente("No se encontró la sesión del cliente.", "red");
        return;
    }

    const datos = {
        nombres:    document.getElementById("editNombres").value.trim(),
        apellidos:  document.getElementById("editApellidos").value.trim(),
        celular:    document.getElementById("editCelular").value.trim(),
        direccion:  document.getElementById("editDireccion").value.trim(),
        referencia: document.getElementById("editReferencia").value.trim()
    };

    if (!datos.nombres || !datos.apellidos || !datos.celular || !datos.direccion) {
        mostrarMensajeDatosCliente("Complete todos los campos obligatorios.", "red");
        return;
    }

    if (!validarCelular(datos.celular)) {
        mostrarMensajeDatosCliente("Ingrese un celular válido.", "red");
        return;
    }

    mostrarMensajeDatosCliente("Guardando cambios...", "#003f91");

    try {
        const respuesta = await fetch(`/api/cliente/${cuentaClienteActual.id_cliente}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const data = await respuesta.json();

        if (!data.success) {
            mostrarMensajeDatosCliente(data.message || "No se pudieron guardar los cambios.", "red");
            return;
        }

        Object.assign(cuentaClienteActual, datos);
        localStorage.setItem("cuentaLinaje", JSON.stringify(cuentaClienteActual));

        const nombreHeader = document.getElementById("nombreClienteHeader");
        if (nombreHeader) nombreHeader.textContent = datos.nombres;

        mostrarMensajeDatosCliente("Datos actualizados correctamente.", "green");

    } catch (error) {
        console.error("Error guardando datos del cliente:", error);
        mostrarMensajeDatosCliente("Error al conectar con el servidor.", "red");
    }
}

function validarCelular(celular) {
    return /^[0-9]{9,15}$/.test(celular);
}

function mostrarMensajeDatosCliente(texto, color) {
    const mensaje = document.getElementById("mensajeDatosCliente");
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.style.color = color;
}

// ==============================================================================================================================
// IA PROLOG - CARGAR RECOMENDACIONES INTELIGENTES
// ==============================================================================================================================
async function cargarRecomendacionesIA() {
    const contenedor = document.getElementById("productosRecomendadosIA");
    if (!contenedor) return;

    if (!cuentaClienteActual || !cuentaClienteActual.id_cliente) {
        contenedor.innerHTML = `
            <article class="product-card">
                <div class="product-info">
                    <h3>Recomendaciones IA</h3>
                    <p>No se encontró la sesión del cliente para generar recomendaciones.</p>
                </div>
            </article>`;
        return;
    }

    contenedor.innerHTML = `
        <article class="product-card">
            <div class="tag">IA</div>
            <div class="product-info">
                <h3>Agente inteligente Prolog</h3>
                <p>Analizando tus preferencias y compras registradas...</p>
                <div class="product-footer">
                    <strong>Cargando...</strong>
                    <button type="button">🤖 Procesando</button>
                </div>
            </div>
        </article>`;

    try {
        const respuesta = await fetch(`/api/ia/recomendaciones/${cuentaClienteActual.id_cliente}`);
        const data = await respuesta.json();

        if (!data.success) {
            contenedor.innerHTML = `
                <article class="product-card">
                    <div class="product-info">
                        <h3>Recomendaciones IA</h3>
                        <p>${data.message || "No se pudieron cargar las recomendaciones inteligentes."}</p>
                    </div>
                </article>`;
            return;
        }

        if (!data.recomendaciones || data.recomendaciones.length === 0) {
            contenedor.innerHTML = `
                <article class="product-card">
                    <div class="tag">IA</div>
                    <div class="product-info">
                        <h3>Sin recomendaciones por ahora</h3>
                        <p>Cuando realices más pedidos, el agente inteligente podrá sugerirte productos según tus preferencias.</p>
                        <div class="product-footer">
                            <strong>${data.beneficio}</strong>
                            <button type="button">Linaje IA</button>
                        </div>
                    </div>
                </article>`;
            return;
        }

        contenedor.innerHTML = "";
        data.recomendaciones.forEach(producto => {
            contenedor.innerHTML += `
                <article class="product-card">
                    <div class="tag">IA</div>
                    <button class="favorite">♡</button>
                    <img src="${producto.imagen}" alt="${producto.nombre}">
                    <div class="product-info">
                        <h3>${producto.nombre}</h3>
                        <p>Recomendado por el agente inteligente según tus preferencias. Categoría: ${formatearCategoriaIA(producto.categoria)}.</p>
                        <div class="product-footer">
                            <strong>S/ ${Number(producto.precio).toFixed(2)}</strong>
                            <button type="button">🛒 Agregar</button>
                        </div>
                    </div>
                </article>`;
        });

    } catch (error) {
        console.error("Error cargando recomendaciones IA:", error);
        contenedor.innerHTML = `
            <article class="product-card">
                <div class="product-info">
                    <h3>Error en recomendaciones IA</h3>
                    <p>No se pudo conectar con el motor inteligente Prolog.</p>
                </div>
            </article>`;
    }
}

function formatearCategoriaIA(categoria) {
    const categorias = {
        hamburguesa: "Hamburguesa",
        salchipapa:  "Salchipapa",
        combo:       "Combo",
        bebida:      "Bebida",
        postre:      "Postre"
    };
    return categorias[categoria] || categoria;
}

// ==============================================================================================================================
// CARRITO DE COMPRAS
// ==============================================================================================================================

let carritoLinaje = [];
let streamPedidoFacial = null;

function configurarCarritoLinaje() {
    document.querySelectorAll(".product-card").forEach(card => {
        const botonAgregar = card.querySelector(".product-footer button");
        if (!botonAgregar) return;

        botonAgregar.addEventListener("click", () => {
            const nombre = card.querySelector(".product-info h3")?.textContent.trim();
            const producto = obtenerProductoPorNombre(nombre);
            if (!producto) { alert("No se pudo identificar el producto."); return; }
            agregarProductoAlCarrito(producto);
        });
    });

    const btnAbrirCarrito        = document.getElementById("btnAbrirCarrito");
    const btnCerrarCarrito       = document.getElementById("btnCerrarCarrito");
    const btnProcederCompra      = document.getElementById("btnProcederCompra");
    const btnActivarCamara       = document.getElementById("btnActivarCamaraPedido");
    const btnConfirmarFacial     = document.getElementById("btnConfirmarPedidoFacial");
    const btnCerrarValidacion    = document.getElementById("btnCerrarValidacionPedido");

    if (btnAbrirCarrito)     btnAbrirCarrito.addEventListener("click", abrirCarrito);
    if (btnCerrarCarrito)    btnCerrarCarrito.addEventListener("click", cerrarCarrito);
    if (btnProcederCompra)   btnProcederCompra.addEventListener("click", abrirValidacionFacialPedido);
    if (btnActivarCamara)    btnActivarCamara.addEventListener("click", activarCamaraPedidoFacial);
    if (btnConfirmarFacial)  btnConfirmarFacial.addEventListener("click", validarYRegistrarPedido);
    if (btnCerrarValidacion) btnCerrarValidacion.addEventListener("click", cerrarValidacionFacialPedido);
}

function obtenerProductoPorNombre(nombre) {
    const productos = {
        "Clásica Linaje":    { id_producto: 1, nombre: "Clasica Linaje",    precio: 18.90, imagen: "/IMG/Productos/clasica-linaje.png" },
        "Clasica Linaje":    { id_producto: 1, nombre: "Clasica Linaje",    precio: 18.90, imagen: "/IMG/Productos/clasica-linaje.png" },
        "Salchipapas Linaje":{ id_producto: 2, nombre: "Salchipapas Linaje",precio: 16.50, imagen: "/IMG/Productos/salchipapas-linaje.png" },
        "Combo Linaje":      { id_producto: 3, nombre: "Combo Linaje",      precio: 24.90, imagen: "/IMG/Productos/combo-linaje.png" },
        "Doble Bacon":       { id_producto: 4, nombre: "Doble Bacon",       precio: 25.90, imagen: "/IMG/Productos/doble-bacon.png" },
        "Limonada Clásica":  { id_producto: 5, nombre: "Limonada Clasica",  precio: 7.90,  imagen: "/IMG/Productos/limonada-clasica.png" },
        "Limonada Clasica":  { id_producto: 5, nombre: "Limonada Clasica",  precio: 7.90,  imagen: "/IMG/Productos/limonada-clasica.png" },
        "Torta de Chocolate":{ id_producto: 6, nombre: "Torta de Chocolate",precio: 9.90,  imagen: "/IMG/Productos/torta-chocolate.png" }
    };
    return productos[nombre] || null;
}

function agregarProductoAlCarrito(producto) {
    const existente = carritoLinaje.find(i => i.id_producto === producto.id_producto);
    if (existente) {
        existente.cantidad += 1;
        existente.subtotal = existente.cantidad * existente.precio;
    } else {
        carritoLinaje.push({ ...producto, cantidad: 1, subtotal: producto.precio });
    }
    guardarCarritoEnStorage();
    actualizarVistaCarrito();
}

function eliminarProductoCarrito(idProducto) {
    carritoLinaje = carritoLinaje.filter(i => Number(i.id_producto) !== Number(idProducto));
    guardarCarritoEnStorage();
    actualizarVistaCarrito();
}

function guardarCarritoEnStorage() {
    localStorage.setItem("carritoLinaje", JSON.stringify(carritoLinaje));
}

function cargarCarritoDesdeStorage() {
    try {
        const guardado = localStorage.getItem("carritoLinaje");
        carritoLinaje = guardado ? JSON.parse(guardado) : [];
    } catch {
        carritoLinaje = [];
        localStorage.removeItem("carritoLinaje");
    }
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const listaCarrito = document.getElementById("listaCarrito");
    const totalHeader  = document.getElementById("totalCarritoHeader");
    const totalModal   = document.getElementById("totalCarritoModal");
    const contador     = document.querySelector(".cart-count");

    const total         = carritoLinaje.reduce((s, i) => s + Number(i.subtotal), 0);
    const cantidadTotal = carritoLinaje.reduce((s, i) => s + Number(i.cantidad), 0);

    if (contador)    contador.textContent     = cantidadTotal;
    if (totalHeader) totalHeader.textContent  = `S/ ${total.toFixed(2)}`;
    if (totalModal)  totalModal.textContent   = `S/ ${total.toFixed(2)}`;

    if (!listaCarrito) return;

    if (carritoLinaje.length === 0) {
        listaCarrito.innerHTML = "<p>No hay productos en el carrito.</p>";
        return;
    }

    listaCarrito.innerHTML = "";
    carritoLinaje.forEach(item => {
        listaCarrito.innerHTML += `
            <div class="item-carrito">
                <img src="${item.imagen}" alt="${item.nombre}">
                <div>
                    <h4>${item.nombre}</h4>
                    <p>Cantidad: ${item.cantidad}</p>
                    <p>Subtotal: S/ ${Number(item.subtotal).toFixed(2)}</p>
                </div>
                <button type="button" onclick="eliminarProductoCarrito(${item.id_producto})">Eliminar</button>
            </div>`;
    });
}

function abrirCarrito() {
    const modal = document.getElementById("modalCarrito");
    if (modal) modal.classList.add("active");
}

function cerrarCarrito() {
    const modal = document.getElementById("modalCarrito");
    if (modal) modal.classList.remove("active");
}

function abrirValidacionFacialPedido() {
    if (carritoLinaje.length === 0) { alert("Agrega productos al carrito antes de comprar."); return; }
    cerrarCarrito();
    const modal = document.getElementById("modalValidacionPedido");
    if (modal) modal.classList.add("active");
    mostrarMensajePedidoFacial("Activa la cámara para validar tu identidad.", "#003f91");
}

function cerrarValidacionFacialPedido() {
    detenerCamaraPedidoFacial();
    const modal = document.getElementById("modalValidacionPedido");
    if (modal) modal.classList.remove("active");
    mostrarMensajePedidoFacial("", "");
}

async function activarCamaraPedidoFacial() {
    try {
        const video = document.getElementById("videoPedidoFacial");
        streamPedidoFacial = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = streamPedidoFacial;
        mostrarMensajePedidoFacial("Cámara activada. Coloca tu rostro al centro.", "green");
    } catch (error) {
        console.error("Error activando cámara:", error);
        mostrarMensajePedidoFacial("No se pudo activar la cámara.", "red");
    }
}

function detenerCamaraPedidoFacial() {
    if (streamPedidoFacial) {
        streamPedidoFacial.getTracks().forEach(t => t.stop());
        streamPedidoFacial = null;
    }
    const video = document.getElementById("videoPedidoFacial");
    if (video) video.srcObject = null;
}

async function validarYRegistrarPedido() {
    if (!cuentaClienteActual || !cuentaClienteActual.id_cliente) { mostrarMensajePedidoFacial("No se encontró la sesión del cliente.", "red"); return; }
    if (carritoLinaje.length === 0) { mostrarMensajePedidoFacial("El carrito está vacío.", "red"); return; }
    if (!streamPedidoFacial) { mostrarMensajePedidoFacial("Primero activa la cámara.", "red"); return; }

    const video  = document.getElementById("videoPedidoFacial");
    const canvas = document.getElementById("canvasPedidoFacial");

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    const imagenRostro = canvas.toDataURL("image/png");
    const metodoPago   = document.getElementById("metodoPagoPedido").value;

    mostrarMensajePedidoFacial("Validando rostro y registrando pedido...", "#003f91");

    try {
        const respuesta = await fetch("/api/pedidos/validar-rostro-y-registrar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_cliente:  cuentaClienteActual.id_cliente,
                metodo_pago: metodoPago,
                carrito:     carritoLinaje,
                imagenRostro
            })
        });

        const data = await respuesta.json();

        if (!data.success) {
            mostrarMensajePedidoFacial(data.message || "No se pudo registrar el pedido.", "red");
            return;
        }

        mostrarMensajePedidoFacial(data.message || "Pedido registrado correctamente.", "green");
        carritoLinaje = [];
        guardarCarritoEnStorage();
        actualizarVistaCarrito();
        detenerCamaraPedidoFacial();

        setTimeout(() => {
            cerrarValidacionFacialPedido();
            cargarRecomendacionesIA();
            mostrarVistaUsuario("vistaPedidos");
            cargarMisPedidos();
        }, 1200);

    } catch (error) {
        console.error("Error registrando pedido:", error);
        mostrarMensajePedidoFacial("Error al conectar con el servidor.", "red");
    }
}

function mostrarMensajePedidoFacial(texto, color) {
    const mensaje = document.getElementById("mensajePedidoFacial");
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.style.color = color;
}

// ==============================================================================================================================
// PEDIDOS - CARGAR MIS PEDIDOS
// ==============================================================================================================================
async function cargarMisPedidos() {
    const tabla = document.getElementById("tablaMisPedidos");
    if (!tabla) return;

    if (!cuentaClienteActual || !cuentaClienteActual.id_cliente) {
        tabla.innerHTML = `<tr><td colspan="5">No se encontró la sesión del cliente.</td></tr>`;
        return;
    }

    tabla.innerHTML = `<tr><td colspan="5">Cargando pedidos...</td></tr>`;

    try {
        const respuesta = await fetch(`/api/pedidos/cliente/${cuentaClienteActual.id_cliente}`);
        const data = await respuesta.json();

        if (!data.success) {
            tabla.innerHTML = `<tr><td colspan="5">${data.message || "No se pudieron cargar los pedidos."}</td></tr>`;
            return;
        }

        if (!data.pedidos || data.pedidos.length === 0) {
            tabla.innerHTML = `<tr><td colspan="5">Aún no tienes pedidos registrados.</td></tr>`;
            return;
        }

        tabla.innerHTML = "";
        data.pedidos.forEach(pedido => {
            const estadoClase = String(pedido.estado).toLowerCase();
            tabla.innerHTML += `
                <tr>
                    <td>#${pedido.id_pedido}</td>
                    <td>${formatearFechaPedido(pedido.fecha_pedido)}</td>
                    <td>
                        <span class="estado-pedido estado-${estadoClase}">
                            ${pedido.estado}
                        </span>
                    </td>
                    <td>S/ ${Number(pedido.total).toFixed(2)}</td>
                    <td>
                        <button type="button" class="btn-detalle-pedido" onclick="verDetallePedido(${pedido.id_pedido})">
                            Ver detalle
                        </button>
                    </td>
                </tr>`;
        });

    } catch (error) {
        console.error("Error cargando pedidos:", error);
        tabla.innerHTML = `<tr><td colspan="5">Error al conectar con el servidor.</td></tr>`;
    }
}

function formatearFechaPedido(fecha) {
    if (!fecha) return "Sin fecha";
    return new Date(fecha).toLocaleString("es-PE", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
    });
}

// ==============================================================================================================================
// PEDIDOS - VER DETALLE DE PEDIDO
// ==============================================================================================================================
async function verDetallePedido(idPedido) {
    const modal     = document.getElementById("modalDetallePedido");
    const contenido = document.getElementById("contenidoDetallePedido");
    const resumen   = document.getElementById("detallePedidoResumen");

    if (!modal || !contenido) {
        alert("No se encontró el modal de detalle.");
        return;
    }

    // Abrir modal correctamente
    modal.classList.add("active");
    contenido.innerHTML = "<p>Cargando detalle del pedido...</p>";

    try {
        const respuesta = await fetch(`/api/pedidos/detalle/${idPedido}`);
        const data = await respuesta.json();

        if (!data.success) {
            contenido.innerHTML = `<p>${data.message || "No se pudo cargar el detalle del pedido."}</p>`;
            return;
        }

        const pedido = data.pedido;
        const detalle = data.detalle || [];

        if (resumen) {
            resumen.textContent = `Pedido #${pedido.id_pedido} | ${formatearFechaPedido(pedido.fecha_pedido)} | Estado: ${pedido.estado} | Pago: ${pedido.metodo_pago}`;
        }

        if (detalle.length === 0) {
            contenido.innerHTML = "<p>Este pedido no tiene productos registrados.</p>";
            return;
        }

        contenido.innerHTML = "";

        detalle.forEach(item => {
            contenido.innerHTML += `
                <div class="detalle-producto-card">
                    <img src="${item.imagen_ruta}" alt="${item.nombre}">
                    <div class="detalle-producto-info">
                        <h4>${item.nombre}</h4>
                        <p>${item.descripcion || "Producto del restaurante Linaje."}</p>
                        <p>Categoría: ${formatearCategoriaIA(item.categoria)} | Cantidad: ${item.cantidad}</p>
                    </div>
                    <div class="detalle-producto-monto">
                        <span>S/ ${Number(item.precio_unitario).toFixed(2)} c/u</span>
                        S/ ${Number(item.subtotal).toFixed(2)}
                    </div>
                </div>`;
        });

        contenido.innerHTML += `
            <div class="detalle-total-box">
                <span>Total del pedido</span>
                <strong>S/ ${Number(pedido.total).toFixed(2)}</strong>
            </div>`;

    } catch (error) {
        console.error("Error cargando detalle:", error);
        contenido.innerHTML = "<p>Error al conectar con el servidor.</p>";
    }
}

// ==============================================================================================================================
// MODAL DETALLE PEDIDO - CONFIGURAR CIERRE
// ==============================================================================================================================
function configurarModalDetallePedido() {
    const modal   = document.getElementById("modalDetallePedido");
    const btnCerrar = document.getElementById("btnCerrarDetallePedido");

    if (btnCerrar) {
        btnCerrar.addEventListener("click", cerrarDetallePedido);
    }

    // Cerrar al hacer clic fuera del contenido
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) cerrarDetallePedido();
        });
    }
}

function cerrarDetallePedido() {
    const modal = document.getElementById("modalDetallePedido");
    if (modal) modal.classList.remove("active");
}