/**
 * Módulo de comparación de supermercados
 * Algoritmo principal para análisis y recomendaciones
 */
let ResultsRenderer_instance = null;
class ComparisonEngine {
    constructor() {
        this.results = {};
        this.metrics = {};
        this.recommendations = {};
        this.isComparing = false;
    }

    /**
     * Ejecuta la comparación completa
     * @param {Array} shoppingList - Lista de compras
     * @param {Object} userLocation - Ubicación del usuario (opcional)
     * @returns {Promise<Object>} Resultados de la comparación
     */
    async compare(shoppingList, userLocation = null) {
        if (this.isComparing) {
            console.warn('Comparación ya en progreso');
            return this.results;
        }

        try {
            this.isComparing = true;
            AppEvents.emit('comparison-started');

            // Validar entrada
            const validation = Utils.validateShoppingList(shoppingList);
            if (!validation.isValid) {
                throw new Error(`Lista inválida: ${validation.errors.join(', ')}`);
            }

            // Resetear resultados
            this.results = {};
            this.metrics = {};

            // Calcular resultados para cada supermercado
            Object.entries(SUPERMARKETS_DATA).forEach(([marketName, marketData]) => {
                this.results[marketName] = this.calculateMarketResult(
                    marketName, 
                    marketData, 
                    shoppingList, 
                    userLocation
                );
            });

            // Calcular métricas generales
            this.metrics = this.calculateMetrics();

            // Generar recomendaciones
            this.recommendations = this.generateRecommendations();

            AppEvents.emit('comparison-completed', {
                results: this.results,
                metrics: this.metrics,
                recommendations: this.recommendations
            });

            return {
                results: this.results,
                metrics: this.metrics,
                recommendations: this.recommendations
            };

        } catch (error) {
            console.error('Error en comparación:', error);
            AppEvents.emit('comparison-error', { error });
            throw error;
        } finally {
            this.isComparing = false;
        }
    }

    /**
     * Calcula el resultado para un supermercado específico
     * @param {string} marketName - Nombre del supermercado
     * @param {Object} marketData - Datos del supermercado
     * @param {Array} shoppingList - Lista de compras
     * @param {Object} userLocation - Ubicación del usuario
     * @returns {Object} Resultado del supermercado
     */
    calculateMarketResult(marketName, marketData, shoppingList, userLocation) {
        let total = 0;
        let availableCount = 0;
        const items = [];
        const missingProducts = [];

        // Procesar cada producto de la lista
        shoppingList.forEach(shoppingItem => {
            const product = marketData.products.find(p => 
                p.name.toLowerCase() === shoppingItem.name.toLowerCase()
            );

            if (product && product.available) {
                const itemTotal = product.price * shoppingItem.quantity;
                total += itemTotal;
                availableCount++;
                
                items.push({
                    name: shoppingItem.name,
                    quantity: shoppingItem.quantity,
                    unitPrice: product.price,
                    total: itemTotal,
                    available: true,
                    brand: product.brand,
                    category: product.category
                });
            } else {
                missingProducts.push(shoppingItem.name);
                items.push({
                    name: shoppingItem.name,
                    quantity: shoppingItem.quantity,
                    unitPrice: 0,
                    total: 0,
                    available: false,
                    brand: null,
                    category: shoppingItem.category || 'desconocido'
                });
            }
        });

        // Calcular distancia si hay ubicación del usuario
        let distance = null;
        let travelTime = null;
        if (userLocation) {
            distance = Utils.calculateDistance(
                userLocation.lat, userLocation.lng,
                marketData.location.lat, marketData.location.lng
            );
            travelTime = Utils.estimateTravelTime(distance, 'driving');
        }

        // Calcular métricas adicionales
        const availability = shoppingList.length > 0 ? (availableCount / shoppingList.length) * 100 : 0;
        const averageItemPrice = availableCount > 0 ? total / availableCount : 0;

        return {
            marketName,
            total,
            availableCount,
            totalItemsRequested: shoppingList.length,
            availability,
            averageItemPrice,
            items,
            missingProducts,
            distance,
            travelTime,
            address: marketData.address,
            phone: marketData.phone,
            hours: marketData.hours
        };
    }

