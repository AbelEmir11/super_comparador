/**
 * Módulo para manejo de mapas y geolocalización
 * Gestiona la interacción con Leaflet y cálculos de distancia
 */

class MapManager {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.supermarketMarkers = [];
        this.userLocation = null;
        this.distances = {};
        this.isInitialized = false;
    }

    /**
     * Inicializa el mapa
     * @param {string} containerId - ID del contenedor del mapa
     */
    initialize(containerId = 'mapContainer') {
        try {
            // Crear el mapa centrado en Mendoza
            this.map = L.map(containerId).setView(
                [APP_CONFIG.defaultLocation.lat, APP_CONFIG.defaultLocation.lng], 
                APP_CONFIG.mapZoom.default
            );

            // Agregar capa de tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
                minZoom: 10
            }).addTo(this.map);

            // Agregar marcadores de supermercados
            this.addSupermarketMarkers();

            // Configurar eventos
            this.setupEventListeners();

            this.isInitialized = true;
            AppEvents.emit('map-initialized');

            console.log('Mapa inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando el mapa:', error);
            AppEvents.emit('map-error', { error, type: 'initialization' });
        }
    }

    /**
     * Agrega marcadores de supermercados al mapa
     */
    addSupermarketMarkers() {
        // Limpiar marcadores existentes
        this.clearSupermarketMarkers();

        Object.entries(SUPERMARKETS_DATA).forEach(([name, data]) => {
            const marker = L.marker([data.location.lat, data.location.lng], {
                title: name,
                alt: `Ubicación de ${name}`
            });

            // Crear popup personalizado
            const popupContent = this.createSupermarketPopup(name, data);
            marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'supermarket-popup'
            });

            // Agregar al mapa y guardar referencia
            marker.addTo(this.map);
            this.supermarketMarkers.push({
                marker,
                name,
                data
            });
        });
    }

    /**
     * Crea el contenido HTML para el popup del supermercado
     * @param {string} name - Nombre del supermercado
     * @param {Object} data - Datos del supermercado
     * @returns {string} HTML del popup
     */
    createSupermarketPopup(name, data) {
        const distance = this.distances[name] ? 
            Utils.formatDistance(this.distances[name]) : '';
        
        const travelTime = this.distances[name] ? 
            Utils.estimateTravelTime(this.distances[name], 'driving') : '';

        return `
            <div class="supermarket-popup-content">
                <h4 style="margin: 0 0 10px 0; color: var(--primary-color);">
                    <i class="fas fa-store"></i> ${name}
                </h4>
                <p style="margin: 5px 0; font-size: 13px;">
                    <i class="fas fa-map-marker-alt"></i> ${data.address}
                </p>
                <p style="margin: 5px 0; font-size: 13px;">
                    <i class="fas fa-phone"></i> ${data.phone}
                </p>
                <div style="margin: 8px 0; font-size: 12px;">
                    <strong>Horarios:</strong><br>
                    <i class="fas fa-clock"></i> Lu-Vi: ${data.hours.weekdays}<br>
                    <i class="fas fa-clock"></i> Sáb: ${data.hours.saturday}<br>
                    <i class="fas fa-clock"></i> Dom: ${data.hours.sunday}
                </div>
                ${distance ? `
                <div style="margin-top: 10px; padding: 8px; background: #e3f2fd; border-radius: 6px; font-size: 12px;">
                    <strong><i class="fas fa-route"></i> Distancia:</strong> ${distance}<br>
                    <strong><i class="fas fa-car"></i> Tiempo aprox:</strong> ${travelTime}
                </div>
                ` : ''}
                <div style="margin-top: 10px;">
                    <button onclick="MapManager.instance.focusOnSupermarket('${name}')" 
                            style="background: var(--primary-color); color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        <i class="fas fa-search-plus"></i> Enfocar
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Configura los event listeners del mapa
     */
    setupEventListeners() {
        // Click en el mapa para establecer ubicación manual
        this.map.on('click', (e) => {
            this.setUserLocation(e.latlng.lat, e.latlng.lng, 'Ubicación seleccionada');
        });

        // Evento cuando el mapa termina de moverse
        this.map.on('moveend', () => {
            AppEvents.emit('map-moved', {
                center: this.map.getCenter(),
                zoom: this.map.getZoom()
            });
        });
    }

    /**
     * Establece la ubicación del usuario
     * @param {number} lat - Latitud
     * @param {number} lng - Longitud
     * @param {string} address - Dirección (opcional)
     */
    setUserLocation(lat, lng, address = 'Tu ubicación') {
        try {
            this.userLocation = { lat, lng };

            // Remover marcador anterior si existe
            if (this.userMarker) {
                this.map.removeLayer(this.userMarker);
            }

            // Crear nuevo marcador del usuario con icono personalizado
            const userIcon = L.divIcon({
                html: '<i class="fas fa-user-circle" style="color: #e53e3e; font-size: 24px;"></i>',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                popupAnchor: [0, -12],
                className: 'user-location-marker'
            });

            this.userMarker = L.marker([lat, lng], { 
                icon: userIcon,
                title: 'Tu ubicación'
            });

            const popupContent = `
                <div style="text-align: center;">
                    <h4 style="margin: 0 0 8px 0; color: var(--danger-color);">
                        <i class="fas fa-user-circle"></i> Tu Ubicación
                    </h4>
                    <p style="margin: 0; font-size: 13px;">${address}</p>
                    <button onclick="MapManager.instance.centerOnUser()" 
                            style="background: var(--danger-color); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; margin-top: 8px;">
                        <i class="fas fa-crosshairs"></i> Centrar aquí
                    </button>
                </div>
            `;

            this.userMarker.bindPopup(popupContent).addTo(this.map);

            // Centrar el mapa en la ubicación del usuario
            this.map.setView([lat, lng], APP_CONFIG.mapZoom.detailed);

            // Calcular distancias
            this.calculateDistances();

            AppEvents.emit('user-location-set', { lat, lng, address });

        } catch (error) {
            console.error('Error estableciendo ubicación del usuario:', error);
            AppEvents.emit('map-error', { error, type: 'user-location' });
        }
    }

    /**
     * Calcula las distancias desde la ubicación del usuario a todos los supermercados
     */
    calculateDistances() {
        if (!this.userLocation) {
            console.warn('No hay ubicación del usuario para calcular distancias');
            return;
        }

        this.distances = {};
        
        Object.entries(SUPERMARKETS_DATA).forEach(([name, data]) => {
            const distance = Utils.calculateDistance(
                this.userLocation.lat,
                this.userLocation.lng,
                data.location.lat,
                data.location.lng
            );
            
            this.distances[name] = distance;
        });

        // Actualizar popups de supermercados con nueva información de distancia
        this.updateSupermarketPopups();

        // Emitir evento con las distancias calculadas
        AppEvents.emit('distances-calculated', this.distances);
    }

    /**
     * Actualiza los popups de supermercados con información de distancia
     */
    updateSupermarketPopups() {
        this.supermarketMarkers.forEach(({ marker, name, data }) => {
            const popupContent = this.createSupermarketPopup(name, data);
            marker.setPopupContent(popupContent);
        });
    }

    /**
     * Obtiene la ubicación actual del usuario usando GPS
     * @returns {Promise<Object>} Promise con las coordenadas
     */
    async getCurrentLocation() {
        try {
            const location = await Utils.getCurrentLocation();
            this.setUserLocation(location.lat, location.lng, 'Mi ubicación actual');
            return location;
        } catch (error) {
            console.error('Error obteniendo ubicación GPS:', error);
            throw error;
        }
    }

    /**
     * Geocodifica una dirección y establece la ubicación del usuario
     * @param {string} address - Dirección a geocodificar
     * @returns {Promise<Object>} Promise con las coordenadas
     */
    async geocodeAndSetLocation(address) {
        try {
            const location = await Utils.geocodeAddress(address);
            this.setUserLocation(location.lat, location.lng, location.address);
            return location;
        } catch (error) {
            console.error('Error geocodificando dirección:', error);
            throw error;
        }
    }

    /**
     * Centra el mapa en un supermercado específico
     * @param {string} supermarketName - Nombre del supermercado
     */
    focusOnSupermarket(supermarketName) {
        const supermarket = SUPERMARKETS_DATA[supermarketName];
        if (supermarket) {
            this.map.setView([supermarket.location.lat, supermarket.location.lng], 16);
            
            // Abrir popup del supermercado
            const markerInfo = this.supermarketMarkers.find(m => m.name === supermarketName);
            if (markerInfo) {
                markerInfo.marker.openPopup();
            }
        }
    }

    /**
     * Centra el mapa en la ubicación del usuario
     */
    centerOnUser() {
        if (this.userLocation) {
            this.map.setView([this.userLocation.lat, this.userLocation.lng], APP_CONFIG.mapZoom.detailed);
            if (this.userMarker) {
                this.userMarker.openPopup();
            }
        }
    }

    /**
     * Ajusta la vista del mapa para mostrar todos los marcadores
     */
    fitAllMarkers() {
        const group = new L.featureGroup();
        
        // Agregar todos los marcadores al grupo
        this.supermarketMarkers.forEach(({ marker }) => {
            group.addLayer(marker);
        });
        
        if (this.userMarker) {
            group.addLayer(this.userMarker);
        }

        // Ajustar vista para mostrar todos los marcadores
        if (group.getLayers().length > 0) {
            this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
        }
    }

    /**
     * Limpia todos los marcadores de supermercados
     */
    clearSupermarketMarkers() {
        this.supermarketMarkers.forEach(({ marker }) => {
            this.map.removeLayer(marker);
        });
        this.supermarketMarkers = [];
    }

    /**
     * Limpia el marcador del usuario
     */
    clearUserMarker() {
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
            this.userMarker = null;
        }
        this.userLocation = null;
        this.distances = {};
    }

    /**
     * Resetea el mapa a su estado inicial
     */
    reset() {
        this.clearUserMarker();
        this.map.setView([APP_CONFIG.defaultLocation.lat, APP_CONFIG.defaultLocation.lng], APP_CONFIG.mapZoom.default);
        AppEvents.emit('map-reset');
    }

    /**
     * Obtiene las distancias calculadas
     * @returns {Object} Objeto con las distancias
     */
    getDistances() {
        return { ...this.distances };
    }

    /**
     * Obtiene la ubicación actual del usuario
     * @returns {Object|null} Ubicación del usuario
     */
    getUserLocation() {
        return this.userLocation ? { ...this.userLocation } : null;
    }

    /**
     * Verifica si el mapa está inicializado
     * @returns {boolean} True si está inicializado
     */
    isReady() {
        return this.isInitialized && this.map !== null;
    }

    /**
     * Destruye el mapa y limpia recursos
     */
    destroy() {
        if (this.map) {
            this.clearSupermarketMarkers();
            this.clearUserMarker();
            this.map.remove();
            this.map = null;
        }
        this.isInitialized = false;
        AppEvents.emit('map-destroyed');
    }
}

// Instancia singleton del MapManager
MapManager.instance = null;

/**
 * Inicializa el manager de mapas
 * @param {string} containerId - ID del contenedor del mapa
 * @returns {MapManager} Instancia del MapManager
 */
function initializeMap(containerId) {
    if (!MapManager.instance) {
        MapManager.instance = new MapManager();
    }
    
    if (!MapManager.instance.isReady()) {
        MapManager.instance.initialize(containerId);
    }
    
    return MapManager.instance;
}

/**
 * Obtiene la instancia actual del MapManager
 * @returns {MapManager|null} Instancia actual o null si no está inicializada
 */
function getMapInstance() {
    return MapManager.instance;
}

// Event listeners para manejo de errores específicos de mapas
AppEvents.on('map-error', (data) => {
    const errorMessages = {
        'initialization': 'Error al cargar el mapa. Verifica tu conexión.',
        'user-location': 'Error al establecer tu ubicación.',
        'geocoding': 'No se pudo encontrar la dirección especificada.'
    };
    
    const message = errorMessages[data.type] || 'Error en el mapa';
    Utils.showNotification(message, 'error');
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.MapManager = MapManager;
    window.initializeMap = initializeMap;
    window.getMapInstance = getMapInstance;
}