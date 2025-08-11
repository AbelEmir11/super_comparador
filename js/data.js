/**
 * Datos de supermercados con productos y ubicaciones
 * Estructura modular para fácil mantenimiento y escalabilidad
 */

const SUPERMARKETS_DATA = {
    'Átomo': {
        id: 'atomo',
        location: { 
            lat: -32.8908, 
            lng: -68.8439 
        },
        address: 'Av. San Martín 1234, Mendoza',
        phone: '+54 261 123-4567',
        hours: {
            weekdays: '08:00 - 22:00',
            saturday: '08:00 - 22:00',
            sunday: '09:00 - 21:00'
        },
        products: [
            {
                id: 'leche_entera_1l',
                name: "Leche Entera 1L",
                brand: "La Lechera",
                price: 1350,
                available: true,
                category: "lácteos",
                barcode: "7790895001234"
            },
            {
                id: 'arroz_largo_1kg',
                name: "Arroz Largo Fino 1Kg",
                brand: "Molinos Río de la Plata",
                price: 1400,
                available: true,
                category: "almacén",
                barcode: "7790895001235"
            },
            {
                id: 'carne_picada_1kg',
                name: "Carne Picada Común 1Kg",
                brand: "Átomo",
                price: 3500,
                available: true,
                category: "carnicería",
                barcode: "7790895001236"
            },
            {
                id: 'detergente_750ml',
                name: "Detergente 750ml",
                brand: "Cif",
                price: 1000,
                available: true,
                category: "limpieza",
                barcode: "7790895001237"
            },
            {
                id: 'tomate_redondo_1kg',
                name: "Tomate Redondo 1Kg",
                brand: "N/A",
                price: 900,
                available: true,
                category: "verdulería",
                barcode: "7790895001238"
            },
            {
                id: 'yogur_bebible_200ml',
                name: "Yogur Bebible Frutilla 200ml",
                brand: "Yogurisimo",
                price: 430,
                available: true,
                category: "lácteos",
                barcode: "7790895001239"
            },
            {
                id: 'aceite_girasol_900ml',
                name: "Aceite de Girasol 900ml",
                brand: "Girasol",
                price: 1700,
                available: true,
                category: "almacén",
                barcode: "7790895001240"
            },
            {
                id: 'shampoo_1l',
                name: "Shampoo Familiar 1L",
                brand: "Head & Shoulders",
                price: 2500,
                available: true,
                category: "higiene",
                barcode: "7790895001241"
            }
        ]
    },
    'Oscar David': {
        id: 'oscardavid',
        location: { 
            lat: -32.8851, 
            lng: -68.8444 
        },
        address: 'Calle Rivadavia 567, Mendoza',
        phone: '+54 261 234-5678',
        hours: {
            weekdays: '07:30 - 23:00',
            saturday: '07:30 - 23:00',
            sunday: '08:00 - 22:00'
        },
        products: [
            {
                id: 'leche_entera_1l',
                name: "Leche Entera 1L",
                brand: "Yogurisimo",
                price: 1550,
                available: true,
                category: "lácteos",
                barcode: "7790895001242"
            },
            {
                id: 'arroz_largo_1kg',
                name: "Arroz Largo Fino 1Kg",
                brand: "Tio Carlos",
                price: 1800,
                available: true,
                category: "almacén",
                barcode: "7790895001243"
            },
            {
                id: 'carne_picada_1kg',
                name: "Carne Picada Común 1Kg",
                brand: "N/A",
                price: 3800,
                available: true,
                category: "carnicería",
                barcode: "7790895001244"
            },
            {
                id: 'detergente_750ml',
                name: "Detergente 750ml",
                brand: "Mr Músculo",
                price: 2800,
                available: true,
                category: "limpieza",
                barcode: "7790895001245"
            },
            {
                id: 'tomate_redondo_1kg',
                name: "Tomate Redondo 1Kg",
                brand: "N/A",
                price: 1000,
                available: true,
                category: "verdulería",
                barcode: "7790895001246"
            },
            {
                id: 'yogur_bebible_200ml',
                name: "Yogur Bebible Frutilla 200ml",
                brand: "Sancor",
                price: 500,
                available: true,
                category: "lácteos",
                barcode: "7790895001247"
            },
            {
                id: 'aceite_girasol_900ml',
                name: "Aceite de Girasol 900ml",
                brand: "Natura",
                price: 1230,
                available: true,
                category: "almacén",
                barcode: "7790895001248"
            },
            {
                id: 'shampoo_1l',
                name: "Shampoo Familiar 1L",
                brand: "Plusbelle",
                price: 1100,
                available: true,
                category: "higiene",
                barcode: "7790895001249"
            },
            {
                id: 'leche_chocolatada_1l',
                name: "Leche Chocolatada 1L",
                brand: "N/A",
                price: 1800,
                available: true,
                category: "lácteos",
                barcode: "7790895001250"
            },
            {
                id: 'fideos_500g',
                name: "Fideos Espaguetti 500g",
                brand: "N/A",
                price: 950,
                available: true,
                category: "almacén",
                barcode: "7790895001251"
            },
            {
                id: 'pechuga_pollo_1kg',
                name: "Pechuga de Pollo 1Kg",
                brand: "N/A",
                price: 3500,
                available: true,
                category: "carnicería",
                barcode: "7790895001252"
            },
            {
                id: 'jabon_barra_200g',
                name: "Jabón en Barra 200g",
                brand: "N/A",
                price: 600,
                available: true,
                category: "limpieza",
                barcode: "7790895001253"
            },
            {
                id: 'cebolla_1kg',
                name: "Cebolla 1Kg",
                brand: "N/A",
                price: 800,
                available: true,
                category: "verdulería",
                barcode: "7790895001254"
            },
            {
                id: 'yogur_natural_1kg',
                name: "Yogur Natural 1Kg",
                brand: "N/A",
                price: 1200,
                available: true,
                category: "lácteos",
                barcode: "7790895001255"
            },
            {
                id: 'azucar_1kg',
                name: "Azúcar 1Kg",
                brand: "N/A",
                price: 900,
                available: true,
                category: "almacén",
                barcode: "7790895001256"
            }
        ]
    },
    'VEA': {
        id: 'vea',
        location: { 
            lat: -32.8876, 
            lng: -68.8456 
        },
        address: 'Av. Las Heras 890, Mendoza',
        phone: '+54 261 345-6789',
        hours: {
            weekdays: '08:00 - 22:30',
            saturday: '08:00 - 22:30',
            sunday: '09:00 - 22:00'
        },
        products: [
            {
                id: 'leche_entera_1l',
                name: "Leche Entera 1L",
                brand: "La Serenísima",
                price: 1550,
                available: true,
                category: "lácteos",
                barcode: "7790895001257"
            },
            {
                id: 'arroz_largo_1kg',
                name: "Arroz Largo Fino 1Kg",
                brand: "Molinos Ala",
                price: 1400,
                available: true,
                category: "almacén",
                barcode: "7790895001258"
            },
            {
                id: 'carne_picada_1kg',
                name: "Carne Picada Común 1Kg",
                brand: "Swift",
                price: 4500,
                available: true,
                category: "carnicería",
                barcode: "7790895001259"
            },
            {
                id: 'detergente_750ml',
                name: "Detergente 750ml",
                brand: "Ala",
                price: 1800,
                available: true,
                category: "limpieza",
                barcode: "7790895001260"
            },
            {
                id: 'tomate_redondo_1kg',
                name: "Tomate Redondo 1Kg",
                brand: "N/A",
                price: 900,
                available: true,
                category: "verdulería",
                barcode: "7790895001261"
            },
            {
                id: 'yogur_bebible_200ml',
                name: "Yogur Bebible Frutilla 200ml",
                brand: "Sancor",
                price: 300,
                available: true,
                category: "lácteos",
                barcode: "7790895001262"
            },
            {
                id: 'aceite_girasol_900ml',
                name: "Aceite de Girasol 900ml",
                brand: "Natura",
                price: 1800,
                available: true,
                category: "almacén",
                barcode: "7790895001263"
            },
            {
                id: 'shampoo_1l',
                name: "Shampoo Familiar 1L",
                brand: "Sedal",
                price: 2000,
                available: true,
                category: "higiene",
                barcode: "7790895001264"
            },
            {
                id: 'pechuga_pollo_1kg',
                name: "Pechuga de Pollo 1Kg",
                brand: "N/A",
                price: 3500,
                available: true,
                category: "carnicería",
                barcode: "7790895001265"
            },
            {
                id: 'jabon_barra_200g',
                name: "Jabón en Barra 200g",
                brand: "Cif",
                price: 500,
                available: true,
                category: "limpieza",
                barcode: "7790895001266"
            },
            {
                id: 'lechuga_1kg',
                name: "Lechuga 1Kg",
                brand: "N/A",
                price: 1600,
                available: true,
                category: "verdulería",
                barcode: "7790895001267"
            },
            {
                id: 'galletas_agua_200g',
                name: "Galletas de Agua 200g",
                brand: "Terrabusi",
                price: 1400,
                available: true,
                category: "almacén",
                barcode: "7790895001268"
            },
            {
                id: 'queso_crema_200g',
                name: "Queso Crema 200g",
                brand: "La Serenísima",
                price: 800,
                available: true,
                category: "lácteos",
                barcode: "7790895001269"
            }
        ]
    }
};