    /**
     * Calcula métricas generales de la comparación
     * @returns {Object} Métricas calculadas
     */
    calculateMetrics() {
        const marketNames = Object.keys(this.results);
        if (marketNames.length === 0) return {};

        let bestPrice = { market: '', total: Infinity };
        let mostAvailable = { market: '', count: 0, percentage: 0 };
        let closest = { market: '', distance: Infinity };
        let bestValue = { market: '', score: 0 };

        // Calcular métricas para cada supermercado
        marketNames.forEach(marketName => {
            const result = this.results[marketName];
            
            // Mejor precio total
            if (result.availableCount > 0 && result.total < bestPrice.total) {
                bestPrice = { market: marketName, total: result.total };
            }

            // Mayor disponibilidad
            if (result.availableCount > mostAvailable.count) {
                mostAvailable = { 
                    market: marketName, 
                    count: result.availableCount,
                    percentage: result.availability
                };
            }

            // Más cercano
            if (result.distance && result.distance < closest.distance) {
                closest = { market: marketName, distance: result.distance };
            }

            // Mejor valor (puntuación compuesta)
            const valueScore = this.calculateValueScore(result);
            if (valueScore > bestValue.score) {
                bestValue = { market: marketName, score: valueScore };
            }
        });

        // Calcular estadísticas adicionales
        const stats = Utils.calculateComparisonStats(this.results);

        return {
            bestPrice,
            mostAvailable,
            closest,
            bestValue,
            stats,
            marketCount: marketNames.length,
            averageDistance: this.calculateAverageDistance(),
            priceVariation: this.calculatePriceVariation()
        };
    }

    /**
     * Calcula puntuación de valor compuesta
     * @param {Object} result - Resultado de un supermercado
     * @returns {number} Puntuación de valor (0-100)
     */
    calculateValueScore(result) {
        if (result.availableCount === 0) return 0;

        const weights = APP_CONFIG.comparison.weights;
        let score = 0;

        // Puntuación por precio (inversamente proporcional)
        const priceScore = result.total > 0 ? 
            Math.max(0, (1 - (result.total / (this.metrics.bestPrice?.total * 1.5 || result.total))) * 100) : 0;
        score += priceScore * weights.price;

        // Puntuación por disponibilidad
        const availabilityScore = result.availability;
        score += availabilityScore * weights.availability;

        // Puntuación por distancia (si está disponible)
        if (result.distance && this.metrics.closest?.distance) {
            const distanceScore = Math.max(0, (1 - (result.distance / (this.metrics.closest.distance * 3))) * 100);
            score += distanceScore * weights.distance;
        }

        return Math.min(100, Math.max(0, score));
    }

    /**
     * Calcula la distancia promedio a todos los supermercados
     * @returns {number} Distancia promedio en km
     */
    calculateAverageDistance() {
        const distances = Object.values(this.results)
            .map(result => result.distance)
            .filter(distance => distance !== null);

        if (distances.length === 0) return null;

        return distances.reduce((sum, distance) => sum + distance, 0) / distances.length;
    }

    /**
     * Calcula la variación de precios entre supermercados
     * @returns {Object} Información sobre variación de precios
     */
    calculatePriceVariation() {
        const totals = Object.values(this.results)
            .map(result => result.total)
            .filter(total => total > 0);

        if (totals.length < 2) return null;

        const min = Math.min(...totals);
        const max = Math.max(...totals);
        const avg = totals.reduce((sum, total) => sum + total, 0) / totals.length;
        
        return {
            min,
            max,
            average: avg,
            range: max - min,
            coefficient: avg > 0 ? ((max - min) / avg) * 100 : 0 // Coeficiente de variación
        };
    }

