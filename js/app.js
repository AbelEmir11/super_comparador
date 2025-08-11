/**
 * Controlador principal de la aplicación
 * Coordina todos los módulos y maneja el flujo principal
 */

class SupermarketComparatorApp {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
        this.state = {
            userLocation: null,
            shoppingList: [],
            lastComparison: null,
            preferences: this.loadUserPreferences()
        };
    }

    /**
     * Inicializa la aplicación completa
     */
    async initialize() {
        try {
            console.log('Inicializando Comparador de Supermercados...');

            // Mostrar loading
            this.showLoading('Cargando aplicación...');

            // Inicializar todos los módulos
            await this.initializeModules();

            // Configurar event listeners globales
            this.setupGlobalEventListeners();

            // Verificar datos y validar configuración
            this.validateConfiguration();

            // Cargar estado previo si existe
            this.loadPreviousState();

            this.isInitialized = true;
            this.hideLoading();

            console.log('✅ Aplicación inicializada correctamente');
            AppEvents.emit('app-initialized');

            // Mostrar mensaje de bienvenida
            this.showWelcomeMessage();

        } catch (error) {
            console.error('❌ Error inicializando aplicación:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Inicializa todos los módulos de la aplicación
     */
    async initializeModules() {
        try {
            // Inicializar gestor de lista de compras
            this.modules.shoppingList = initializeShoppingList();
            console.log('✓ ShoppingList inicializado');

            // Inicializar mapa
            this.modules.map = initializeMap('mapContainer');
            console.log('✓ Mapa inicializado');

            // Inicializar motor de comparación
            this.modules.comparison = initializeComparisonEngine();
            console.log('✓ Motor de comparación inicializado');

            // Inicializar renderizador de resultados
            this.modules.results = initializeResultsRenderer();
            console.log('✓ Renderizador de resultados inicializado');

            // Pequeña pausa para asegurar que todo esté listo
            await Utils.delay(500);

        } catch (error) {
            throw new Error(`Error inicializando módulos: ${error.message}`);
        }
    }

    /**
     * Configura event listeners globales de la aplicación
     */
    setupGlobalEventListeners() {
        // Event listeners de elementos del DOM
        const elements = {
            compareBtn: document.getElementById('compareBtn'),
            getCurrentLocation: document.getElementById('getCurrentLocation'),
            userAddress: document.getElementById('userAddress')
        };

        // Botón de comparar
        elements.compareBtn.addEventListener('click', () => this.handleCompareClick());

        // Botón de ubicación GPS
        elements.getCurrentLocation.addEventListener('click', () => this.handleLocationRequest());

        // Input de dirección
        elements.userAddress.addEventListener('blur', () => this.handleAddressInput());

        // Event listeners de eventos personalizados
        AppEvents.on('shopping-list-updated', (items) => this.handleShoppingListUpdate(items));
        AppEvents.on('user-location-set', (location) => this.handleLocationUpdate(location));
        AppEvents.on('distances-calculated', (distances) => this.handleDistancesUpdate(distances));
        AppEvents.on('comparison-completed', (data) => this.handleComparisonComplete(data));
        AppEvents.on('comparison-error', (error) => this.handleComparisonError(error));

        // Eventos de conectividad
        AppEvents.on('connectivity-change', (status) => this.handleConnectivityChange(status));

        // Eventos de errores globales
        AppEvents.on('global-error', (error) => this.handleGlobalError(error));

        // Guardar estado periódicamente
        setInterval(() => this.saveCurrentState(), 30000); // Cada 30 segundos

        // Guardar estado antes de cerrar la página
        window.addEventListener('beforeunload', () => this.saveCurrentState());
    }

    /**
     * Maneja el click del botón comparar
     */
    async handleCompareClick() {
        try {
            if (!this.modules.shoppingList || this.modules.shoppingList.isEmpty()) {
                Utils.showNotification('Agrega productos a tu lista primero', 'warning');
                return;
            }

            this.showLoading('Comparando precios...');

            const shoppingList = this.modules.shoppingList.getItems();
            const userLocation = this.modules.map?.getUserLocation();

            // Ejecutar comparación
            const comparisonData = await this.modules.comparison.compare(shoppingList, userLocation);

            // Renderizar resultados
            this.modules.results.render(comparisonData);

            // Guardar última comparación
            this.state.lastComparison = {
                timestamp: Date.now(),
                shoppingList: [...shoppingList],
                results: comparisonData
            };

            this.hideLoading();

        } catch (error) {
            this.hideLoading();
            console.error('Error en comparación:', error);
            Utils.showNotification('Error al comparar precios', 'error');
        }
    }

    /**
     * Maneja la solicitud de ubicación GPS
     */
    async handleLocationRequest() {
        try {
            if (!this.modules.map) {
                Utils.showNotification('Mapa no disponible', 'error');
                return;
            }

            const locationBtn = document.getElementById('getCurrentLocation');
            const originalHTML = locationBtn.innerHTML;
            
            locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obteniendo ubicación...';
            locationBtn.disabled = true;

            const location = await this.modules.map.getCurrentLocation();
            
            locationBtn.innerHTML = '<i class="fas fa-check"></i> Ubicación obtenida';
            setTimeout(() => {
                locationBtn.innerHTML = originalHTML;
                locationBtn.disabled = false;
            }, 2000);

            Utils.showNotification('Ubicación obtenida correctamente', 'success');

        } catch (error) {
            const locationBtn = document.getElementById('getCurrentLocation');
            locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Usar Mi Ubicación';
            locationBtn.disabled = false;

            let errorMessage = 'Error obteniendo ubicación';
            if (error.message.includes('denied')) {
                errorMessage = 'Permisos de ubicación denegados. Ingresa tu dirección manualmente.';
            }

            Utils.showNotification(errorMessage, 'error', 5000);
        }
    }

    /**
     * Maneja el input de dirección manual
     */
    async handleAddressInput() {
        const addressInput = document.getElementById('userAddress');
        const address = addressInput.value.trim();

        if (!address || !this.modules.map) return;

        try {
            await this.modules.map.geocodeAndSetLocation(address);
            Utils.showNotification('Dirección procesada', 'success');
        } catch (error) {
            console.error('Error procesando dirección:', error);
            Utils.showNotification('No se pudo procesar la dirección', 'warning');
        }
    }

    /**
     * Maneja actualizaciones de la lista de compras
     * @param {Array} items - Nuevos items de la lista
     */
    handleShoppingListUpdate(items) {
        this.state.shoppingList = [...items];
        
        // Actualizar estado del botón de comparar
        const compareBtn = document.getElementById('compareBtn');
        compareBtn.disabled = items.length === 0;

        // Actualizar contadores en la UI
        this.updateShoppingListCounters(items);
    }

    /**
     * Maneja actualizaciones de ubicación
     * @param {Object} location - Nueva ubicación
     */
    handleLocationUpdate(location) {
        this.state.userLocation = location;
        
        // Mostrar información de ubicación
        this.displayLocationInfo(location);
    }

    /**
     * Maneja actualizaciones de distancias
     * @param {Object} distances - Distancias calculadas
     */
    handleDistancesUpdate(distances) {
        const distanceList = document.getElementById('distanceList');
        const distanceInfo = document.getElementById('distanceInfo');

        if (!distanceList || !distanceInfo) return;

        distanceList.innerHTML = '';
        
        // Ordenar por distancia
        const sortedDistances = Object.entries(distances)
            .sort(([,a], [,b]) => a - b);

        sortedDistances.forEach(([marketName, distance]) => {
            const travelTime = Utils.estimateTravelTime(distance, 'driving');
            const distanceItem = document.createElement('div');
            distanceItem.innerHTML = `
                <span><strong>${marketName}</strong></span>
                <span>${Utils.formatDistance(distance)} (${travelTime})</span>
            `;
            distanceList.appendChild(distanceItem);
        });

        distanceInfo.style.display = 'block';
    }

    /**
     * Maneja la finalización de una comparación
     * @param {Object} data - Datos de la comparación
     */
    handleComparisonComplete(data) {
        // Mostrar notificación de éxito
        const bestMarket = data.metrics.bestValue?.market || data.metrics.bestPrice?.market;
        
        Swal.fire({
            icon: 'success',
            title: '¡Comparación Completada!',
            html: `
                <div style="text-align: left;">
                    <p><strong>🏆 Mejor opción:</strong> ${bestMarket}</p>
                    <p><strong>💰 Mejor precio:</strong> ${data.metrics.bestPrice.market} (${Utils.formatPrice(data.metrics.bestPrice.total)})</p>
                    <p><strong>📦 Más productos:</strong> ${data.metrics.mostAvailable.market} (${data.metrics.mostAvailable.count} productos)</p>
                    ${data.metrics.closest.distance < Infinity ? `<p><strong>🗺️ Más cercano:</strong> ${data.metrics.closest.market} (${Utils.formatDistance(data.metrics.closest.distance)})</p>` : ''}
                </div>
            `,
            confirmButtonText: 'Ver Detalles',
            confirmButtonColor: '#667eea',
            timer: 8000,
            timerProgressBar: true
        });

        // Actualizar estado
        this.state.lastComparison = {
            timestamp: Date.now(),
            results: data
        };
    }

    /**
     * Maneja errores de comparación
     * @param {Object} errorData - Datos del error
     */
    handleComparisonError(errorData) {
        console.error('Error en comparación:', errorData.error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error en la Comparación',
            text: 'Hubo un problema al comparar los supermercados. Intenta nuevamente.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#e53e3e'
        });
    }

    /**
     * Maneja cambios de conectividad
     * @param {Object} status - Estado de conectividad
     */
    handleConnectivityChange(status) {
        if (!status.online) {
            // Modo offline - deshabilitar funciones que requieren internet
            const locationBtn = document.getElementById('getCurrentLocation');
            if (locationBtn) {
                locationBtn.disabled = true;
                locationBtn.title = 'Requiere conexión a internet';
            }
        } else {
            // Modo online - rehabilitar funciones
            const locationBtn = document.getElementById('getCurrentLocation');
            if (locationBtn) {
                locationBtn.disabled = false;
                locationBtn.title = 'Usar mi ubicación actual';
            }
        }
    }

    /**
     * Maneja errores globales
     * @param {Object} errorData - Datos del error
     */
    handleGlobalError(errorData) {
        console.error('Error global:', errorData);
        
        // Solo mostrar errores críticos al usuario
        if (errorData.error && errorData.error.name === 'TypeError') {
            Utils.showNotification('Error en la aplicación. Recarga la página si persiste.', 'error');
        }
    }

    /**
     * Actualiza contadores de la lista de compras en la UI
     * @param {Array} items - Items de la lista
     */
    updateShoppingListCounters(items) {
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalProducts = items.length;

        // Actualizar título de la sección si existe
        const listTitle = document.querySelector('.card h2');
        if (listTitle && totalProducts > 0) {
            const icon = listTitle.querySelector('i');
            listTitle.innerHTML = `${icon.outerHTML} Lista de Compras <span style="font-size: 0.8em; color: var(--text-muted);">(${totalProducts} productos, ${totalItems} items)</span>`;
        }
    }

    /**
     * Muestra información de ubicación en la UI
     * @param {Object} location - Información de ubicación
     */
    displayLocationInfo(location) {
        const locationDisplay = document.getElementById('locationDisplay') || this.createLocationDisplay();
        
        locationDisplay.innerHTML = `
            <div style="margin-top: 15px; padding: 12px; background: #e6fffa; border-radius: 8px; font-size: 14px;">
                <strong><i class="fas fa-map-marker-alt"></i> Ubicación configurada:</strong><br>
                ${location.address || 'Coordenadas: ' + location.lat.toFixed(4) + ', ' + location.lng.toFixed(4)}
            </div>
        `;
    }

    /**
     * Crea el display de ubicación si no existe
     */
    createLocationDisplay() {
        const container = document.querySelector('.card:nth-child(2)'); // Segundo card (ubicación)
        const display = document.createElement('div');
        display.id = 'locationDisplay';
        container.appendChild(display);
        return display;
    }

    /**
     * Valida la configuración de la aplicación
     */
    validateConfiguration() {
        // Verificar que los datos de supermercados estén completos
        const requiredFields = ['location', 'address', 'products'];
        
        Object.entries(SUPERMARKETS_DATA).forEach(([name, data]) => {
            requiredFields.forEach(field => {
                if (!data[field]) {
                    console.warn(`⚠️ Supermercado ${name} falta campo: ${field}`);
                }
            });

            if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
                console.warn(`⚠️ Supermercado ${name} no tiene productos válidos`);
            }
        });

        // Verificar elementos del DOM requeridos
        const requiredElements = [
            'productInput', 'addProductBtn', 'shoppingList', 
            'compareBtn', 'mapContainer', 'resultsSection'
        ];

        requiredElements.forEach(elementId => {
            if (!document.getElementById(elementId)) {
                console.error(`❌ Elemento requerido no encontrado: ${elementId}`);
            }
        });
    }

    /**
     * Carga estado previo de la aplicación
     */
    loadPreviousState() {
        try {
            // La lista de compras se carga automáticamente en ShoppingListManager
            // Aquí podemos cargar otras preferencias del usuario
            
            const savedPreferences = Utils.getFromStorage('user_preferences');
            if (savedPreferences) {
                this.state.preferences = { ...this.state.preferences, ...savedPreferences };
            }

            // Aplicar preferencias cargadas
            this.applyUserPreferences();

        } catch (error) {
            console.warn('Error cargando estado previo:', error);
        }
    }

    /**
     * Carga preferencias del usuario
     * @returns {Object} Preferencias por defecto
     */
    loadUserPreferences() {
        return {
            theme: 'light',
            defaultTransport: 'driving',
            prioritizePrice: true,
            prioritizeDistance: false,
            autoLocation: false,
            notifications: true
        };
    }

    /**
     * Aplica las preferencias del usuario
     */
    applyUserPreferences() {
        // Aplicar tema si es necesario
        if (this.state.preferences.theme === 'dark') {
            document.body.classList.add('dark-theme');
        }

        // Configurar otras preferencias...
    }

    /**
     * Guarda el estado actual de la aplicación
     */
    saveCurrentState() {
        try {
            const stateToSave = {
                userLocation: this.state.userLocation,
                preferences: this.state.preferences,
                timestamp: Date.now()
            };

            Utils.saveToStorage('app_state', stateToSave);
        } catch (error) {
            console.warn('Error guardando estado:', error);
        }
    }

    /**
     * Muestra loading overlay
     * @param {string} message - Mensaje a mostrar
     */
    showLoading(message = 'Cargando...') {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="spinner"></div>
            <p style="margin-top: 20px; font-size: 16px;">${message}</p>
        `;
        overlay.style.display = 'flex';
    }

    /**
     * Oculta loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    /**
     * Muestra mensaje de bienvenida
     */
    showWelcomeMessage() {
        // Solo mostrar en la primera visita
        const hasVisited = Utils.getFromStorage('has_visited');
        if (hasVisited) return;

        setTimeout(() => {
            Swal.fire({
                title: '¡Bienvenido al Comparador!',
                html: `
                    <div style="text-align: left;">
                        <p>🛒 <strong>Paso 1:</strong> Agrega productos a tu lista de compras</p>
                        <p>📍 <strong>Paso 2:</strong> Configura tu ubicación (opcional)</p>
                        <p>⚖️ <strong>Paso 3:</strong> Compara precios y encuentra la mejor opción</p>
                        <br>
                        <p style="text-align: center; color: #666;">
                            <small>💡 Tip: Puedes agregar múltiples productos separándolos con comas</small>
                        </p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: '¡Empezar!',
                confirmButtonColor: '#667eea',
                allowOutsideClick: false
            });

            Utils.saveToStorage('has_visited', true);
        }, 1000);
    }

    /**
     * Maneja errores de inicialización
     * @param {Error} error - Error ocurrido
     */
    handleInitializationError(error) {
        this.hideLoading();
        
        Swal.fire({
            icon: 'error',
            title: 'Error de Inicialización',
            html: `
                <p>No se pudo inicializar la aplicación correctamente.</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <p>Por favor, recarga la página e intenta nuevamente.</p>
            `,
            confirmButtonText: 'Recargar Página',
            confirmButtonColor: '#e53e3e',
            allowOutsideClick: false
        }).then(() => {
            window.location.reload();
        });
    }

    /**
     * Obtiene estadísticas de uso de la aplicación
     * @returns {Object} Estadísticas de uso
     */
    getUsageStats() {
        const stats = Utils.getFromStorage('usage_stats', {
            comparisons: 0,
            productsAdded: 0,
            lastUsed: null
        });

        return stats;
    }

    /**
     * Actualiza estadísticas de uso
     * @param {string} action - Acción realizada
     * @param {Object} data - Datos adicionales
     */
    updateUsageStats(action, data = {}) {
        const stats = this.getUsageStats();
        
        switch (action) {
            case 'comparison':
                stats.comparisons++;
                break;
            case 'product_added':
                stats.productsAdded++;
                break;
        }
        
        stats.lastUsed = Date.now();
        Utils.saveToStorage('usage_stats', stats);
    }

    /**
     * Reinicia la aplicación
     */
    reset() {
        // Limpiar módulos
        if (this.modules.shoppingList) {
            this.modules.shoppingList.clearList();
        }
        
        if (this.modules.map) {
            this.modules.map.reset();
        }
        
        if (this.modules.comparison) {
            this.modules.comparison.reset();
        }

        // Ocultar resultados
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }

        // Resetear estado
        this.state = {
            userLocation: null,
            shoppingList: [],
            lastComparison: null,
            preferences: this.loadUserPreferences()
        };

        Utils.showNotification('Aplicación reiniciada', 'info');
        AppEvents.emit('app-reset');
    }

    /**
     * Verifica si la aplicación está lista para usar
     * @returns {boolean} True si está lista
     */
    isReady() {
        return this.isInitialized && 
               this.modules.shoppingList && 
               this.modules.map && 
               this.modules.comparison && 
               this.modules.results;
    }

    /**
     * Obtiene información del estado actual
     * @returns {Object} Estado actual de la aplicación
     */
    getState() {
        return {
            ...this.state,
            isReady: this.isReady(),
            modules: Object.keys(this.modules),
            timestamp: Date.now()
        };
    }
}