/**
 * Categorías de productos disponibles
 */
const PRODUCT_CATEGORIES = {
    'lácteos': {
        name: 'Lácteos',
        icon: '🥛',
        color: '#e3f2fd'
    },
    'almacén': {
        name: 'Almacén',
        icon: '🏪',
        color: '#f3e5f5'
    },
    'carnicería': {
        name: 'Carnicería',
        icon: '🥩',
        color: '#ffebee'
    },
    'limpieza': {
        name: 'Limpieza',
        icon: '🧽',
        color: '#e8f5e8'
    },
    'verdulería': {
        name: 'Verdulería',
        icon: '🥕',
        color: '#fff3e0'
    },
    'higiene': {
        name: 'Higiene Personal',
        icon: '🧴',
        color: '#e0f2f1'
    }
};

/**
 * Configuración de la aplicación
 */
const APP_CONFIG = {
    defaultLocation: {
        lat: -32.8895,
        lng: -68.8458
    },
    mapZoom: {
        default: 13,
        detailed: 15
    },
    searchOptions: {
        minSearchLength: 2,
        maxSuggestions: 10,
        fuzzySearch: true
    },
    comparison: {
        weights: {
            price: 0.4,
            availability: 0.4,
            distance: 0.2
        }
    }
};

/**
 * Funciones utilitarias para manejo de datos
 */