    /**
     * Genera recomendaciones personalizadas
     * @returns {Object} Recomendaciones generadas
     */
    generateRecommendations() {
        const recommendations = {
            primary: null,
            alternatives: [],
            tips: [],
            warnings: []
        };

        // Recomendación principal basada en mejor valor
        if (this.metrics.bestValue && this.metrics.bestValue.market) {
            const primaryMarket = this.results[this.metrics.bestValue.market];
            recommendations.primary = {
                market: this.metrics.bestValue.market,
                reason: 'Mejor equilibrio entre precio, disponibilidad y distancia',
                score: this.metrics.bestValue.score,
                details: {
                    total: primaryMarket.total,
                    availability: primaryMarket.availability,
                    distance: primaryMarket.distance,
                    travelTime: primaryMarket.travelTime
                }
            };
        }

        // Recomendaciones alternativas
        const alternatives = [];

        // Opción más económica
        if (this.metrics.bestPrice && this.metrics.bestPrice.market !== this.metrics.bestValue?.market) {
            const cheapestMarket = this.results[this.metrics.bestPrice.market];
            alternatives.push({
                type: 'cheapest',
                market: this.metrics.bestPrice.market,
                reason: 'Precio más bajo',
                savings: this.metrics.stats?.totalSavings || 0,
                details: cheapestMarket
            });
        }

        // Opción con más productos disponibles
        if (this.metrics.mostAvailable && this.metrics.mostAvailable.market !== this.metrics.bestValue?.market) {
            const availableMarket = this.results[this.metrics.mostAvailable.market];
            alternatives.push({
                type: 'most_available',
                market: this.metrics.mostAvailable.market,
                reason: 'Mayor disponibilidad de productos',
                availability: this.metrics.mostAvailable.percentage,
                details: availableMarket
            });
        }

        // Opción más cercana
        if (this.metrics.closest && this.metrics.closest.market !== this.metrics.bestValue?.market) {
            const closestMarket = this.results[this.metrics.closest.market];
            alternatives.push({
                type: 'closest',
                market: this.metrics.closest.market,
                reason: 'Menor distancia de viaje',
                distance: this.metrics.closest.distance,
                details: closestMarket
            });
        }

        recommendations.alternatives = alternatives;

        // Generar consejos
        recommendations.tips = this.generateTips();

        // Generar advertencias
        recommendations.warnings = this.generateWarnings();

        return recommendations;
    }

