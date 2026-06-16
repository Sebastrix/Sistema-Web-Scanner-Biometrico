// ==============================================================================================================================
// USUARIO PRINCIPAL - LINAJE
// ==============================================================================================================================

let cuentaClienteActual = null;

// ==============================================================================================================================
// INICIO
// ==============================================================================================================================
document.addEventListener("DOMContentLoaded", async () => {
    verificarSesionCliente();

    iniciarBannerSlider();
    configurarMenuPerfil();
    configurarVistasPerfil();
    configurarFormularioDatosCliente();
    configurarCerrarSesionUsuario();

    configurarModalDetallePedido();
    configurarCarritoLinaje();
    cargarCarritoDesdeStorage();
    inicializarReservas();

    await cargarProductosDesdeSQL();

    cargarRecomendacionesIA();
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

    if (btnNext) {
        btnNext.addEventListener("click", () => {
            mostrarSlide(indexActual + 1);
            reiniciarAutoSlide();
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener("click", () => {
            mostrarSlide(indexActual - 1);
            reiniciarAutoSlide();
        });
    }

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

    if (dropdown) {
        dropdown.addEventListener("click", (e) => e.stopPropagation());
    }
}

function cerrarDropdownPerfil() {
    const dropdown = document.getElementById("perfilDropdown");
    if (dropdown) dropdown.classList.remove("active");
}

// ==============================================================================================================================
// CAMBIO DE VISTAS INTERNAS DEL USUARIO
// ==============================================================================================================================
function configurarVistasPerfil() {
    const btnDatosDropdown = document.getElementById("btnVistaDatosCliente");
    const btnPagoDropdown = document.getElementById("btnVistaMetodoPago");
    const btnPedidosDropdown = document.getElementById("btnVistaPedidos");

    const btnMenuInicio = document.getElementById("btnMenuInicio");
    const btnMenuPedidos = document.getElementById("btnMenuPedidos");
    const btnMenuDatos = document.getElementById("btnMenuDatos");
    const btnMenuPago = document.getElementById("btnMenuPago");

    if (btnDatosDropdown) {
        btnDatosDropdown.addEventListener("click", () => abrirVistaDatosCliente());
    }

    if (btnPagoDropdown) {
        btnPagoDropdown.addEventListener("click", () => {
            mostrarVistaUsuario("vistaMetodoPago");
            cerrarDropdownPerfil();
        });
    }

    if (btnPedidosDropdown) {
        btnPedidosDropdown.addEventListener("click", () => {
            mostrarVistaUsuario("vistaPedidos");
            cargarMisPedidos();
            cerrarDropdownPerfil();
        });
    }

    if (btnMenuInicio) {
        btnMenuInicio.addEventListener("click", (e) => {
            e.preventDefault();
            mostrarVistaUsuario("vistaInicio");
            marcarMenuActivo(btnMenuInicio);
        });
    }

    if (btnMenuPedidos) {
        btnMenuPedidos.addEventListener("click", (e) => {
            e.preventDefault();
            mostrarVistaUsuario("vistaPedidos");
            cargarMisPedidos();
            marcarMenuActivo(btnMenuPedidos);
        });
    }

    if (btnMenuDatos) {
        btnMenuDatos.addEventListener("click", (e) => {
            e.preventDefault();
            abrirVistaDatosCliente();
            marcarMenuActivo(btnMenuDatos);
        });
    }

    if (btnMenuPago) {
        btnMenuPago.addEventListener("click", (e) => {
            e.preventDefault();
            mostrarVistaUsuario("vistaMetodoPago");
            marcarMenuActivo(btnMenuPago);
        });
    }

    document.querySelectorAll(".btn-volver-inicio").forEach(btn => {
        btn.addEventListener("click", () => {
            mostrarVistaUsuario("vistaInicio");
            if (btnMenuInicio) marcarMenuActivo(btnMenuInicio);
        });
    });
}

function mostrarVistaUsuario(idVista) {
    document.querySelectorAll(".vista-contenido").forEach(v => {
        v.classList.remove("active-view");
    });

    const vistaSeleccionada = document.getElementById(idVista);
    if (vistaSeleccionada) vistaSeleccionada.classList.add("active-view");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function marcarMenuActivo(enlaceActivo) {
    document.querySelectorAll(".menu a").forEach(e => {
        e.classList.remove("active");
    });

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

        document.getElementById("editNombres").value = cliente.nombres || "";
        document.getElementById("editApellidos").value = cliente.apellidos || "";
        document.getElementById("editCelular").value = cliente.celular || "";
        document.getElementById("editUsuario").value = cliente.usuario || "";
        document.getElementById("editDireccion").value = cliente.direccion || "";
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

    if (formDatosCliente) {
        formDatosCliente.addEventListener("submit", guardarDatosClientePerfil);
    }
}

async function guardarDatosClientePerfil(e) {
    e.preventDefault();

    if (!cuentaClienteActual || !cuentaClienteActual.id_cliente) {
        mostrarMensajeDatosCliente("No se encontró la sesión del cliente.", "red");
        return;
    }

    const datos = {
        nombres: document.getElementById("editNombres").value.trim(),
        apellidos: document.getElementById("editApellidos").value.trim(),
        celular: document.getElementById("editCelular").value.trim(),
        direccion: document.getElementById("editDireccion").value.trim(),
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
            headers: {
                "Content-Type": "application/json"
            },
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
            </article>
        `;
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
        </article>
    `;

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
                </article>
            `;
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
                </article>
            `;
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
                </article>
            `;
        });

        configurarBotonesAgregarCarrito();

    } catch (error) {
        console.error("Error cargando recomendaciones IA:", error);

        contenedor.innerHTML = `
            <article class="product-card">
                <div class="product-info">
                    <h3>Error en recomendaciones IA</h3>
                    <p>No se pudo conectar con el motor inteligente Prolog.</p>
                </div>
            </article>
        `;
    }
}

function formatearCategoriaIA(categoria) {
    const categorias = {
        hamburguesa: "Hamburguesa",
        salchipapa: "Salchipapa",
        combo: "Combo",
        bebida: "Bebida",
        postre: "Postre",
        alitas: "Alitas",
        makis: "Makis"
    };

    return categorias[categoria] || categoria;
}

// ==============================================================================================================================
// PRODUCTOS - CARGAR DESDE SQL SERVER
// ==============================================================================================================================
async function cargarProductosDesdeSQL() {
    const contenedor = document.getElementById("contenedorProductos");

    if (!contenedor) {
        console.warn("No se encontró el contenedor #contenedorProductos en UsuarioPrincipal.html");
        return;
    }

    contenedor.innerHTML = "<p>Cargando productos...</p>";

    try {
        const respuesta = await fetch("/api/productos");
        const data = await respuesta.json();

        if (!data.success) {
            contenedor.innerHTML = `
                <article class="product-card">
                    <div class="product-info">
                        <h3>No se pudieron cargar productos</h3>
                        <p>${data.message || "Error al obtener productos del servidor."}</p>
                    </div>
                </article>
            `;
            return;
        }

        productosLinajeDisponibles = data.productos || [];

        if (productosLinajeDisponibles.length === 0) {
            contenedor.innerHTML = `
                <article class="product-card">
                    <div class="product-info">
                        <h3>No hay productos disponibles</h3>
                        <p>Actualmente no hay productos activos en el menú.</p>
                    </div>
                </article>
            `;
            return;
        }

        renderizarProductosUsuario(productosLinajeDisponibles);

    } catch (error) {
        console.error("Error cargando productos:", error);

        contenedor.innerHTML = `
            <article class="product-card">
                <div class="product-info">
                    <h3>Error de conexión</h3>
                    <p>No se pudo conectar con el servidor para cargar productos.</p>
                </div>
            </article>
        `;
    }
}

// ==============================================================================================================================
// PRODUCTOS - RENDERIZAR EN INTERFAZ USUARIO
// ==============================================================================================================================
function renderizarProductosUsuario(productos) {
    const contenedor = document.getElementById("contenedorProductos");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    productos.forEach(producto => {
        const imagen = producto.imagen_ruta || "/IMG/Productos/sin-imagen.png";

        contenedor.innerHTML += `
            <article class="product-card" data-id-producto="${producto.id_producto}">
                <button class="favorite">♡</button>

                <img src="${imagen}" alt="${escaparHtmlUsuario(producto.nombre)}">

                <div class="product-info">
                    <h3>${escaparHtmlUsuario(producto.nombre)}</h3>
                    <p>${escaparHtmlUsuario(producto.descripcion || "Producto del restaurante Linaje.")}</p>

                    <div class="product-footer">
                        <strong>S/ ${Number(producto.precio || 0).toFixed(2)}</strong>

                        <button
                            type="button"
                            data-id-producto="${producto.id_producto}"
                        >
                            🛒 Agregar
                        </button>
                    </div>
                </div>
            </article>
        `;
    });

    configurarBotonesAgregarCarrito();
}

// ==============================================================================================================================
// PRODUCTOS - UTILIDADES
// ==============================================================================================================================
function obtenerProductoPorId(idProducto) {
    const producto = productosLinajeDisponibles.find(
        item => Number(item.id_producto) === Number(idProducto)
    );

    if (!producto) return null;

    return {
        id_producto: Number(producto.id_producto),
        nombre: producto.nombre,
        precio: Number(producto.precio),
        imagen: producto.imagen_ruta || "/IMG/Productos/sin-imagen.png"
    };
}

function obtenerProductoPorNombre(nombre) {
    if (!nombre) return null;

    const nombreNormalizado = normalizarTextoProducto(nombre);

    const producto = productosLinajeDisponibles.find(
        item => normalizarTextoProducto(item.nombre) === nombreNormalizado
    );

    if (!producto) return null;

    return {
        id_producto: Number(producto.id_producto),
        nombre: producto.nombre,
        precio: Number(producto.precio),
        imagen: producto.imagen_ruta || "/IMG/Productos/sin-imagen.png"
    };
}

function normalizarTextoProducto(texto) {
    return String(texto || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function escaparHtmlUsuario(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==============================================================================================================================
// CARRITO DE COMPRAS
// ==============================================================================================================================
let carritoLinaje = [];

let streamPedidoFacial = null;
let modelosPedidoCargados = false;
let loopDeteccionPedido = null;
let rostroPedidoEnPosicion = false;

function configurarCarritoLinaje() {
    configurarBotonesAgregarCarrito();

    const btnAbrirCarrito = document.getElementById("btnAbrirCarrito");
    const btnCerrarCarrito = document.getElementById("btnCerrarCarrito");
    const btnProcederCompra = document.getElementById("btnProcederCompra");
    const btnActivarCamara = document.getElementById("btnActivarCamaraPedido");
    const btnConfirmarFacial = document.getElementById("btnConfirmarPedidoFacial");
    const btnCerrarValidacion = document.getElementById("btnCerrarValidacionPedido");

    if (btnAbrirCarrito) btnAbrirCarrito.addEventListener("click", abrirCarrito);
    if (btnCerrarCarrito) btnCerrarCarrito.addEventListener("click", cerrarCarrito);
    if (btnProcederCompra) btnProcederCompra.addEventListener("click", abrirValidacionFacialPedido);
    if (btnActivarCamara) btnActivarCamara.addEventListener("click", activarCamaraPedidoFacial);
    if (btnConfirmarFacial) btnConfirmarFacial.addEventListener("click", validarYRegistrarPedido);
    if (btnCerrarValidacion) btnCerrarValidacion.addEventListener("click", cerrarValidacionFacialPedido);
}
// FUNCIONES DE CARRITOS
function configurarBotonesAgregarCarrito() {
    document.querySelectorAll(".product-card").forEach(card => {
        const botonAgregar = card.querySelector(".product-footer button");

        if (!botonAgregar) return;
        if (botonAgregar.dataset.carritoConfigurado === "true") return;

        botonAgregar.dataset.carritoConfigurado = "true";

        botonAgregar.addEventListener("click", () => {
            const idProducto =
                botonAgregar.dataset.idProducto ||
                card.dataset.idProducto;

            let producto = null;

            if (idProducto) {
                producto = obtenerProductoPorId(idProducto);
            }

            if (!producto) {
                const nombre = card.querySelector(".product-info h3")?.textContent.trim();
                producto = obtenerProductoPorNombre(nombre);
            }

            if (!producto) {
                alert("No se pudo identificar el producto.");
                return;
            }

            agregarProductoAlCarrito(producto);
        });
    });
}

function agregarProductoAlCarrito(producto) {
    const existente = carritoLinaje.find(i => i.id_producto === producto.id_producto);

    if (existente) {
        existente.cantidad += 1;
        existente.subtotal = existente.cantidad * existente.precio;
    } else {
        carritoLinaje.push({
            ...producto,
            cantidad: 1,
            subtotal: producto.precio
        });
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
    const totalHeader = document.getElementById("totalCarritoHeader");
    const totalModal = document.getElementById("totalCarritoModal");
    const contador = document.querySelector(".cart-count");

    const total = carritoLinaje.reduce((s, i) => s + Number(i.subtotal), 0);
    const cantidadTotal = carritoLinaje.reduce((s, i) => s + Number(i.cantidad), 0);

    if (contador) contador.textContent = cantidadTotal;
    if (totalHeader) totalHeader.textContent = `S/ ${total.toFixed(2)}`;
    if (totalModal) totalModal.textContent = `S/ ${total.toFixed(2)}`;

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
            </div>
        `;
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

async function abrirValidacionFacialPedido() {
    if (carritoLinaje.length === 0) {
        alert("Agrega productos al carrito antes de comprar.");
        return;
    }

    cerrarCarrito();

    const modal = document.getElementById("modalValidacionPedido");

    if (modal) modal.classList.add("active");

    rostroPedidoEnPosicion = false;
    mostrarMensajePedidoFacial("Preparando scanner facial...", "#003f91");

    await cargarModelosPedidoFacial();
}

function cerrarValidacionFacialPedido() {
    detenerCamaraPedidoFacial();

    const modal = document.getElementById("modalValidacionPedido");

    if (modal) modal.classList.remove("active");

    mostrarMensajePedidoFacial("", "");
}

// ==============================================================================================================================
// PEDIDO FACIAL - CARGAR MODELOS FACE-API
// ==============================================================================================================================
async function cargarModelosPedidoFacial() {
    if (modelosPedidoCargados) return true;

    if (typeof faceapi === "undefined") {
        mostrarMensajePedidoFacial("No se cargó face-api.min.js en el HTML.", "red");
        return false;
    }

    try {
        mostrarMensajePedidoFacial("Cargando inteligencia artificial...", "#f6a019");

        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
            faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
            faceapi.nets.faceRecognitionNet.loadFromUri("/models")
        ]);

        modelosPedidoCargados = true;

        mostrarMensajePedidoFacial("Módulos listos. Activa la cámara.", "#003f91");

        return true;

    } catch (error) {
        console.error("Error cargando modelos para pedido:", error);
        mostrarMensajePedidoFacial("No se pudieron cargar los modelos faciales.", "red");
        return false;
    }
}

async function activarCamaraPedidoFacial() {
    if (!modelosPedidoCargados) {
        mostrarMensajePedidoFacial("Espera a que carguen los módulos faciales.", "#f6a019");
        return;
    }

    try {
        const video = document.getElementById("videoPedidoFacial");

        if (!video) {
            mostrarMensajePedidoFacial("No se encontró el video del scanner.", "red");
            return;
        }

        streamPedidoFacial = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 640,
                height: 480,
                facingMode: "user"
            },
            audio: false
        });

        video.srcObject = streamPedidoFacial;
        rostroPedidoEnPosicion = false;

        video.onloadedmetadata = () => {
            video.play();
            iniciarScannerPedidoFacial();
        };

        mostrarMensajePedidoFacial("Centra tu rostro dentro del óvalo.", "#f6a019");

    } catch (error) {
        console.error("Error activando cámara:", error);
        mostrarMensajePedidoFacial("No se pudo activar la cámara.", "red");
    }
}

function detenerCamaraPedidoFacial() {
    if (loopDeteccionPedido) {
        cancelAnimationFrame(loopDeteccionPedido);
        loopDeteccionPedido = null;
    }

    const canvasOverlay = document.getElementById("canvasOverlayPedido");

    if (canvasOverlay) {
        const ctx = canvasOverlay.getContext("2d");
        ctx.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
    }

    setEstadoOvaloPedido("neutral");
    rostroPedidoEnPosicion = false;

    if (streamPedidoFacial) {
        streamPedidoFacial.getTracks().forEach(track => track.stop());
        streamPedidoFacial = null;
    }

    const video = document.getElementById("videoPedidoFacial");

    if (video) {
        video.srcObject = null;
        video.onloadedmetadata = null;
    }
}

// ==============================================================================================================================
// VALIDAR Y REGISTRAR PEDIDO FACIAL CON RESERVA
// ==============================================================================================================================
async function validarYRegistrarPedido() {
    if (!cuentaClienteActual || !cuentaClienteActual.id_cliente) {
        mostrarMensajePedidoFacial("No se encontró la sesión del cliente.", "red");
        return;
    }

    if (carritoLinaje.length === 0) {
        mostrarMensajePedidoFacial("El carrito está vacío.", "red");
        return;
    }

    if (!streamPedidoFacial) {
        mostrarMensajePedidoFacial("Primero activa la cámara.", "red");
        return;
    }

    if (!rostroPedidoEnPosicion) {
        mostrarMensajePedidoFacial("⚠️ Centra tu rostro dentro del óvalo antes de validar el pedido.", "#f6a019");
        return;
    }

    const video = document.getElementById("videoPedidoFacial");
    const canvas = document.getElementById("canvasPedidoFacial");

    if (!video || !canvas) {
        mostrarMensajePedidoFacial("No se encontró el scanner facial.", "red");
        return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
        mostrarMensajePedidoFacial("La cámara aún no está lista.", "red");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    const imagenRostro = canvas.toDataURL("image/png");
    const metodoPagoInput = document.getElementById("metodoPagoPedido");
    const metodoPago = metodoPagoInput ? metodoPagoInput.value : "Efectivo";

    const tipoPedidoInput = document.getElementById("tipo_pedido");
    const fechaReservaInput = document.getElementById("fecha_reserva");
    const horaReservaInput = document.getElementById("hora_reserva");
    const observacionReservaInput = document.getElementById("observacion_reserva");

    const tipo_pedido = tipoPedidoInput ? tipoPedidoInput.value : "Inmediato";
    const fecha_reserva = fechaReservaInput ? fechaReservaInput.value || null : null;
    const hora_reserva = horaReservaInput ? horaReservaInput.value || null : null;
    const observacion_reserva = observacionReservaInput ? observacionReservaInput.value || null : null;

    if (tipo_pedido === "Reservado" && (!fecha_reserva || !hora_reserva)) {
        mostrarMensajePedidoFacial("Debes seleccionar fecha y hora para el pedido reservado.", "red");
        return;
    }

        mostrarMensajePedidoFacial("Validando datos biométricos...", "#003f91");
        await new Promise(resolve => setTimeout(resolve, 50));
        
    try {
        const respuesta = await fetch("/api/pedidos/validar-rostro-y-registrar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_cliente: cuentaClienteActual.id_cliente,
                metodo_pago: metodoPago,
                carrito: carritoLinaje,
                imagenRostro,
                tipo_pedido,
                fecha_reserva,
                hora_reserva,
                observacion_reserva
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
// PEDIDO FACIAL - SCANNER EN TIEMPO REAL
// ==============================================================================================================================
async function iniciarScannerPedidoFacial() {
    const video = document.getElementById("videoPedidoFacial");
    const canvas = document.getElementById("canvasOverlayPedido");

    if (!video || !canvas || !streamPedidoFacial) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
        loopDeteccionPedido = requestAnimationFrame(iniciarScannerPedidoFacial);
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    async function tick() {
        if (!streamPedidoFacial) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        try {
            const deteccion = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 320,
                    scoreThreshold: 0.4
                }))
                .withFaceLandmarks(true);

            if (deteccion) {
                const estaCentrado = evaluarPosicionRostroPedido(
                    deteccion,
                    canvas.width,
                    canvas.height
                );

                if (estaCentrado) {
                    dibujarLandmarksPedido(ctx, deteccion, {
                        colorPunto: "rgba(0, 255, 120, 1)",
                        colorLinea: "rgba(0, 255, 120, 0.85)",
                        colorCaja: "rgba(0, 255, 120, 0.65)"
                    });

                    setEstadoOvaloPedido("ok");
                    rostroPedidoEnPosicion = true;
                    mostrarMensajePedidoFacial("✅ Cara detectada. Puedes validar el pedido.", "green");

                } else {
                    dibujarLandmarksPedido(ctx, deteccion, {
                        colorPunto: "rgba(255, 200, 0, 1)",
                        colorLinea: "rgba(255, 200, 0, 0.85)",
                        colorCaja: "rgba(255, 200, 0, 0.65)"
                    });

                    setEstadoOvaloPedido("warning");
                    rostroPedidoEnPosicion = false;
                    mostrarMensajePedidoFacial("⚠️ Centra tu rostro dentro del óvalo.", "#f6a019");
                }

            } else {
                setEstadoOvaloPedido("error");
                rostroPedidoEnPosicion = false;
                mostrarMensajePedidoFacial("❌ No se detecta rostro.", "red");
            }

        } catch (error) {
            console.error("Error en scanner facial de pedido:", error);
        }

        loopDeteccionPedido = requestAnimationFrame(tick);
    }

    tick();
}

// ==============================================================================================================================
// PEDIDO FACIAL - EVALUAR SI EL ROSTRO ESTÁ CENTRADO
// ==============================================================================================================================
function evaluarPosicionRostroPedido(deteccion, anchoCanvas, altoCanvas) {
    const box = deteccion.detection.box;

    const centroRostroX = box.x + box.width / 2;
    const centroRostroY = box.y + box.height / 2;

    const centroCanvasX = anchoCanvas / 2;
    const centroCanvasY = altoCanvas / 2;

    const toleranciaX = anchoCanvas * 0.20;
    const toleranciaY = altoCanvas * 0.22;

    const rostroCentradoX = Math.abs(centroRostroX - centroCanvasX) <= toleranciaX;
    const rostroCentradoY = Math.abs(centroRostroY - centroCanvasY) <= toleranciaY;

    const rostroTamanoCorrecto =
        box.width >= anchoCanvas * 0.18 &&
        box.width <= anchoCanvas * 0.65 &&
        box.height >= altoCanvas * 0.25 &&
        box.height <= altoCanvas * 0.85;

    return rostroCentradoX && rostroCentradoY && rostroTamanoCorrecto;
}

// ==============================================================================================================================
// PEDIDO FACIAL - DIBUJAR LANDMARKS
// ==============================================================================================================================
function dibujarLandmarksPedido(ctx, deteccion, colores) {
    const box = deteccion.detection.box;
    const puntos = deteccion.landmarks.positions;

    ctx.strokeStyle = colores.colorCaja;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    ctx.strokeStyle = colores.colorLinea;
    ctx.lineWidth = 2;

    const segmentos = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        [17, 18, 19, 20, 21],
        [22, 23, 24, 25, 26],
        [27, 28, 29, 30],
        [31, 32, 33, 34, 35],
        [36, 37, 38, 39, 40, 41, 36],
        [42, 43, 44, 45, 46, 47, 42],
        [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 48],
        [60, 61, 62, 63, 64, 65, 66, 67, 60]
    ];

    segmentos.forEach(segmento => {
        ctx.beginPath();
        ctx.moveTo(puntos[segmento[0]].x, puntos[segmento[0]].y);

        for (let i = 1; i < segmento.length; i++) {
            ctx.lineTo(puntos[segmento[i]].x, puntos[segmento[i]].y);
        }

        ctx.stroke();
    });

    puntos.forEach(punto => {
        ctx.beginPath();
        ctx.arc(punto.x, punto.y, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = colores.colorPunto;
        ctx.fill();
    });
}

// ==============================================================================================================================
// PEDIDO FACIAL - CAMBIAR ESTADO DEL ÓVALO
// ==============================================================================================================================
function setEstadoOvaloPedido(estado) {
    const ovalo = document.querySelector(".face-oval-guide-pedido");

    if (!ovalo) return;

    ovalo.classList.remove("ovalo-ok", "ovalo-warning", "ovalo-error");

    if (estado === "ok") ovalo.classList.add("ovalo-ok");
    if (estado === "warning") ovalo.classList.add("ovalo-warning");
    if (estado === "error") ovalo.classList.add("ovalo-error");
}

// ==============================================================================================================================
// PEDIDOS - CARGAR MIS PEDIDOS
// ==============================================================================================================================
async function cargarMisPedidos() {
    const tabla = document.getElementById("tablaMisPedidos");

    if (!tabla) return;

    if (!cuentaClienteActual || !cuentaClienteActual.id_cliente) {
        tabla.innerHTML = `
            <tr>
                <td colspan="5">No se encontró la sesión del cliente.</td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = `
        <tr>
            <td colspan="5">Cargando pedidos...</td>
        </tr>
    `;

    try {
        const respuesta = await fetch(`/api/pedidos/cliente/${cuentaClienteActual.id_cliente}`);
        const data = await respuesta.json();

        if (!data.success) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="5">${data.message || "No se pudieron cargar los pedidos."}</td>
                </tr>
            `;
            return;
        }

        if (!data.pedidos || data.pedidos.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="5">Aún no tienes pedidos registrados.</td>
                </tr>
            `;
            return;
        }

        tabla.innerHTML = "";

        data.pedidos.forEach(pedido => {
            const estadoClase = String(pedido.estado || "").toLowerCase().replace(/\s+/g, "-");

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
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error cargando pedidos:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="5">Error al conectar con el servidor.</td>
            </tr>
        `;
    }
}

function formatearFechaPedido(fecha) {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleString("es-PE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ==============================================================================================================================
// PEDIDOS - VER DETALLE DE PEDIDO
// ==============================================================================================================================
async function verDetallePedido(idPedido) {
    const modal = document.getElementById("modalDetallePedido");
    const contenido = document.getElementById("contenidoDetallePedido");
    const resumen = document.getElementById("detallePedidoResumen");

    if (!modal || !contenido) {
        alert("No se encontró el modal de detalle.");
        return;
    }

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
                </div>
            `;
        });

        contenido.innerHTML += `
            <div class="detalle-total-box">
                <span>Total del pedido</span>
                <strong>S/ ${Number(pedido.total).toFixed(2)}</strong>
            </div>
        `;

    } catch (error) {
        console.error("Error cargando detalle:", error);
        contenido.innerHTML = "<p>Error al conectar con el servidor.</p>";
    }
}

// ==============================================================================================================================
// MODAL DETALLE PEDIDO - CONFIGURAR CIERRE
// ==============================================================================================================================
function configurarModalDetallePedido() {
    const modal = document.getElementById("modalDetallePedido");
    const btnCerrar = document.getElementById("btnCerrarDetallePedido");

    if (btnCerrar) {
        btnCerrar.addEventListener("click", cerrarDetallePedido);
    }

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

// ==============================================================================================================================
// RESERVAS - MOSTRAR / OCULTAR CAMPOS SEGÚN TIPO DE PEDIDO
// ==============================================================================================================================
function inicializarReservas() {
    const tipoPedido = document.getElementById("tipo_pedido");
    const reservaCampos = document.getElementById("reserva_campos");

    if (!tipoPedido || !reservaCampos) return;

    reservaCampos.style.display = tipoPedido.value === "Reservado" ? "block" : "none";

    tipoPedido.addEventListener("change", () => {
        reservaCampos.style.display = tipoPedido.value === "Reservado" ? "block" : "none";
    });
}
