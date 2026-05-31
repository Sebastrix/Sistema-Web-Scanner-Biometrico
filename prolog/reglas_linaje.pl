:- use_module(library(http/json)).

:- dynamic producto/5.
:- dynamic compra/2.

% =====================================================================
% RELACIONES DE RECOMENDACION
% recomienda_por_categoria(CategoriaComprada, CategoriaRecomendada).
% =====================================================================

recomienda_por_categoria(hamburguesa, bebida).
recomienda_por_categoria(hamburguesa, salchipapa).
recomienda_por_categoria(hamburguesa, postre).

recomienda_por_categoria(salchipapa, bebida).
recomienda_por_categoria(salchipapa, hamburguesa).

recomienda_por_categoria(combo, bebida).
recomienda_por_categoria(combo, postre).
recomienda_por_categoria(combo, hamburguesa).

recomienda_por_categoria(bebida, hamburguesa).
recomienda_por_categoria(bebida, salchipapa).
recomienda_por_categoria(bebida, postre).

recomienda_por_categoria(postre, bebida).
recomienda_por_categoria(postre, combo).

% =====================================================================
% REGLAS INTELIGENTES
% =====================================================================

categoria_comprada(ClienteID, Categoria) :-
    compra(ClienteID, ProductoID),
    producto(ProductoID, _, Categoria, _, _).

recomendar_producto(ClienteID, ProductoID, Nombre, Categoria, Precio, Imagen) :-
    producto(ProductoID, Nombre, Categoria, Precio, Imagen),
    \+ compra(ClienteID, ProductoID),
    once((
        categoria_comprada(ClienteID, CategoriaComprada),
        recomienda_por_categoria(CategoriaComprada, Categoria)
    )).

cantidad_compras(ClienteID, Cantidad) :-
    findall(ProductoID, compra(ClienteID, ProductoID), Compras),
    length(Compras, Cantidad).

cliente_frecuente(ClienteID) :-
    cantidad_compras(ClienteID, Cantidad),
    Cantidad >= 3.

tipo_cliente(ClienteID, frecuente) :-
    cliente_frecuente(ClienteID).

tipo_cliente(ClienteID, regular) :-
    \+ cliente_frecuente(ClienteID).

beneficio_cliente(ClienteID, 'Descuento Linaje Club 10%') :-
    cliente_frecuente(ClienteID).

beneficio_cliente(ClienteID, 'Sin beneficio activo') :-
    \+ cliente_frecuente(ClienteID).

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
% RESPUESTA JSON PARA NODE.JS
% =====================================================================

responder_recomendaciones(ClienteID) :-
    setof(
        _{
            id: ProductoID,
            nombre: Nombre,
            categoria: Categoria,
            precio: Precio,
            imagen: Imagen
        },
        recomendar_producto(ClienteID, ProductoID, Nombre, Categoria, Precio, Imagen),
        RecomendacionesOrdenadas
    ),
    !,

    tipo_cliente(ClienteID, TipoCliente),
    beneficio_cliente(ClienteID, Beneficio),
    cantidad_compras(ClienteID, CantidadCompras),
    total_gastado(ClienteID, TotalGastadoSinRedondear),
    TotalGastado is round(TotalGastadoSinRedondear * 100) / 100,

    json_write_dict(
        current_output,
        _{
            success: true,
            cliente_id: ClienteID,
            tipo_cliente: TipoCliente,
            beneficio: Beneficio,
            cantidad_compras: CantidadCompras,
            total_gastado: TotalGastado,
            recomendaciones: RecomendacionesOrdenadas
        }
    ).

responder_recomendaciones(ClienteID) :-
    tipo_cliente(ClienteID, TipoCliente),
    beneficio_cliente(ClienteID, Beneficio),
    cantidad_compras(ClienteID, CantidadCompras),
    total_gastado(ClienteID, TotalGastadoSinRedondear),
    TotalGastado is round(TotalGastadoSinRedondear * 100) / 100,

    json_write_dict(
        current_output,
        _{
            success: true,
            cliente_id: ClienteID,
            tipo_cliente: TipoCliente,
            beneficio: Beneficio,
            cantidad_compras: CantidadCompras,
            total_gastado: TotalGastado,
            recomendaciones: []
        }
    ).