    /**
     * Genera consejos útiles para el usuario
     * @returns {Array} Array de consejos
     */
    generateTips() {
        const tips = [];

        // Consejo sobre ahorro
        if (this.metrics.stats?.totalSavings > 1000) {
            tips.push({
                type: 'savings',
                icon: '💰',
                message: `Puedes ahorrar hasta ${Utils.formatPrice(this.metrics.stats.totalSavings, false)} eligiendo el supermercado más económico`,
                priority: 'high'
            });
        }

        // Consejo sobre distancia vs precio
        if (this.metrics.closest && this.metrics.bestPrice && 
            this.metrics.closest.market !== this.metrics.bestPrice.market) {
            const closestResult = this.results[this.metrics.closest.market];
            const cheapestResult = this.results[this.metrics.bestPrice.market];
            const priceDifference = closestResult.total - cheapestResult.total;
            
            if (priceDifference < 500) {
                tips.push({
                    type: 'distance_vs_price',
                    icon: '⚖️',
                    message: `La diferencia de precio es mínima (${priceDifference}). Considera ir al más cercano para ahorrar tiempo y combustible`,
                    priority: 'medium'
                });
            }
        }

        // Consejo sobre productos faltantes
        const totalMissing = Object.values(this.results)
            .reduce((total, result) => total + result.missingProducts.length, 0);
        
        if (totalMissing > 0) {
            tips.push({
                type: 'missing_products',
                icon: '🔍',
                message: 'Algunos productos no están disponibles. Considera visitar múltiples tiendas o buscar alternativas',
                priority: 'medium'
            });
        }

        // Consejo sobre compra inteligente
        if (Object.keys(this.results).length > 1) {
            tips.push({
                type: 'smart_shopping',
                icon: '🧠',
                message: 'Puedes comprar productos específicos en diferentes supermercados para maximizar ahorros',
                priority: 'low'
            });
        }

        return tips.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Genera advertencias importantes
     * @returns {Array} Array de advertencias
     */
    generateWarnings() {
        const warnings = [];

        // Advertencia sobre disponibilidad baja
        Object.entries(this.results).forEach(([marketName, result]) => {
            if (result.availability < 50) {
                warnings.push({
                    type: 'low_availability',
                    market: marketName,
                    icon: '⚠️',
                    message: `${marketName} tiene baja disponibilidad (${result.availability.toFixed(0)}% de productos)`,
                    severity: 'medium'
                });
            }
        });

        // Advertencia sobre precios altos
        if (this.metrics.priceVariation && this.metrics.priceVariation.coefficient > 30) {
            warnings.push({
                type: 'high_price_variation',
                icon: '📊',
                message: `Hay gran variación de precios entre supermercados (${this.metrics.priceVariation.coefficient.toFixed(0)}%)`,
                severity: 'low'
            });
        }

        // Advertencia sobre distancia
        Object.entries(this.results).forEach(([marketName, result]) => {
            if (result.distance && result.distance > 10) {
                warnings.push({
                    type: 'long_distance',
                    market: marketName,
                    icon: '🚗',
                    message: `${marketName} está lejos (${Utils.formatDistance(result.distance)}). Considera el costo de combustible`,
                    severity: 'low'
                });
            }
        });

        return warnings;
    }

    /**
     * Encuentra la mejor combinación de supermercados para maximizar ahorros
     * @returns {Object} Mejor combinación encontrada
     */
    findOptimalCombination() {
        const shoppingList = this.getShoppingListFromResults();
        if (shoppingList.length === 0) return null;

        const combinations = [];

        // Generar combinaciones posibles (máximo 2 supermercados)
        const marketNames = Object.keys(this.results);
        
        // Opción de un solo supermercado
        marketNames.forEach(primaryMarket => {
            const result = this.results[primaryMarket];
            if (result.availableCount > 0) {
                combinations.push({
                    markets: [primaryMarket],
                    total: result.total,
                    coverage: result.availability,
                    distance: result.distance || 0,
                    travelTime: result.travelTime || '0 min'
                });
            }
        });

        // Combinaciones de dos supermercados
        for (let i = 0; i < marketNames.length; i++) {
            for (let j = i + 1; j < marketNames.length; j++) {
                const combination = this.calculateCombinationResult(
                    marketNames[i], 
                    marketNames[j], 
                    shoppingList
                );
                if (combination.coverage > 80) { // Solo si cubre al menos 80% de productos
                    combinations.push(combination);
                }
            }
        }

        // Encontrar la mejor combinación
        return combinations.reduce((best, current) => {
            const currentScore = this.scoreCombination(current);
            const bestScore = this.scoreCombination(best);
            return currentScore > bestScore ? current : best;
        }, combinations[0] || null);
    }

    /**
     * Calcula el resultado de una combinación de dos supermercados
     * @param {string} market1 - Primer supermercado
     * @param {string} market2 - Segundo supermercado
     * @param {Array} shoppingList - Lista de compras
     * @returns {Object} Resultado de la combinación
     */
    calculateCombinationResult(market1, market2, shoppingList) {
        let total = 0;
        let coveredItems = 0;
        const allocation = { [market1]: [], [market2]: [] };

        shoppingList.forEach(item => {
            const result1 = this.results[market1].items.find(i => i.name === item.name);
            const result2 = this.results[market2].items.find(i => i.name === item.name);

            if (result1?.available && result2?.available) {
                // Ambos tienen el producto, elegir el más barato
                if (result1.unitPrice <= result2.unitPrice) {
                    total += result1.total;
                    allocation[market1].push(item);
                } else {
                    total += result2.total;
                    allocation[market2].push(item);
                }
                coveredItems++;
            } else if (result1?.available) {
                total += result1.total;
                allocation[market1].push(item);
                coveredItems++;
            } else if (result2?.available) {
                total += result2.total;
                allocation[market2].push(item);
                coveredItems++;
            }
        });

        // Calcular distancia total (asumiendo que va a ambos)
        const totalDistance = (this.results[market1].distance || 0) + 
                             (this.results[market2].distance || 0);

        return {
            markets: [market1, market2],
            total,
            coverage: (coveredItems / shoppingList.length) * 100,
            distance: totalDistance,
            allocation,
            travelTime: Utils.estimateTravelTime(totalDistance, 'driving')
        };
    }

    /**
     * Asigna puntuación a una combinación
     * @param {Object} combination - Combinación a evaluar
     * @returns {number} Puntuación de la combinación
     */
    scoreCombination(combination) {
        if (!combination) return 0;

        let score = 0;
        
        // Puntuación por cobertura (40%)
        score += combination.coverage * 0.4;
        
        // Puntuación por precio (inversamente proporcional) (40%)
        const bestSingleTotal = Math.min(...Object.values(this.results).map(r => r.total).filter(t => t > 0));
        if (bestSingleTotal > 0) {
            const priceScore = Math.max(0, (1 - (combination.total / (bestSingleTotal * 1.3))) * 100);
            score += priceScore * 0.4;
        }
        
        // Penalización por distancia (20%)
        const avgDistance = this.calculateAverageDistance();
        if (avgDistance && combination.distance > 0) {
            const distancePenalty = Math.min(20, (combination.distance / avgDistance) * 10);
            score -= distancePenalty;
        }

        return Math.max(0, score);
    }

    /**
     * Obtiene la lista de compras desde los resultados
     * @returns {Array} Lista de compras
     */
    getShoppingListFromResults() {
        if (Object.keys(this.results).length === 0) return [];

        const firstResult = Object.values(this.results)[0];
        return firstResult.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            category: item.category
        }));
    }

    /**
     * Exporta los resultados de la comparación
     * @param {string} format - Formato de exportación
     * @returns {string} Datos exportados
     */
    exportResults(format = 'txt') {
        const exportData = {
            timestamp: new Date().toISOString(),
            results: this.results,
            metrics: this.metrics,
            recommendations: this.recommendations
        };

        return Utils.exportResults(exportData, format);
    }

    /**
     * Obtiene estadísticas detalladas de la comparación
     * @returns {Object} Estadísticas detalladas
     */
    getDetailedStats() {
        return {
            totalComparisons: Object.keys(this.results).length,
            totalProducts: this.getShoppingListFromResults().length,
            averageAvailability: this.calculateAverageAvailability(),
            priceRange: this.metrics.priceVariation,
            distanceStats: this.calculateDistanceStats(),
            categoryBreakdown: this.getCategoryBreakdown()
        };
    }

    /**
     * Calcula disponibilidad promedio
     * @returns {number} Disponibilidad promedio
     */
    calculateAverageAvailability() {
        const availabilities = Object.values(this.results).map(r => r.availability);
        return availabilities.length > 0 ? 
            availabilities.reduce((sum, avail) => sum + avail, 0) / availabilities.length : 0;
    }

    /**
     * Calcula estadísticas de distancia
     * @returns {Object} Estadísticas de distancia
     */
    calculateDistanceStats() {
        const distances = Object.values(this.results)
            .map(r => r.distance)
            .filter(d => d !== null && d !== undefined);

        if (distances.length === 0) return null;

        return {
            min: Math.min(...distances),
            max: Math.max(...distances),
            average: distances.reduce((sum, d) => sum + d, 0) / distances.length,
            total: distances.reduce((sum, d) => sum + d, 0)
        };
    }

    /**
     * Obtiene breakdown por categorías
     * @returns {Object} Breakdown por categorías
     */
    getCategoryBreakdown() {
        const breakdown = {};
        const shoppingList = this.getShoppingListFromResults();

        shoppingList.forEach(item => {
            if (!breakdown[item.category]) {
                breakdown[item.category] = {
                    count: 0,
                    totalQuantity: 0,
                    availableIn: []
                };
            }
            breakdown[item.category].count++;
            breakdown[item.category].totalQuantity += item.quantity;

            // Verificar en qué supermercados está disponible
            Object.entries(this.results).forEach(([marketName, result]) => {
                const marketItem = result.items.find(i => i.name === item.name);
                if (marketItem?.available) {
                    breakdown[item.category].availableIn.push(marketName);
                }
            });
        });

        return breakdown;
    }

    /**
     * Resetea todos los resultados
     */
    reset() {
        this.results = {};
        this.metrics = {};
        this.recommendations = {};
        this.isComparing = false;
        AppEvents.emit('comparison-reset');
    }
}

