/**
 * filtros.js - Gestión de filtros para catálogo de productos
 * FarmaJoven - Sistema de farmacia online
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const productosContainer = document.querySelector('.row'); // Contenedor de productos
    const filtrosCategorias = document.querySelectorAll('.form-check-input'); // Checkboxes de categorías
    const filtroPrecio = document.getElementById('customRange1'); // Slider de precio
    const btnAplicarFiltros = document.querySelector('.card-body .btn-farmacia'); // Botón para aplicar filtros
    const mostrandoTexto = document.querySelector('.d-flex p.mb-0'); // Texto "Mostrando X de Y productos"
    
    // Detectar la página actual para aplicar filtros específicos
    const paginaActual = window.location.pathname.split('/').pop().replace('.html', '');
    
    // Mapeo de IDs de checkbox a categorías según la página
    const mapeoCategoria = {
        'medicamentos': {
            'categoria1': 'analgesicos',
            'categoria2': 'antibioticos', 
            'categoria3': 'antigripales',
            'categoria4': 'otros'
        },
        'cuidado-personal': {
            'categoria1': 'higiene-bucal',
            'categoria2': 'cuidado-capilar',
            'categoria3': 'higiene-corporal',
            'categoria4': 'desodorantes'
        },
        'vitaminas': {
            'tipo1': 'multivitaminicos',
            'tipo2': 'vitamina-c',
            'tipo3': 'vitamina-d',
            'tipo4': 'omega-3',
            'tipo5': 'otros'
        },
        'cuidado-piel': {
            'categoria1': 'cremas',
            'categoria2': 'protector-solar',
            'categoria3': 'limpiadores',
            'categoria4': 'mascarillas',
            'categoria5': 'sueros'
        }
    };
    
    // Asignamos categorías a los productos existentes según la página
    const asignarCategorias = () => {
        const productos = document.querySelectorAll('.col-md-6.col-lg-4.mb-4');
        
        productos.forEach(producto => {
            const titulo = producto.querySelector('.card-title').textContent.toLowerCase();
            let categoria = 'otros';
            
            // Asignar categorías según la página y el título del producto
            switch(paginaActual) {
                case 'medicamentos':
                    if (titulo.includes('paracetamol') || titulo.includes('ibuprofeno') || titulo.includes('aspirina')) {
                        categoria = 'analgesicos';
                    } else if (titulo.includes('amoxicilina')) {
                        categoria = 'antibioticos';
                    } else if (titulo.includes('loratadina')) {
                        categoria = 'antigripales';
                    }
                    break;
                    
                case 'cuidado-personal':
                    if (titulo.includes('dental') || titulo.includes('cepillo') || titulo.includes('pasta') || titulo.includes('enjuague')) {
                        categoria = 'higiene-bucal';
                    } else if (titulo.includes('shampoo') || titulo.includes('acondicionador') || titulo.includes('cabello')) {
                        categoria = 'cuidado-capilar';
                    } else if (titulo.includes('jabón') || titulo.includes('gel') || titulo.includes('ducha')) {
                        categoria = 'higiene-corporal';
                    } else if (titulo.includes('desodorante') || titulo.includes('antitranspirante')) {
                        categoria = 'desodorantes';
                    }
                    break;
                    
                case 'vitaminas':
                    if (titulo.includes('multivitamínico') || titulo.includes('complejo')) {
                        categoria = 'multivitaminicos';
                    } else if (titulo.includes('vitamina c')) {
                        categoria = 'vitamina-c';
                    } else if (titulo.includes('vitamina d')) {
                        categoria = 'vitamina-d';
                    } else if (titulo.includes('omega') || titulo.includes('ácidos grasos')) {
                        categoria = 'omega-3';
                    }
                    break;
                    
                case 'cuidado-piel':
                    if (titulo.includes('crema') || titulo.includes('hidratante') || titulo.includes('loción')) {
                        categoria = 'cremas';
                    } else if (titulo.includes('protector') || titulo.includes('solar') || titulo.includes('fps')) {
                        categoria = 'protector-solar';
                    } else if (titulo.includes('limpiador') || titulo.includes('limpieza')) {
                        categoria = 'limpiadores';
                    } else if (titulo.includes('mascarilla') || titulo.includes('máscara')) {
                        categoria = 'mascarillas';
                    } else if (titulo.includes('suero') || titulo.includes('sérum')) {
                        categoria = 'sueros';
                    }
                    break;
            }
            
            // Asignar la categoría como atributo al producto
            producto.setAttribute('data-categoria', categoria);
            producto.setAttribute('data-original', ''); // Para restaurar visibilidad
            
            // Extraemos y asignamos el precio como atributo data-precio
            const precioTexto = producto.querySelector('.fw-bold.text-primary, .price, .text-price').textContent;
            const precio = parseFloat(precioTexto.replace('$', ''));
            producto.setAttribute('data-precio', precio);
        });
    };
    
    // Configurar slider de precio
    const configurarSliderPrecio = () => {
        if (!filtroPrecio) return; // Si no existe el slider de precio, salir
        
        // Encontramos el precio mínimo y máximo de los productos
        const productos = document.querySelectorAll('[data-precio]');
        let minPrecio = Infinity;
        let maxPrecio = 0;
        
        productos.forEach(producto => {
            const precio = parseFloat(producto.getAttribute('data-precio'));
            if (!isNaN(precio)) {
                minPrecio = Math.min(minPrecio, precio);
                maxPrecio = Math.max(maxPrecio, precio);
            }
        });
        
        // Si no hay productos con precios válidos, salir
        if (minPrecio === Infinity || maxPrecio === 0) return;
        
        // Configuramos el slider
        filtroPrecio.min = Math.floor(minPrecio);
        filtroPrecio.max = Math.ceil(maxPrecio);
        filtroPrecio.value = Math.ceil(maxPrecio);
        
        // Creamos un elemento para mostrar el valor seleccionado
        const precioValorDiv = document.createElement('div');
        precioValorDiv.id = 'precioValor';
        precioValorDiv.className = 'text-center mt-2';
        precioValorDiv.textContent = `Hasta $${Math.ceil(maxPrecio)}`;
        filtroPrecio.insertAdjacentElement('afterend', precioValorDiv);
        
        // Actualizamos el texto cuando el slider cambia
        filtroPrecio.addEventListener('input', function() {
            precioValorDiv.textContent = `Hasta $${this.value}`;
        });
    };
    
    // Aplicar filtros
    const aplicarFiltros = () => {
        const productos = document.querySelectorAll('.col-md-6.col-lg-4.mb-4');
        
        // Obtenemos categorías seleccionadas
        const categoriasSeleccionadas = [];
        filtrosCategorias.forEach(checkbox => {
            if (checkbox.checked) {
                const checkboxId = checkbox.id;
                // Usamos el mapeo específico de la página actual
                const mappings = mapeoCategoria[paginaActual];
                if (mappings && mappings[checkboxId]) {
                    categoriasSeleccionadas.push(mappings[checkboxId]);
                }
            }
        });
        
        // Obtenemos valor máximo de precio
        const precioMaximo = filtroPrecio ? parseInt(filtroPrecio.value) : Infinity;
        
        // Filtramos productos
        let contadorProductosMostrados = 0;
        productos.forEach(producto => {
            const categoriaProducto = producto.getAttribute('data-categoria');
            const precioProducto = parseFloat(producto.getAttribute('data-precio'));
            
            // Verificamos si cumple con los filtros de categoría y precio
            const cumpleCategorias = categoriasSeleccionadas.length === 0 || 
                                     categoriasSeleccionadas.includes(categoriaProducto);
            const cumplePrecio = precioProducto <= precioMaximo;
            
            // Mostramos u ocultamos el producto
            if (cumpleCategorias && cumplePrecio) {
                producto.style.display = '';
                contadorProductosMostrados++;
            } else {
                producto.style.display = 'none';
            }
        });
        
        // Actualizamos contador de productos mostrados
        if (mostrandoTexto) {
            const totalProductos = productos.length;
            mostrandoTexto.textContent = `Mostrando ${contadorProductosMostrados} de ${totalProductos} productos`;
        }
    };
    
    // Restaurar filtros
    const restaurarFiltros = () => {
        // Desmarcar todos los checkboxes
        filtrosCategorias.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Restaurar slider a valor máximo si existe
        if (filtroPrecio) {
            filtroPrecio.value = filtroPrecio.max;
            const precioValorDiv = document.getElementById('precioValor');
            if (precioValorDiv) {
                precioValorDiv.textContent = `Hasta $${filtroPrecio.max}`;
            }
        }
        
        // Mostrar todos los productos
        const productos = document.querySelectorAll('.col-md-6.col-lg-4.mb-4');
        productos.forEach(producto => {
            producto.style.display = '';
        });
        
        // Actualizar contador
        if (mostrandoTexto) {
            const totalProductos = productos.length;
            mostrandoTexto.textContent = `Mostrando ${totalProductos} de ${totalProductos} productos`;
        }
    };
    
    // Inicialización
    const inicializar = () => {
        // Asignar categorías a los productos
        asignarCategorias();
        
        // Configurar slider de precio
        configurarSliderPrecio();
        
        // Evento para botón de aplicar filtros
        if (btnAplicarFiltros) {
            btnAplicarFiltros.addEventListener('click', aplicarFiltros);
            
            // Añadir botón para restaurar filtros
            const btnRestaurar = document.createElement('button');
            btnRestaurar.className = 'btn btn-outline-secondary btn-sm w-100 mt-2';
            btnRestaurar.textContent = 'Restaurar Filtros';
            btnRestaurar.addEventListener('click', restaurarFiltros);
            btnAplicarFiltros.insertAdjacentElement('afterend', btnRestaurar);
        }
    };
    
    // Iniciar la aplicación
    inicializar();
});