:- use_module(library(http/json)).
:- use_module(library(lists)).

:- dynamic producto/5.
:- dynamic compra/2.

% =====================================================================
% BASE DINAMICA
% producto(ID, Nombre, Categoria, Precio, Imagen).
% compra(ClienteID, ProductoID).
% =====================================================================

% =====================================================================
% RELACIONES DE RECOMENDACION
% recomienda_por_categoria(CategoriaComprada, CategoriaRecomendada).
% =====================================================================

% Si compra hamburguesa
recomienda_por_categoria(hamburguesa, bebida).
recomienda_por_categoria(hamburguesa, salchipapa).
recomienda_por_categoria(hamburguesa, postre).
recomienda_por_categoria(hamburguesa, alitas).

% Si compra salchipapa
recomienda_por_categoria(salchipapa, bebida).
recomienda_por_categoria(salchipapa, hamburguesa).
recomienda_por_categoria(salchipapa, alitas).
recomienda_por_categoria(salchipapa, combo).

% Si compra combo
recomienda_por_categoria(combo, bebida).
recomienda_por_categoria(combo, postre).
recomienda_por_categoria(combo, hamburguesa).
recomienda_por_categoria(combo, alitas).
recomienda_por_categoria(combo, makis).

% Si compra bebida
recomienda_por_categoria(bebida, hamburguesa).
recomienda_por_categoria(bebida, salchipapa).
recomienda_por_categoria(bebida, postre).
recomienda_por_categoria(bebida, alitas).
recomienda_por_categoria(bebida, makis).
recomienda_por_categoria(bebida, combo).

% Si compra postre
recomienda_por_categoria(postre, bebida).
recomienda_por_categoria(postre, combo).
recomienda_por_categoria(postre, hamburguesa).
recomienda_por_categoria(postre, makis).

% Si compra alitas
recomienda_por_categoria(alitas, bebida).
recomienda_por_categoria(alitas, salchipapa).
recomienda_por_categoria(alitas, hamburguesa).
recomienda_por_categoria(alitas, postre).
recomienda_por_categoria(alitas, combo).
recomienda_por_categoria(alitas, makis).

% Si compra makis
recomienda_por_categoria(makis, bebida).
recomienda_por_categoria(makis, postre).
recomienda_por_categoria(makis, combo).
recomienda_por_categoria(makis, alitas).
recomienda_por_categoria(makis, hamburguesa).

% =====================================================================
% CATEGORIAS COMPRADAS POR EL CLIENTE
% =====================================================================

categoria_comprada(ClienteID, Categoria) :-
    compra(ClienteID, ProductoID),
    producto(ProductoID, _, Categoria, _, _).

categorias_compradas_lista(ClienteID, ListaCategorias) :-
    findall(
        Categoria,
        categoria_comprada(ClienteID, Categoria),
        ListaCategorias
    ).

categorias_compradas_unicas(ClienteID, CategoriasUnicas) :-
    setof(
        Categoria,
        categoria_comprada(ClienteID, Categoria),
        CategoriasUnicas
    ).

% =====================================================================
% CONTAR CUANTAS VECES COMPRO CADA CATEGORIA
% =====================================================================

contar_categoria(_, [], 0).

contar_categoria(Categoria, [Categoria | Resto], Cantidad) :-
    contar_categoria(Categoria, Resto, CantidadResto),
    Cantidad is CantidadResto + 1.

contar_categoria(Categoria, [OtraCategoria | Resto], Cantidad) :-
    Categoria \= OtraCategoria,
    contar_categoria(Categoria, Resto, Cantidad).

conteo_categoria_cliente(ClienteID, Categoria, Cantidad) :-
    categorias_compradas_lista(ClienteID, ListaCategorias),
    contar_categoria(Categoria, ListaCategorias, Cantidad).

categoria_favorita(ClienteID, CategoriaFavorita) :-
    categorias_compradas_unicas(ClienteID, CategoriasUnicas),
    findall(
        Cantidad-Categoria,
        (
            member(Categoria, CategoriasUnicas),
            conteo_categoria_cliente(ClienteID, Categoria, Cantidad)
        ),
        ParesConteo
    ),
    sort(ParesConteo, Ordenados),
    reverse(Ordenados, [_Mayor-CategoriaFavorita | _]).

categoria_favorita_texto(ClienteID, CategoriaFavorita) :-
    categoria_favorita(ClienteID, CategoriaFavorita),
    !.

categoria_favorita_texto(_, sin_categoria).

% =====================================================================
% COMPRAS, CLIENTE FRECUENTE Y BENEFICIOS
% =====================================================================

cantidad_compras(ClienteID, Cantidad) :-
    findall(ProductoID, compra(ClienteID, ProductoID), Compras),
    length(Compras, Cantidad).

cliente_nuevo(ClienteID) :-
    cantidad_compras(ClienteID, Cantidad),
    Cantidad =:= 0.

cliente_frecuente(ClienteID) :-
    cantidad_compras(ClienteID, Cantidad),
    Cantidad >= 3.

tipo_cliente(ClienteID, nuevo) :-
    cliente_nuevo(ClienteID),
    !.

tipo_cliente(ClienteID, frecuente) :-
    cliente_frecuente(ClienteID),
    !.

tipo_cliente(_, regular).

beneficio_cliente(ClienteID, 'Descuento Linaje Club 10%') :-
    cliente_frecuente(ClienteID),
    !.

beneficio_cliente(_, 'Sin beneficio activo').

total_gastado(ClienteID, Total) :-
    findall(
        Precio,
        (
            compra(ClienteID, ProductoID),
            producto(ProductoID, _, _, Precio, _)
        ),
        Precios
    ),
    sumlist(Precios, Total).