// Instancia global del motor de comparación
let ComparisonEngine_instance = null;

/**
 * Inicializa el motor de comparación
 * @returns {ComparisonEngine} Instancia del motor
 */
function initializeComparisonEngine() {
    if (!ComparisonEngine_instance) {
        ComparisonEngine_instance = new ComparisonEngine();
        console.log('ComparisonEngine inicializado');
    }
    return ComparisonEngine_instance;
}

/**
 * Obtiene la instancia actual del motor de comparación
 * @returns {ComparisonEngine|null} Instancia actual
 */
function getComparisonInstance() {
    return ComparisonEngine_instance;
}

/**
 * Clase para manejo de la visualización de resultados
 */
class ResultsRenderer {
    constructor() {
        this.container = document.getElementById('resultsSection');
        this.metricsContainer = document.getElementById('metricsCards');
        this.tableContainer = document.getElementById('comparisonTable');
        this.recommendationsContainer = document.getElementById('recommendations');
    }

    /**
     * Renderiza los resultados completos
     * @param {Object} comparisonData - Datos de la comparación
     */
    render(comparisonData) {
        const { results, metrics, recommendations } = comparisonData;

        // Mostrar sección de resultados
        this.container.style.display = 'block';
        this.container.scrollIntoView({ behavior: 'smooth' });

        // Renderizar cada sección
        this.renderMetricsCards(metrics);
        this.renderComparisonTable(results, metrics);
        this.renderRecommendations(recommendations, results);

        // Agregar botones de acción
        this.addActionButtons(comparisonData);
    }

