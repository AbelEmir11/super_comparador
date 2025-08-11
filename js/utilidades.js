/**
 * Utilidades generales para la aplicación
 * Funciones auxiliares, validaciones y helpers
 */

const Utils = {
    /**
     * Calcula la distancia entre dos puntos usando la fórmula Haversine
     * @param {number} lat1 - Latitud del primer punto
     * @param {number} lon1 - Longitud del primer punto
     * @param {number} lat2 - Latitud del segundo punto
     * @param {number} lon2 - Longitud del segundo punto
     * @returns {number} Distancia en kilómetros
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en kilómetros
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    /**
     * Convierte grados a radianes
     * @param {number} degrees - Grados a convertir
     * @returns {number} Valor en radianes
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    },

    /**
     * Formatea un precio en pesos argentinos
     * @param {number} price - Precio a formatear
     * @param {boolean} includeSymbol - Si incluir el símbolo $
     * @returns {string} Precio formateado
     */
    formatPrice(price, includeSymbol = true) {
        const formattedPrice = new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(price);
        
        return includeSymbol ? `$${formattedPrice}` : formattedPrice;
    },

    /**
     * Formatea una distancia
     * @param {number} distance - Distancia en kilómetros
     * @returns {string} Distancia formateada
     */
    formatDistance(distance) {
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m`;
        }
        return `${distance.toFixed(1)}km`;
    },

    /**
     * Debounce function para optimizar llamadas
     * @param {Function} func - Función a ejecutar
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function} Función debounced
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function para limitar ejecuciones
     * @param {Function} func - Función a ejecutar
     * @param {number} limit - Límite de tiempo en ms
     * @returns {Function} Función throttled
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Sanitiza input del usuario
     * @param {string} input - Input a sanitizar
     * @returns {string} Input sanitizado
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .trim()
            .toLowerCase()
            .replace(/[<>\"'&]/g, '') // Remover caracteres peligrosos
            .substring(0, 100); // Limitar longitud
    },

    /**
     * Valida formato de email
     * @param {string} email - Email a validar
     * @returns {boolean} True si es válido
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Genera un ID único simple
     * @returns {string} ID único
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Almacena datos en localStorage de forma segura
     * @param {string} key - Clave
     * @param {*} data - Datos a almacenar
     * @returns {boolean} True si se almacenó correctamente
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.warn('Error saving to localStorage:', error);
            return false;
        }
    },

    /**
     * Recupera datos de localStorage de forma segura
     * @param {string} key - Clave
     * @param {*} defaultValue - Valor por defecto
     * @returns {*} Datos recuperados
     */
    getFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Error reading from localStorage:', error);
            return defaultValue;
        }
    },

    /**
     * Elimina datos de localStorage
     * @param {string} key - Clave a eliminar
     */
    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Error removing from localStorage:', error);
        }
    },

    /**
     * Copia texto al portapapeles
     * @param {string} text - Texto a copiar
     * @returns {Promise<boolean>} Promise que resuelve true si se copió
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.warn('Error copying to clipboard:', error);
            return false;
        }
    },

    /**
     * Obtiene la ubicación del usuario
     * @param {Object} options - Opciones de geolocalización
     * @returns {Promise<Object>} Promise con las coordenadas
     */
    getCurrentLocation(options = {}) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalización no soportada'));
                return;
            }

            const defaultOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutos
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    let message = 'Error obteniendo ubicación';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Permisos de ubicación denegados';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Ubicación no disponible';
                            break;
                        case error.TIMEOUT:
                            message = 'Tiempo de espera agotado';
                            break;
                    }
                    reject(new Error(message));
                },
                { ...defaultOptions, ...options }
            );
        });
    },

    /**
     * Simula geocodificación de dirección (en producción usar API real)
     * @param {string} address - Dirección a geocodificar
     * @returns {Promise<Object>} Promise con las coordenadas
     */
    async geocodeAddress(address) {
        // Simulación - en producción usarías una API como Google Maps o OpenStreetMap
        const sanitizedAddress = this.sanitizeInput(address);
        
        // Coordenadas simuladas para diferentes áreas de Mendoza
        const mendozaAreas = [
            { lat: -32.8895, lng: -68.8458, keywords: ['centro', 'san martin', 'rivadavia'] },
            { lat: -32.8851, lng: -68.8444, keywords: ['godoy cruz', 'las heras'] },
            { lat: -32.8876, lng: -68.8456, keywords: ['ciudad', 'parque'] },
            { lat: -32.9010, lng: -68.8350, keywords: ['sur', 'lujan'] },
            { lat: -32.8750, lng: -68.8550, keywords: ['norte', 'capital'] }
        ];

        for (const area of mendozaAreas) {
            if (area.keywords.some(keyword => sanitizedAddress.includes(keyword))) {
                return {
                    lat: area.lat + (Math.random() - 0.5) * 0.01, // Agregar variación
                    lng: area.lng + (Math.random() - 0.5) * 0.01,
                    address: address,
                    confidence: 0.8
                };
            }
        }

        // Si no coincide con ninguna área específica, usar coordenadas default
        return {
            lat: APP_CONFIG.defaultLocation.lat + (Math.random() - 0.5) * 0.02,
            lng: APP_CONFIG.defaultLocation.lng + (Math.random() - 0.5) * 0.02,
            address: address,
            confidence: 0.5
        };
    },

    /**
     * Muestra notificaciones toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de notificación (success, error, warning, info)
     * @param {number} duration - Duración en ms
     */
    showNotification(message, type = 'info', duration = 3000) {
        const config = {
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: duration,
            timerProgressBar: true,
            title: message
        };

        switch (type) {
            case 'success':
                Swal.fire({ ...config, icon: 'success' });
                break;
            case 'error':
                Swal.fire({ ...config, icon: 'error' });
                break;
            case 'warning':
                Swal.fire({ ...config, icon: 'warning' });
                break;
            default:
                Swal.fire({ ...config, icon: 'info' });
        }
    },

    /**
     * Valida lista de compras
     * @param {Array} shoppingList - Lista de compras
     * @returns {Object} Resultado de la validación
     */
    validateShoppingList(shoppingList) {
        const errors = [];
        
        if (!Array.isArray(shoppingList)) {
            errors.push('La lista de compras debe ser un array');
        }
        
        if (shoppingList.length === 0) {
            errors.push('La lista de compras está vacía');
        }
        
        shoppingList.forEach((item, index) => {
            if (!item.name || typeof item.name !== 'string') {
                errors.push(`Producto ${index + 1}: nombre inválido`);
            }
            
            if (!item.quantity || item.quantity < 1) {
                errors.push(`Producto ${index + 1}: cantidad debe ser mayor a 0`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Calcula estadísticas de comparación
     * @param {Object} results - Resultados de comparación
     * @returns {Object} Estadísticas calculadas
     */
    calculateComparisonStats(results) {
        const markets = Object.keys(results);
        if (markets.length === 0) return null;

        let totalSavings = 0;
        let bestMarket = null;
        let worstMarket = null;
        let bestPrice = Infinity;
        let worstPrice = 0;

        markets.forEach(marketName => {
            const result = results[marketName];
            if (result.total > 0) {
                if (result.total < bestPrice) {
                    bestPrice = result.total;
                    bestMarket = marketName;
                }
                if (result.total > worstPrice) {
                    worstPrice = result.total;
                    worstMarket = marketName;
                }
            }
        });

        if (bestPrice < Infinity && worstPrice > 0) {
            totalSavings = worstPrice - bestPrice;
        }

        return {
            bestMarket,
            worstMarket,
            bestPrice,
            worstPrice,
            totalSavings,
            savingsPercentage: worstPrice > 0 ? ((totalSavings / worstPrice) * 100) : 0
        };
    },

    /**
     * Formatea tiempo de viaje estimado
     * @param {number} distance - Distancia en km
     * @param {string} transport - Tipo de transporte ('walking', 'driving', 'cycling')
     * @returns {string} Tiempo formateado
     */
    estimateTravelTime(distance, transport = 'driving') {
        const speeds = {
            walking: 5, // km/h
            cycling: 15, // km/h
            driving: 30 // km/h en ciudad
        };

        const speed = speeds[transport] || speeds.driving;
        const timeInHours = distance / speed;
        const timeInMinutes = Math.round(timeInHours * 60);

        if (timeInMinutes < 60) {
            return `${timeInMinutes} min`;
        } else {
            const hours = Math.floor(timeInMinutes / 60);
            const minutes = timeInMinutes % 60;
            return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
        }
    },

    /**
     * Genera sugerencias de productos basadas en el input
     * @param {string} input - Input del usuario
     * @param {number} limit - Límite de sugerencias
     * @returns {Array} Array de sugerencias
     */
    generateProductSuggestions(input, limit = 5) {
        if (!input || input.length < 2) return [];
        
        const suggestions = DataUtils.searchProducts(input);
        return suggestions.slice(0, limit).map(product => ({
            text: product.name,
            category: product.category,
            icon: PRODUCT_CATEGORIES[product.category]?.icon || '📦'
        }));
    },

    /**
     * Analiza patrones en la lista de compras
     * @param {Array} shoppingList - Lista de compras
     * @returns {Object} Análisis de patrones
     */
    analyzeShoppingPatterns(shoppingList) {
        const categoryCount = {};
        const priceRanges = { low: 0, medium: 0, high: 0 };
        let totalItems = 0;

        shoppingList.forEach(item => {
            // Buscar el producto en los datos
            let foundProduct = null;
            for (const supermarket of Object.values(SUPERMARKETS_DATA)) {
                foundProduct = supermarket.products.find(p => 
                    p.name.toLowerCase() === item.name.toLowerCase()
                );
                if (foundProduct) break;
            }

            if (foundProduct) {
                // Contar por categoría
                categoryCount[foundProduct.category] = 
                    (categoryCount[foundProduct.category] || 0) + item.quantity;
                
                // Clasificar por rango de precio
                const totalPrice = foundProduct.price * item.quantity;
                if (totalPrice < 1000) priceRanges.low++;
                else if (totalPrice < 3000) priceRanges.medium++;
                else priceRanges.high++;
                
                totalItems += item.quantity;
            }
        });

        // Encontrar categoría más común
        const mostCommonCategory = Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)[0];

        return {
            totalItems,
            categoriesCount: Object.keys(categoryCount).length,
            mostCommonCategory: mostCommonCategory ? {
                name: mostCommonCategory[0],
                count: mostCommonCategory[1],
                percentage: (mostCommonCategory[1] / totalItems * 100).toFixed(1)
            } : null,
            priceDistribution: priceRanges,
            recommendations: this.generateShoppingRecommendations(categoryCount)
        };
    },

    /**
     * Genera recomendaciones basadas en patrones de compra
     * @param {Object} categoryCount - Conteo por categorías
     * @returns {Array} Array de recomendaciones
     */
    generateShoppingRecommendations(categoryCount) {
        const recommendations = [];
        
        // Recomendaciones basadas en categorías faltantes
        const availableCategories = Object.keys(PRODUCT_CATEGORIES);
        const userCategories = Object.keys(categoryCount);
        
        availableCategories.forEach(category => {
            if (!userCategories.includes(category)) {
                const categoryInfo = PRODUCT_CATEGORIES[category];
                recommendations.push({
                    type: 'missing_category',
                    message: `Considera agregar productos de ${categoryInfo.name}`,
                    icon: categoryInfo.icon,
                    priority: 'low'
                });
            }
        });

        // Recomendación de supermercado especializado
        if (categoryCount['carnicería'] && categoryCount['carnicería'] > 2) {
            recommendations.push({
                type: 'specialized_store',
                message: 'Con muchos productos cárnicos, considera una carnicería especializada',
                icon: '🥩',
                priority: 'medium'
            });
        }

        return recommendations.slice(0, 3); // Limitar a 3 recomendaciones
    },

    /**
     * Exporta resultados de comparación a diferentes formatos
     * @param {Object} comparisonResults - Resultados de la comparación
     * @param {string} format - Formato de exportación ('csv', 'txt', 'json')
     * @returns {string} Datos formateados
     */
    exportResults(comparisonResults, format = 'txt') {
        switch (format) {
            case 'csv':
                return this.exportToCSV(comparisonResults);
            case 'json':
                return JSON.stringify(comparisonResults, null, 2);
            default:
                return this.exportToText(comparisonResults);
        }
    },

    /**
     * Exporta a formato CSV
     * @param {Object} results - Resultados
     * @returns {string} CSV string
     */
    exportToCSV(results) {
        let csv = 'Supermercado,Producto,Cantidad,Precio Unitario,Precio Total,Disponible\n';
        
        Object.entries(results).forEach(([supermarket, result]) => {
            result.items.forEach(item => {
                csv += `"${supermarket}","${item.name}",${item.quantity},${item.price},${item.total},${item.available ? 'Sí' : 'No'}\n`;
            });
        });
        
        return csv;
    },

    /**
     * Exporta a formato texto
     * @param {Object} results - Resultados
     * @returns {string} Texto formateado
     */
    exportToText(results) {
        let text = 'COMPARACIÓN DE SUPERMERCADOS\n';
        text += '=' .repeat(50) + '\n\n';
        
        Object.entries(results).forEach(([supermarket, result]) => {
            text += `${supermarket.toUpperCase()}\n`;
            text += '-'.repeat(supermarket.length) + '\n';
            text += `Total: ${this.formatPrice(result.total)}\n`;
            text += `Productos disponibles: ${result.availableCount}\n`;
            if (result.distance) {
                text += `Distancia: ${this.formatDistance(result.distance)}\n`;
            }
            text += '\nProductos:\n';
            
            result.items.forEach(item => {
                const status = item.available ? '✓' : '✗';
                text += `  ${status} ${item.name} x${item.quantity} - ${this.formatPrice(item.total)}\n`;
            });
            
            text += '\n' + '='.repeat(50) + '\n\n';
        });
        
        return text;
    },

    /**
     * Descarga un archivo con el contenido especificado
     * @param {string} content - Contenido del archivo
     * @param {string} filename - Nombre del archivo
     * @param {string} mimeType - Tipo MIME del archivo
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    },

    /**
     * Valida conectividad de red
     * @returns {boolean} True si hay conexión
     */
    isOnline() {
        return navigator.onLine;
    },

    /**
     * Crea un delay/pausa
     * @param {number} ms - Milisegundos a esperar
     * @returns {Promise} Promise que resuelve después del delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Trunca texto a una longitud específica
     * @param {string} text - Texto a truncar
     * @param {number} length - Longitud máxima
     * @param {string} suffix - Sufijo (por defecto '...')
     * @returns {string} Texto truncado
     */
    truncateText(text, length, suffix = '...') {
        if (text.length <= length) return text;
        return text.substring(0, length - suffix.length) + suffix;
    },

    /**
     * Capitaliza la primera letra de cada palabra
     * @param {string} text - Texto a capitalizar
     * @returns {string} Texto capitalizado
     */
    capitalizeWords(text) {
        return text.replace(/\b\w/g, letter => letter.toUpperCase());
    },

    /**
     * Obtiene el contraste de color para texto
     * @param {string} hexColor - Color en formato hex
     * @returns {string} 'light' o 'dark'
     */
    getContrastColor(hexColor) {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        // Calcular luminancia
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? 'dark' : 'light';
    }
};

// Event Emitter simple para comunicación entre módulos
class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }
    
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
}

// Instancia global del event emitter
const AppEvents = new EventEmitter();

// Manejo de errores global
window.addEventListener('error', (event) => {
    console.error('Error global capturado:', event.error);
    AppEvents.emit('global-error', {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error
    });
});

// Detectar cambios en conectividad
window.addEventListener('online', () => {
    AppEvents.emit('connectivity-change', { online: true });
    Utils.showNotification('Conexión restaurada', 'success');
});

window.addEventListener('offline', () => {
    AppEvents.emit('connectivity-change', { online: false });
    Utils.showNotification('Sin conexión a internet', 'warning');
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, EventEmitter, AppEvents };
}