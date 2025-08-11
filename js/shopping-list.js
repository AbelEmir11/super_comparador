/**
 * Módulo para gestión de lista de compras
 * Maneja la adición, edición y validación de productos
 */

class ShoppingListManager {
    constructor() {
        this.items = [];
        this.suggestions = [];
        this.isLoading = false;
        this.storageKey = 'supermarket_shopping_list';
        
        // Cargar lista guardada
        this.loadFromStorage();
        
        // Configurar elementos del DOM
        this.setupElements();
        this.setupEventListeners();
    }

    /**
     * Configura las referencias a elementos del DOM
     */
    setupElements() {
        this.elements = {
            input: document.getElementById('productInput'),
            addButton: document.getElementById('addProductBtn'),
            listContainer: document.getElementById('shoppingList'),
            compareButton: document.getElementById('compareBtn'),
            suggestionsContainer: null // Se creará dinámicamente
        };

        // Crear contenedor de sugerencias
        this.createSuggestionsContainer();
    }

    /**
     * Crea el contenedor de sugerencias de productos
     */
    createSuggestionsContainer() {
        const container = document.createElement('div');
        container.id = 'productSuggestions';
        container.className = 'suggestions-container';
        container.style.display = 'none';
        
        // Insertar después del input
        this.elements.input.parentNode.insertBefore(container, this.elements.input.nextSibling);
        this.elements.suggestionsContainer = container;
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Agregar productos al hacer click o Enter
        this.elements.addButton.addEventListener('click', () => this.addProducts());
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addProducts();
            }
        });

        // Sugerencias en tiempo real
        this.elements.input.addEventListener('input', Utils.debounce((e) => {
            this.showSuggestions(e.target.value);
        }, 300));

        // Ocultar sugerencias cuando se pierde el foco
        this.elements.input.addEventListener('blur', () => {
            setTimeout(() => this.hideSuggestions(), 150);
        });

        // Mostrar sugerencias cuando se enfoca
        this.elements.input.addEventListener('focus', (e) => {
            if (e.target.value.length > 1) {
                this.showSuggestions(e.target.value);
            }
        });

        // Event listeners para eventos de la aplicación
        AppEvents.on('shopping-list-updated', () => this.saveToStorage());
        AppEvents.on('clear-shopping-list', () => this.clearList());
    }

    /**
     * Agrega productos a la lista desde el input
     */
    addProducts() {
        const input = this.elements.input.value.trim();
        if (!input) return;

        const items = input.split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);

        let addedCount = 0;
        let notFoundItems = [];

        items.forEach(item => {
            const result = this.addSingleProduct(item);
            if (result.success) {
                addedCount++;
            } else {
                notFoundItems.push(item);
            }
        });

        // Mostrar resultados
        if (addedCount > 0) {
            Utils.showNotification(
                `${addedCount} producto${addedCount > 1 ? 's' : ''} agregado${addedCount > 1 ? 's' : ''}`, 
                'success'
            );
        }

        if (notFoundItems.length > 0) {
            Utils.showNotification(
                `No encontrado: ${notFoundItems.join(', ')}`, 
                'warning', 
                4000
            );
        }

        // Limpiar input y actualizar vista
        this.elements.input.value = '';
        this.hideSuggestions();
        this.updateDisplay();
    }

    /**
     * Agrega un solo producto a la lista
     * @param {string} productName - Nombre del producto
     * @returns {Object} Resultado de la operación
     */
    addSingleProduct(productName) {
        const sanitized = Utils.sanitizeInput(productName);
        if (!sanitized) {
            return { success: false, error: 'Nombre de producto inválido' };
        }

        // Buscar el producto en todos los supermercados
        let foundProduct = null;
        for (const supermarket of Object.values(SUPERMARKETS_DATA)) {
            foundProduct = supermarket.products.find(product => 
                product.name.toLowerCase().includes(sanitized) ||
                sanitized.includes(product.name.toLowerCase().split(' ')[0])
            );
            if (foundProduct) break;
        }

        if (!foundProduct) {
            return { success: false, error: 'Producto no encontrado' };
        }

        // Verificar si ya existe en la lista
        const existingItem = this.items.find(item => 
            item.name.toLowerCase() === foundProduct.name.toLowerCase()
        );

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: Utils.generateId(),
                name: foundProduct.name,
                category: foundProduct.category,
                quantity: 1,
                searchTerm: productName
            });
        }

        AppEvents.emit('shopping-list-updated', this.items);
        return { success: true, product: foundProduct };
    }

    /**
     * Modifica la cantidad de un producto
     * @param {number} index - Índice del producto
     * @param {number} change - Cambio en la cantidad (+1, -1, etc.)
     */
    changeQuantity(index, change) {
        if (index < 0 || index >= this.items.length) return;

        this.items[index].quantity += change;

        if (this.items[index].quantity <= 0) {
            this.removeItem(index);
        } else {
            this.updateDisplay();
            AppEvents.emit('shopping-list-updated', this.items);
        }
    }

    /**
     * Establece la cantidad exacta de un producto
     * @param {number} index - Índice del producto
     * @param {number} quantity - Nueva cantidad
     */
    setQuantity(index, quantity) {
        if (index < 0 || index >= this.items.length) return;
        
        const newQuantity = Math.max(0, parseInt(quantity) || 0);
        
        if (newQuantity === 0) {
            this.removeItem(index);
        } else {
            this.items[index].quantity = newQuantity;
            this.updateDisplay();
            AppEvents.emit('shopping-list-updated', this.items);
        }
    }

    /**
     * Remueve un producto de la lista
     * @param {number} index - Índice del producto a remover
     */
    removeItem(index) {
        if (index < 0 || index >= this.items.length) return;

        const removedItem = this.items.splice(index, 1)[0];
        this.updateDisplay();
        
        Utils.showNotification(`${removedItem.name} eliminado`, 'info', 2000);
        AppEvents.emit('shopping-list-updated', this.items);
    }

    /**
     * Limpia toda la lista de compras
     */
    clearList() {
        this.items = [];
        this.updateDisplay();
        this.removeFromStorage();
        Utils.showNotification('Lista de compras vaciada', 'info');
        AppEvents.emit('shopping-list-updated', this.items);
    }

    /**
     * Actualiza la visualización de la lista
     */
    updateDisplay() {
        const container = this.elements.listContainer;
        
        if (this.items.length === 0) {
            container.innerHTML = `
                <div class="shopping-list-empty">
                    <i class="fas fa-shopping-basket"></i>
                    <p>Tu lista está vacía</p>
                    <small>Agrega algunos productos para comenzar</small>
                </div>
            `;
            this.elements.compareButton.disabled = true;
            return;
        }

        // Habilitar botón de comparación
        this.elements.compareButton.disabled = false;

        // Generar HTML para cada producto
        container.innerHTML = this.items.map((item, index) => `
            <div class="list-item" data-category="${item.category}">
                <div class="item-info">
                    <div class="item-name">
                        ${PRODUCT_CATEGORIES[item.category]?.icon || '📦'} 
                        ${Utils.capitalizeWords(item.name)}
                    </div>
                    <div class="item-quantity">
                        Cantidad: ${item.quantity}
                        <span class="item-category">${PRODUCT_CATEGORIES[item.category]?.name || item.category}</span>
                    </div>
                </div>
                <div class="item-controls">
                    <button class="quantity-control" onclick="ShoppingList.changeQuantity(${index}, -1)" title="Reducir cantidad">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" class="quantity-input" value="${item.quantity}" 
                           onchange="ShoppingList.setQuantity(${index}, this.value)"
                           min="1" max="99">
                    <button class="quantity-control" onclick="ShoppingList.changeQuantity(${index}, 1)" title="Aumentar cantidad">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="ShoppingList.removeItem(${index})" title="Eliminar producto">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Agregar botón para limpiar lista
        if (this.items.length > 2) {
            const clearButton = document.createElement('button');
            clearButton.className = 'btn btn-warning btn-small';
            clearButton.style.marginTop = '15px';
            clearButton.innerHTML = '<i class="fas fa-broom"></i> Limpiar Lista';
            clearButton.onclick = () => this.confirmClearList();
            container.appendChild(clearButton);
        }

        // Mostrar estadísticas de la lista
        this.showListStats();
    }

    /**
     * Muestra estadísticas de la lista actual
     */
    showListStats() {
        const analysis = Utils.analyzeShoppingPatterns(this.items);
        const statsContainer = document.getElementById('listStats') || this.createStatsContainer();
        
        if (analysis.totalItems > 0) {
            statsContainer.innerHTML = `
                <div class="list-stats">
                    <h4><i class="fas fa-chart-pie"></i> Resumen de tu lista</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-value">${analysis.totalItems}</span>
                            <span class="stat-label">Productos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${analysis.categoriesCount}</span>
                            <span class="stat-label">Categorías</span>
                        </div>
                        ${analysis.mostCommonCategory ? `
                        <div class="stat-item">
                            <span class="stat-value">${analysis.mostCommonCategory.percentage}%</span>
                            <span class="stat-label">${PRODUCT_CATEGORIES[analysis.mostCommonCategory.name]?.name || analysis.mostCommonCategory.name}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            statsContainer.style.display = 'block';
        } else {
            statsContainer.style.display = 'none';
        }
    }

    /**
     * Crea el contenedor de estadísticas
     */
    createStatsContainer() {
        const container = document.createElement('div');
        container.id = 'listStats';
        container.style.display = 'none';
        this.elements.listContainer.parentNode.appendChild(container);
        return container;
    }

    /**
     * Muestra sugerencias de productos
     * @param {string} query - Término de búsqueda
     */
    showSuggestions(query) {
        if (!query || query.length < 2) {
            this.hideSuggestions();
            return;
        }

        this.suggestions = Utils.generateProductSuggestions(query, 8);
        
        if (this.suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        const suggestionsHTML = this.suggestions.map((suggestion, index) => `
            <div class="suggestion-item" onclick="ShoppingList.selectSuggestion('${suggestion.text.replace(/'/g, "\\'")}')" data-index="${index}">
                <span class="suggestion-icon">${suggestion.icon}</span>
                <span class="suggestion-text">${Utils.capitalizeWords(suggestion.text)}</span>
                <span class="suggestion-category">${PRODUCT_CATEGORIES[suggestion.category]?.name || suggestion.category}</span>
            </div>
        `).join('');

        this.elements.suggestionsContainer.innerHTML = suggestionsHTML;
        this.elements.suggestionsContainer.style.display = 'block';
    }

    /**
     * Oculta las sugerencias
     */
    hideSuggestions() {
        if (this.elements.suggestionsContainer) {
            this.elements.suggestionsContainer.style.display = 'none';
        }
    }

    /**
     * Selecciona una sugerencia y la agrega a la lista
     * @param {string} productName - Nombre del producto sugerido
     */
    selectSuggestion(productName) {
        this.elements.input.value = productName;
        this.hideSuggestions();
        this.addProducts();
    }

    /**
     * Confirma antes de limpiar la lista
     */
    confirmClearList() {
        Swal.fire({
            title: '¿Limpiar lista completa?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e53e3e',
            cancelButtonColor: '#718096',
            confirmButtonText: 'Sí, limpiar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.clearList();
            }
        });
    }

    /**
     * Obtiene la lista actual de compras
     * @returns {Array} Lista de productos
     */
    getItems() {
        return [...this.items];
    }

    /**
     * Verifica si la lista está vacía
     * @returns {boolean} True si está vacía
     */
    isEmpty() {
        return this.items.length === 0;
    }

    /**
     * Obtiene el total de productos (considerando cantidades)
     * @returns {number} Total de productos
     */
    getTotalItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    /**
     * Guarda la lista en localStorage
     */
    saveToStorage() {
        Utils.saveToStorage(this.storageKey, {
            items: this.items,
            timestamp: Date.now()
        });
    }

    /**
     * Carga la lista desde localStorage
     */
    loadFromStorage() {
        const stored = Utils.getFromStorage(this.storageKey);
        if (stored && stored.items && Array.isArray(stored.items)) {
            // Verificar que los datos no sean muy antiguos (más de 1 día)
            const dayInMs = 24 * 60 * 60 * 1000;
            if (Date.now() - stored.timestamp < dayInMs) {
                this.items = stored.items;
                console.log('Lista de compras cargada desde localStorage');
            }
        }
    }

    /**
     * Elimina la lista guardada
     */
    removeFromStorage() {
        Utils.removeFromStorage(this.storageKey);
    }

    /**
     * Importa una lista de compras desde texto
     * @param {string} text - Texto con productos separados por líneas o comas
     */
    importFromText(text) {
        if (!text || typeof text !== 'string') return;

        const items = text.split(/[,\n]/)
            .map(item => item.trim())
            .filter(item => item.length > 0);

        let importedCount = 0;
        items.forEach(item => {
            const result = this.addSingleProduct(item);
            if (result.success) importedCount++;
        });

        Utils.showNotification(`${importedCount} productos importados`, 'success');
        this.updateDisplay();
    }

    /**
     * Exporta la lista actual como texto
     * @returns {string} Lista formateada como texto
     */
    exportAsText() {
        if (this.items.length === 0) return '';

        let text = 'MI LISTA DE COMPRAS\n';
        text += '='.repeat(20) + '\n\n';
        
        this.items.forEach((item, index) => {
            text += `${index + 1}. ${Utils.capitalizeWords(item.name)} x${item.quantity}\n`;
        });
        
        text += `\nTotal: ${this.getTotalItemCount()} productos\n`;
        text += `Generado: ${new Date().toLocaleString('es-AR')}\n`;
        
        return text;
    }

    /**
     * Valida la lista actual
     * @returns {Object} Resultado de la validación
     */
    validate() {
        return Utils.validateShoppingList(this.items);
    }

    /**
     * Obtiene productos por categoría
     * @returns {Object} Productos agrupados por categoría
     */
    getItemsByCategory() {
        const grouped = {};
        
        this.items.forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = [];
            }
            grouped[item.category].push(item);
        });
        
        return grouped;
    }

    /**
     * Busca productos en la lista actual
     * @param {string} query - Término de búsqueda
     * @returns {Array} Productos que coinciden
     */
    searchInList(query) {
        if (!query) return this.items;
        
        const searchTerm = query.toLowerCase();
        return this.items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Reordena la lista por diferentes criterios
     * @param {string} criteria - Criterio de orden ('name', 'category', 'quantity')
     * @param {string} direction - Dirección ('asc', 'desc')
     */
    sortList(criteria = 'name', direction = 'asc') {
        this.items.sort((a, b) => {
            let comparison = 0;
            
            switch (criteria) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'category':
                    comparison = a.category.localeCompare(b.category);
                    break;
                case 'quantity':
                    comparison = a.quantity - b.quantity;
                    break;
                default:
                    comparison = a.name.localeCompare(b.name);
            }
            
            return direction === 'desc' ? -comparison : comparison;
        });
        
        this.updateDisplay();
        AppEvents.emit('shopping-list-updated', this.items);
    }
}

// Instancia global de ShoppingListManager
let ShoppingList = null;

/**
 * Inicializa el gestor de lista de compras
 * @returns {ShoppingListManager} Instancia del gestor
 */
function initializeShoppingList() {
    if (!ShoppingList) {
        ShoppingList = new ShoppingListManager();
        console.log('ShoppingListManager inicializado');
    }
    return ShoppingList;
}

/**
 * Obtiene la instancia actual del gestor
 * @returns {ShoppingListManager|null} Instancia actual
 */
function getShoppingListInstance() {
    return ShoppingList;
}

// Funciones globales para los event handlers en el HTML
window.ShoppingList = {
    changeQuantity: (index, change) => ShoppingList?.changeQuantity(index, change),
    setQuantity: (index, quantity) => ShoppingList?.setQuantity(index, quantity),
    removeItem: (index) => ShoppingList?.removeItem(index),
    selectSuggestion: (productName) => ShoppingList?.selectSuggestion(productName),
    clearList: () => ShoppingList?.confirmClearList()
};

// Exportar para uso en otros módulos
if (typeof window !== 'undefined') {
    window.initializeShoppingList = initializeShoppingList;
    window.getShoppingListInstance = getShoppingListInstance;
}