    /**
     * Renderiza las tarjetas de métricas
     * @param {Object} metrics - Métricas calculadas
     */
    renderMetricsCards(metrics) {
        const hasDistance = metrics.closest && metrics.closest.distance < Infinity;
        
        let cardsHTML = '<div class="metrics-grid">';

        // Mejor precio
        if (metrics.bestPrice && metrics.bestPrice.total < Infinity) {
            cardsHTML += `
                <div class="metric-card">
                    <div class="metric-value">🏆</div>
                    <div class="metric-label">Mejor Precio Total</div>
                    <div class="metric-detail">${metrics.bestPrice.market}</div>
                    <div>${Utils.formatPrice(metrics.bestPrice.total)}</div>
                </div>
            `;
        }

        // Mayor disponibilidad
        if (metrics.mostAvailable && metrics.mostAvailable.count > 0) {
            cardsHTML += `
                <div class="metric-card">
                    <div class="metric-value">📦</div>
                    <div class="metric-label">Más Productos Disponibles</div>
                    <div class="metric-detail">${metrics.mostAvailable.market}</div>
                    <div>${metrics.mostAvailable.count} productos (${metrics.mostAvailable.percentage.toFixed(0)}%)</div>
                </div>
            `;
        }

        // Más cercano (si hay datos de distancia)
        if (hasDistance) {
            cardsHTML += `
                <div class="metric-card">
                    <div class="metric-value">🗺️</div>
                    <div class="metric-label">Más Cercano</div>
                    <div class="metric-detail">${metrics.closest.market}</div>
                    <div>${Utils.formatDistance(metrics.closest.distance)}</div>
                </div>
            `;
        }

        // Mejor valor general
        if (metrics.bestValue && metrics.bestValue.score > 0) {
            cardsHTML += `
                <div class="metric-card">
                    <div class="metric-value">⭐</div>
                    <div class="metric-label">Mejor Opción General</div>
                    <div class="metric-detail">${metrics.bestValue.market}</div>
                    <div>Puntuación: ${metrics.bestValue.score.toFixed(0)}/100</div>
                </div>
            `;
        }

        cardsHTML += '</div>';
        this.metricsContainer.innerHTML = cardsHTML;
    }

    /**
     * Renderiza la tabla de comparación
     * @param {Object} results - Resultados de comparación
     * @param {Object} metrics - Métricas calculadas
     */
    renderComparisonTable(results, metrics) {
        const marketNames = Object.keys(results);
        const shoppingList = ComparisonEngine_instance.getShoppingListFromResults();

        let tableHTML = `
            <thead>
                <tr>
                    <th>Producto</th>
                    ${marketNames.map(name => `<th>${name}</th>`).join('')}
                    <th>Mejor Precio</th>
                </tr>
            </thead>
            <tbody>
        `;

        // Filas de productos
        shoppingList.forEach(shoppingItem => {
            tableHTML += '<tr>';
            tableHTML += `
                <td class="product-cell">
                    <div class="product-info">
                        <strong>${Utils.capitalizeWords(shoppingItem.name)}</strong>
                        <small>x${shoppingItem.quantity}</small>
                        <div class="product-category">
                            ${PRODUCT_CATEGORIES[shoppingItem.category]?.icon || '📦'} 
                            ${PRODUCT_CATEGORIES[shoppingItem.category]?.name || shoppingItem.category}
                        </div>
                    </div>
                </td>
            `;

            // Encontrar mejor precio para este producto
            let bestPrice = Infinity;
            let bestMarket = '';
            const productPrices = {};

            marketNames.forEach(marketName => {
                const item = results[marketName].items.find(i => i.name === shoppingItem.name);
                if (item && item.available) {
                    productPrices[marketName] = item.total;
                    if (item.total < bestPrice) {
                        bestPrice = item.total;
                        bestMarket = marketName;
                    }
                }
            });

            // Renderizar precios por supermercado
            marketNames.forEach(marketName => {
                const item = results[marketName].items.find(i => i.name === shoppingItem.name);
                if (item && item.available) {
                    const isBest = item.total === bestPrice;
                    tableHTML += `
                        <td class="${isBest ? 'best-price' : ''}">
                            ${Utils.formatPrice(item.total)}
                            <small>${Utils.formatPrice(item.unitPrice)}/u</small>
                        </td>
                    `;
                } else {
                    tableHTML += '<td class="unavailable">No disponible</td>';
                }
            });

            tableHTML += `<td><span class="winner-badge">${bestMarket || 'N/A'}</span></td>`;
            tableHTML += '</tr>';
        });

        // Fila de totales
        tableHTML += `
            <tr class="total-row">
                <td><strong>TOTAL GENERAL</strong></td>
                ${marketNames.map(marketName => {
                    const result = results[marketName];
                    const isBest = result.total === metrics.bestPrice.total && result.availableCount > 0;
                    return `
                        <td class="${isBest ? 'best-price' : ''}">
                            <strong>${Utils.formatPrice(result.total)}</strong>
                            <small>${result.availableCount}/${shoppingList.length} productos</small>
                            ${result.distance ? `<br><small>${Utils.formatDistance(result.distance)}</small>` : ''}
                        </td>
                    `;
                }).join('')}
                <td><span class="winner-badge">${metrics.bestPrice.market}</span></td>
            </tr>
        `;

        tableHTML += '</tbody>';
        this.tableContainer.innerHTML = tableHTML;
    }