const DataUtils = {
    /**
     * Obtiene todos los productos únicos de todos los supermercados
     * @returns {Array} Lista de productos únicos
     */
    getAllUniqueProducts() {
        const allProducts = [];
        const productMap = new Map();

        Object.values(SUPERMARKETS_DATA).forEach(supermarket => {
            supermarket.products.forEach(product => {
                if (!productMap.has(product.id)) {
                    productMap.set(product.id, {
                        id: product.id,
                        name: product.name,
                        category: product.category,
                        availableIn: []
                    });
                }
                productMap.get(product.id).availableIn.push(supermarket.id);
            });
        });

        return Array.from(productMap.values());
    },

    /**
     * Busca productos por nombre o categoría
     * @param {string} query - Término de búsqueda
     * @returns {Array} Productos que coinciden con la búsqueda
     */
    searchProducts(query) {
        if (!query || query.length < APP_CONFIG.searchOptions.minSearchLength) {
            return [];
        }

        const results = [];
        const searchTerm = query.toLowerCase().trim();

        Object.values(SUPERMARKETS_DATA).forEach(supermarket => {
            supermarket.products.forEach(product => {
                const matchesName = product.name.toLowerCase().includes(searchTerm);
                const matchesCategory = product.category.toLowerCase().includes(searchTerm);
                const matchesBrand = product.brand && product.brand.toLowerCase().includes(searchTerm);

                if (matchesName || matchesCategory || matchesBrand) {
                    const existingProduct = results.find(p => p.name === product.name);
                    if (!existingProduct) {
                        results.push({
                            ...product,
                            supermarket: supermarket.id,
                            supermarketName: Object.keys(SUPERMARKETS_DATA).find(key => 
                                SUPERMARKETS_DATA[key].id === supermarket.id
                            )
                        });
                    }
                }
            });
        });

        return results.slice(0, APP_CONFIG.searchOptions.maxSuggestions);
    },

    /**
     * Obtiene información de un supermercado por ID
     * @param {string} supermarketId - ID del supermercado
     * @returns {Object|null} Información del supermercado
     */
    getSupermarketById(supermarketId) {
        return Object.values(SUPERMARKETS_DATA).find(s => s.id === supermarketId) || null;
    },

    /**
     * Obtiene información de un supermercado por nombre
     * @param {string} supermarketName - Nombre del supermercado
     * @returns {Object|null} Información del supermercado
     */
    getSupermarketByName(supermarketName) {
        return SUPERMARKETS_DATA[supermarketName] || null;
    },

    /**
     * Valida si existe un producto en un supermercado específico
     * @param {string} productName - Nombre del producto
     * @param {string} supermarketName - Nombre del supermercado
     * @returns {Object|null} Producto si existe, null si no
     */
    getProductInSupermarket(productName, supermarketName) {
        const supermarket = this.getSupermarketByName(supermarketName);
        if (!supermarket) return null;

        return supermarket.products.find(product => 
            product.name.toLowerCase() === productName.toLowerCase()
        ) || null;
    },

    /**
     * Obtiene estadísticas generales de los datos
     * @returns {Object} Estadísticas de productos y supermercados
     */
    getStats() {
        const totalSupermarkets = Object.keys(SUPERMARKETS_DATA).length;
        let totalProducts = 0;
        const categoryCount = {};

        Object.values(SUPERMARKETS_DATA).forEach(supermarket => {
            totalProducts += supermarket.products.length;
            
            supermarket.products.forEach(product => {
                categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
            });
        });

        return {
            totalSupermarkets,
            totalProducts,
            uniqueProducts: this.getAllUniqueProducts().length,
            categoriesCount: Object.keys(categoryCount).length,
            categoryBreakdown: categoryCount
        };
    }
};

// Exportar para uso en otros módulos (en navegador se accede globalmente)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPERMARKETS_DATA,
        PRODUCT_CATEGORIES,
        APP_CONFIG,
        DataUtils
    };
}