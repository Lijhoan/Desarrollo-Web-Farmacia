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
    
    // Asignamos categorías a los productos existentes (ya que no tienen atributos de categoría)
    const asignarCategorias = () => {
        const productos = document.querySelectorAll('.col-md-6.col-lg-4.mb-4');
        
        // Asignamos categorías según el título del producto
        productos.forEach(producto => {
            const titulo = producto.querySelector('.card-title').textContent.toLowerCase();
            let categoria = '';
            
            // Determinamos la categoría según el nombre del producto
            if (titulo.includes('paracetamol') || titulo.includes('ibuprofeno') || titulo.includes('aspirina')) {
                categoria = 'analgesicos';
                producto.setAttribute('data-categoria', 'analgesicos');
                producto.setAttribute('data-original', ''); // Para restaurar visibilidad
            } else if (titulo.includes('amoxicilina')) {
                categoria = 'antibioticos';
                producto.setAttribute('data-categoria', 'antibioticos');
                producto.setAttribute('data-original', ''); // Para restaurar visibilidad
            } else if (titulo.includes('loratadina')) {
                categoria = 'antigripales';
                producto.setAttribute('data-categoria', 'antigripales');
                producto.setAttribute('data-original', ''); // Para restaurar visibilidad
            } else {
                categoria = 'otros';
                producto.setAttribute('data-categoria', 'otros');
                producto.setAttribute('data-original', ''); // Para restaurar visibilidad
            }
            
            // Extraemos y asignamos el precio como atributo data-precio
            const precioTexto = producto.querySelector('.fw-bold.text-primary').textContent;
            const precio = parseFloat(precioTexto.replace('$', ''));
            producto.setAttribute('data-precio', precio);
        });
    };
    
    // Configurar slider de precio
    const configurarSliderPrecio = () => {
        // Encontramos el precio mínimo y máximo de los productos
        const productos = document.querySelectorAll('[data-precio]');
        let minPrecio = Infinity;
        let maxPrecio = 0;
        
        productos.forEach(producto => {
            const precio = parseFloat(producto.getAttribute('data-precio'));
            minPrecio = Math.min(minPrecio, precio);
            maxPrecio = Math.max(maxPrecio, precio);
        });
        
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
                const categoria = checkbox.id.replace('categoria', '');
                switch(categoria) {
                    case '1': categoriasSeleccionadas.push('analgesicos'); break;
                    case '2': categoriasSeleccionadas.push('antibioticos'); break;
                    case '3': categoriasSeleccionadas.push('antigripales'); break;
                }
            }
        });
        
        // Obtenemos valor máximo de precio
        const precioMaximo = parseInt(filtroPrecio.value);
        
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
        
        // Restaurar slider a valor máximo
        filtroPrecio.value = filtroPrecio.max;
        document.getElementById('precioValor').textContent = `Hasta $${filtroPrecio.max}`;
        
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
        btnAplicarFiltros.addEventListener('click', aplicarFiltros);
        
        // Añadir botón para restaurar filtros
        const btnRestaurar = document.createElement('button');
        btnRestaurar.className = 'btn btn-outline-secondary btn-sm w-100 mt-2';
        btnRestaurar.textContent = 'Restaurar Filtros';
        btnRestaurar.addEventListener('click', restaurarFiltros);
        btnAplicarFiltros.insertAdjacentElement('afterend', btnRestaurar);
    };
    
    // Iniciar la aplicación
    inicializar();
});