    /**
     * Renderiza las recomendaciones
     * @param {Object} recommendations - Recomendaciones generadas
     * @param {Object} results - Resultados de comparación
     */
    renderRecommendations(recommendations, results) {
        let html = '';

        // Recomendación principal
        if (recommendations.primary) {
            const primary = recommendations.primary;
            html += `
                <div class="recommendation-main">
                    <h3><i class="fas fa-star"></i> Recomendación Principal</h3>
                    <p><strong>${primary.market}</strong> es tu mejor opción</p>
                    <p>${primary.reason}</p>
                    <div style="margin-top: 15px; display: flex; justify-content: space-around; flex-wrap: wrap;">
                        <div><strong>Total:</strong> ${Utils.formatPrice(primary.details.total)}</div>
                        <div><strong>Disponibilidad:</strong> ${primary.details.availability.toFixed(0)}%</div>
                        ${primary.details.distance ? `<div><strong>Distancia:</strong> ${Utils.formatDistance(primary.details.distance)}</div>` : ''}
                        <div><strong>Puntuación:</strong> ${primary.score.toFixed(0)}/100</div>
                    </div>
                </div>
            `;
        }

        // Alternativas
        if (recommendations.alternatives.length > 0) {
            html += '<div class="recommendations-grid">';
            
            recommendations.alternatives.forEach(alt => {
                const isRecommended = alt.market === recommendations.primary?.market;
                
                html += `
                    <div class="recommendation-card ${isRecommended ? 'recommended' : ''}">
                        <h4>${this.getAlternativeIcon(alt.type)} ${alt.market}</h4>
                        <p><strong>${alt.reason}</strong></p>
                        <div class="recommendation-details">
                            <p>Total: ${Utils.formatPrice(alt.details.total)}</p>
                            <p>Disponibilidad: ${alt.details.availability.toFixed(0)}%</p>
                            ${alt.details.distance ? `<p>Distancia: ${Utils.formatDistance(alt.details.distance)}</p>` : ''}
                        </div>
                        ${alt.details.missingProducts.length > 0 ? `
                        <div class="missing-products">
                            <strong>Productos faltantes:</strong><br>
                            ${alt.details.missingProducts.slice(0, 3).join(', ')}
                            ${alt.details.missingProducts.length > 3 ? '...' : ''}
                        </div>
                        ` : ''}
                    </div>
                `;
            });
            
            html += '</div>';
        }

        // Consejos y advertencias
        if (recommendations.tips.length > 0 || recommendations.warnings.length > 0) {
            html += '<div class="tips-section">';
            html += '<h4><i class="fas fa-lightbulb"></i> Consejos Adicionales</h4>';
            
            if (recommendations.tips.length > 0) {
                html += '<ul>';
                recommendations.tips.forEach(tip => {
                    html += `<li>${tip.icon} ${tip.message}</li>`;
                });
                html += '</ul>';
            }

            if (recommendations.warnings.length > 0) {
                html += '<div style="margin-top: 15px;"><strong>⚠️ Consideraciones:</strong><ul>';
                recommendations.warnings.forEach(warning => {
                    html += `<li>${warning.icon} ${warning.message}</li>`;
                });
                html += '</ul></div>';
            }

            html += '</div>';
        }

        this.recommendationsContainer.innerHTML = html;
    }