// Instancia global de la aplicación
let App = null;

/**
 * Función principal de inicialización
 * Se ejecuta cuando el DOM está listo
 */
async function initializeApp() {
    try {
        // Crear instancia de la aplicación
        App = new SupermarketComparatorApp();
        
        // Inicializar
        await App.initialize();
        
        // Hacer disponible globalmente para debugging
        window.App = App;
        
    } catch (error) {
        console.error('Error fatal inicializando aplicación:', error);
        
        // Mostrar error crítico
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; background: #f7fafc;">
                <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 500px;">
                    <h2 style="color: #e53e3e; margin-bottom: 15px;">
                        <i class="fas fa-exclamation-triangle"></i> Error Crítico
                    </h2>
                    <p style="margin-bottom: 20px;">La aplicación no se pudo inicializar correctamente.</p>
                    <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
                        Error: ${error.message}
                    </p>
                    <button onclick="window.location.reload()" 
                            style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-redo"></i> Recargar Página
                    </button>
                </div>
            </div>
        `;
    }
}

// Event listener para inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeApp);

// Funciones globales de utilidad
window.restartApp = () => {
    if (App) {
        App.reset();
    }
};

window.getAppState = () => {
    return App ? App.getState() : null;
};

// Manejo de errores no capturados
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rechazada no manejada:', event.reason);
    event.preventDefault();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupermarketComparatorApp, initializeApp };
}