% =====================================================================
% REGLAS DE RECOMENDACION
% =====================================================================

% Nivel 1:
% Cliente con compras: recomendar según su categoría favorita.
recomendar_producto_prioritario(ClienteID, ProductoID, Nombre, Categoria, Precio, Imagen) :-
    categoria_favorita(ClienteID, CategoriaFavorita),
    recomienda_por_categoria(CategoriaFavorita, Categoria),
    producto(ProductoID, Nombre, Categoria, Precio, Imagen),
    \+ compra(ClienteID, ProductoID).

% Nivel 2:
% Cliente con compras: recomendar según cualquier categoría que haya comprado.
recomendar_producto_relacionado(ClienteID, ProductoID, Nombre, Categoria, Precio, Imagen) :-
    categoria_comprada(ClienteID, CategoriaComprada),
    recomienda_por_categoria(CategoriaComprada, Categoria),
    producto(ProductoID, Nombre, Categoria, Precio, Imagen),
    \+ compra(ClienteID, ProductoID).

% Nivel 3:
% Cliente nuevo o sin coincidencias: recomendar productos destacados.
producto_destacado(ProductoID, Nombre, Categoria, Precio, Imagen) :-
    producto(ProductoID, Nombre, Categoria, Precio, Imagen),
    member(Categoria, [
        combo,
        hamburguesa,
        alitas,
        makis,
        bebida,
        salchipapa,
        postre
    ]).

recomendar_producto_respaldo(ClienteID, ProductoID, Nombre, Categoria, Precio, Imagen) :-
    producto_destacado(ProductoID, Nombre, Categoria, Precio, Imagen),
    \+ compra(ClienteID, ProductoID).

% =====================================================================
% CONVERTIR RECOMENDACION A JSON
% =====================================================================

producto_json(ProductoID, Nombre, Categoria, Precio, Imagen, Dict) :-
    Dict = _{
        id: ProductoID,
        nombre: Nombre,
        categoria: Categoria,
        precio: Precio,
        imagen: Imagen
    }.

% =====================================================================
% OBTENER LISTAS DE RECOMENDACIONES
% =====================================================================

recomendaciones_prioritarias(ClienteID, Recomendaciones) :-
    setof(
        Dict,
        ProductoID^Nombre^Categoria^Precio^Imagen^(
            recomendar_producto_prioritario(
                ClienteID,
                ProductoID,
                Nombre,
                Categoria,
                Precio,
                Imagen
            ),
            producto_json(
                ProductoID,
                Nombre,
                Categoria,
                Precio,
                Imagen,
                Dict
            )
        ),
        Recomendaciones
    ),
    !.

recomendaciones_prioritarias(_, []).

recomendaciones_relacionadas(ClienteID, Recomendaciones) :-
    setof(
        Dict,
        ProductoID^Nombre^Categoria^Precio^Imagen^(
            recomendar_producto_relacionado(
                ClienteID,
                ProductoID,
                Nombre,
                Categoria,
                Precio,
                Imagen
            ),
            producto_json(
                ProductoID,
                Nombre,
                Categoria,
                Precio,
                Imagen,
                Dict
            )
        ),
        Recomendaciones
    ),
    !.

recomendaciones_relacionadas(_, []).

recomendaciones_respaldo(ClienteID, Recomendaciones) :-
    setof(
        Dict,
        ProductoID^Nombre^Categoria^Precio^Imagen^(
            recomendar_producto_respaldo(
                ClienteID,
                ProductoID,
                Nombre,
                Categoria,
                Precio,
                Imagen
            ),
            producto_json(
                ProductoID,
                Nombre,
                Categoria,
                Precio,
                Imagen,
                Dict
            )
        ),
        Recomendaciones
    ),
    !.

recomendaciones_respaldo(_, []).

% =====================================================================
% SELECCION INTELIGENTE DE RECOMENDACIONES
% =====================================================================

seleccionar_recomendaciones(ClienteID, Recomendaciones, criterio_categoria_favorita) :-
    recomendaciones_prioritarias(ClienteID, Recomendaciones),
    Recomendaciones \= [],
    !.

seleccionar_recomendaciones(ClienteID, Recomendaciones, criterio_categorias_compradas) :-
    recomendaciones_relacionadas(ClienteID, Recomendaciones),
    Recomendaciones \= [],
    !.

seleccionar_recomendaciones(ClienteID, Recomendaciones, criterio_productos_destacados) :-
    recomendaciones_respaldo(ClienteID, Recomendaciones),
    Recomendaciones \= [],
    !.

seleccionar_recomendaciones(_, [], sin_recomendaciones).

% =====================================================================
% RESPUESTA JSON PARA NODE.JS
% =====================================================================

responder_recomendaciones(ClienteID) :-
    tipo_cliente(ClienteID, TipoCliente),
    beneficio_cliente(ClienteID, Beneficio),
    cantidad_compras(ClienteID, CantidadCompras),
    total_gastado(ClienteID, TotalGastadoSinRedondear),
    TotalGastado is round(TotalGastadoSinRedondear * 100) / 100,
    categoria_favorita_texto(ClienteID, CategoriaFavorita),

    seleccionar_recomendaciones(
        ClienteID,
        Recomendaciones,
        CriterioRecomendacion
    ),

    json_write_dict(
        current_output,
        _{
            success: true,
            cliente_id: ClienteID,
            tipo_cliente: TipoCliente,
            beneficio: Beneficio,
            cantidad_compras: CantidadCompras,
            total_gastado: TotalGastado,
            categoria_favorita: CategoriaFavorita,
            criterio_recomendacion: CriterioRecomendacion,
            recomendaciones: Recomendaciones
        }
    ).