    /**
     * Obtiene el icono para el tipo de alternativa
     * @param {string} type - Tipo de alternativa
     * @returns {string} Icono correspondiente
     */
    getAlternativeIcon(type) {
        const icons = {
            'cheapest': '💰',
            'most_available': '📦',
            'closest': '🗺️',
            'best_value': '⭐'
        };
        return icons[type] || '🏪';
    }

    /**
     * Agrega botones de acción a los resultados
     * @param {Object} comparisonData - Datos de la comparación
     */
    addActionButtons(comparisonData) {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'actions-container';
        actionsContainer.style.cssText = 'margin-top: 25px; text-align: center; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;';

        actionsContainer.innerHTML = `
            <button class="btn btn-info" onclick="ResultsRenderer.exportResults('txt')">
                <i class="fas fa-download"></i> Exportar Resultados
            </button>
            <button class="btn btn-primary" onclick="ResultsRenderer.showDetailedStats()">
                <i class="fas fa-chart-bar"></i> Ver Estadísticas
            </button>
            <button class="btn btn-warning" onclick="ResultsRenderer.newComparison()">
                <i class="fas fa-redo"></i> Nueva Comparación
            </button>
        `;

        this.recommendationsContainer.appendChild(actionsContainer);
    }

    /**
     * Exporta los resultados
     * @param {string} format - Formato de exportación
     */
    exportResults(format = 'txt') {
        if (!ComparisonEngine_instance) return;
        
        const data = ComparisonEngine_instance.exportResults(format);
        const filename = `comparacion_supermercados_${new Date().toISOString().split('T')[0]}.${format}`;
        Utils.downloadFile(data, filename);
        Utils.showNotification('Resultados exportados', 'success');
    }

    /**
     * Muestra estadísticas detalladas
     */
    showDetailedStats() {
        if (!ComparisonEngine_instance) return;
        
        const stats = ComparisonEngine_instance.getDetailedStats();
        
        Swal.fire({
            title: 'Estadísticas Detalladas',
            html: this.generateStatsHTML(stats),
            width: 600,
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#667eea'
        });
    }

    /**
     * Genera HTML para estadísticas
     * @param {Object} stats - Estadísticas
     * @returns {string} HTML generado
     */
    generateStatsHTML(stats) {
        let html = '<div style="text-align: left;">';
        
        html += `<p><strong>Supermercados comparados:</strong> ${stats.totalComparisons}</p>`;
        html += `<p><strong>Productos en lista:</strong> ${stats.totalProducts}</p>`;
        html += `<p><strong>Disponibilidad promedio:</strong> ${stats.averageAvailability.toFixed(1)}%</p>`;
        
        if (stats.priceRange) {
            html += `<p><strong>Variación de precios:</strong> ${stats.priceRange.coefficient.toFixed(1)}%</p>`;
        }
        
        if (stats.distanceStats) {
            html += `<p><strong>Distancia promedio:</strong> ${Utils.formatDistance(stats.distanceStats.average)}</p>`;
        }

        html += '</div>';
        return html;
    }

    /**
     * Inicia una nueva comparación
     */
    newComparison() {
        // Limpiar resultados
        this.container.style.display = 'none';
        
        // Resetear motor de comparación
        if (ComparisonEngine_instance) {
            ComparisonEngine_instance.reset();
        }
        
        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        Utils.showNotification('Listo para nueva comparación', 'info');
    }
}

/**
 * Inicializa el renderizador de resultados
 * @returns {ResultsRenderer} Instancia del renderizador
 */
function initializeResultsRenderer() {
    if (!ResultsRenderer_instance) {
        ResultsRenderer_instance = new ResultsRenderer();
        console.log('ResultsRenderer inicializado');
    }
    return ResultsRenderer_instance;
}

// Funciones globales para botones
window.ResultsRenderer = {
    exportResults: (format) => ResultsRenderer_instance?.exportResults(format),
    showDetailedStats: () => ResultsRenderer_instance?.showDetailedStats(),
    newComparison: () => ResultsRenderer_instance?.newComparison()
};

// Exportar para uso en otros módulos
if (typeof window !== 'undefined') {
    window.initializeComparisonEngine = initializeComparisonEngine;
    window.getComparisonInstance = getComparisonInstance;
    window.initializeResultsRenderer = initializeResultsRenderer;
}