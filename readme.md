# 🛒 Comparador de Supermercados

Una aplicación web moderna para comparar precios, disponibilidad y distancias entre diferentes supermercados, ayudando a los usuarios a tomar la mejor decisión de compra.

## 🚀 Características Principales

### ✨ Funcionalidades Core
- **Comparación Inteligente**: Algoritmo que considera precio, disponibilidad y distancia
- **Lista de Compras Dinámica**: Agregar, editar y gestionar productos fácilmente
- **Geolocalización**: Integración con GPS y mapas interactivos
- **Recomendaciones Personalizadas**: Sugerencias basadas en múltiples factores
- **Exportación de Resultados**: Descarga comparaciones en diferentes formatos

### 🎯 Análisis Avanzado
- **Puntuación Compuesta**: Sistema de scoring que balancea todos los factores
- **Métricas Detalladas**: Estadísticas completas de cada comparación
- **Alertas Inteligentes**: Notificaciones sobre ahorros y consideraciones importantes
- **Combinaciones Óptimas**: Sugerencias para comprar en múltiples tiendas

### 📱 Experiencia de Usuario
- **Diseño Responsivo**: Funciona perfectamente en móviles y desktop
- **Interfaz Moderna**: Diseño atractivo con animaciones y micro-interactions
- **Búsqueda Inteligente**: Autocompletado y sugerencias en tiempo real
- **Accesibilidad**: Cumple estándares de accesibilidad web

## 🏗️ Arquitectura del Proyecto

```
comparador-supermercados/
├── index.html                 # Estructura HTML principal
├── css/
│   ├── styles.css            # Estilos principales y layout
│   └── components.css        # Componentes específicos y UI
├── js/
│   ├── app.js               # Controlador principal de la aplicación
│   ├── data.js              # Datos de supermercados y configuración
│   ├── utils.js             # Utilidades y funciones auxiliares
│   ├── map.js               # Gestión de mapas y geolocalización
│   ├── shopping-list.js     # Manejo de lista de compras
│   └── comparison.js        # Motor de comparación y análisis
└── README.md                # Este archivo
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica moderna
- **CSS3**: Flexbox, Grid, Custom Properties, Animaciones
- **JavaScript ES6+**: Módulos, Clases, Async/Await, APIs modernas

### Bibliotecas Externas
- **Leaflet**: Mapas interactivos y geolocalización
- **SweetAlert2**: Alertas y notificaciones elegantes
- **Font Awesome**: Iconografía profesional

### APIs y Servicios
- **Geolocation API**: Ubicación del usuario
- **OpenStreetMap**: Tiles de mapas gratuitos

## 📦 Instalación y Deployment

### Método 1: Deployment Simple
1. Descarga todos los archivos manteniendo la estructura de carpetas
2. Sube a cualquier hosting estático (GitHub Pages, Netlify, Vercel)
3. ¡Listo! La aplicación funcionará inmediatamente

### Método 2: Desarrollo Local
```bash
# Clona o descarga el proyecto
git clone [tu-repositorio]

# Sirve los archivos (puedes usar cualquier servidor estático)
# Con Python:
python -m http.server 8000

# Con Node.js (http-server):
npx http-server

# Con PHP:
php -S localhost:8000
```

### Método 3: GitHub Pages
1. Sube el código a un repositorio de GitHub
2. Ve a Settings > Pages
3. Selecciona la rama main como source
4. ¡Tu aplicación estará disponible en segundos!

## 🎮 Cómo Usar

### Paso 1: Agregar Productos
- Escribe nombres de productos en el campo de texto
- Separa múltiples productos con comas: "leche, pan, arroz"
- Usa las sugerencias automáticas para encontrar productos rápidamente

### Paso 2: Configurar Ubicación (Opcional)
- Usa el botón "Usar Mi Ubicación" para GPS automático
- O ingresa tu dirección manualmente
- El mapa mostrará tu ubicación y los supermercados cercanos

### Paso 3: Comparar
- Haz click en "Comparar Precios"
- Revisa los resultados detallados
- Sigue las recomendaciones personalizadas

## ⚙️ Configuración

### Agregar Nuevos Supermercados
Edita el archivo `js/data.js` y agrega nuevos supermercados al objeto `SUPERMARKETS_DATA`:

```javascript
'Nuevo Supermercado': {
    id: 'nuevo_super',
    location: { lat: -32.8900, lng: -68.8450 },
    address: 'Dirección del supermercado',
    phone: '+54 261 XXX-XXXX',
    hours: {
        weekdays: '08:00 - 22:00',
        saturday: '08:00 - 22:00',
        sunday: '09:00 - 21:00'
    },
    products: [
        {
            id: 'producto_id',
            name: "Nombre del Producto",
            brand: "Marca",
            price: 1500,
            available: true,
            category: "categoría",
            barcode: "código_de_barras"
        }
        // ... más productos
    ]
}
```

### Personalizar Algoritmo de Comparación
En `js/data.js`, modifica los pesos del algoritmo:

```javascript
comparison: {
    weights: {
        price: 0.4,        // 40% peso al precio
        availability: 0.4,  // 40% peso a disponibilidad
        distance: 0.2      // 20% peso a distancia
    }
}
```

## 🧪 Funcionalidades Avanzadas

### Sistema de Puntuación
La aplicación usa un algoritmo compuesto que considera:
- **Precio Total** (40%): Costo total de la lista de compras
- **Disponibilidad** (40%): Porcentaje de productos disponibles
- **Distancia** (20%): Proximidad al usuario (si está configurada)

### Análisis de Patrones
- Detecta patrones en las compras del usuario
- Sugiere optimizaciones basadas en categorías
- Identifica oportunidades de ahorro

### Exportación de Datos
- **Formato Texto**: Resumen legible de la comparación
- **Formato CSV**: Para análisis en hojas de cálculo
- **Formato JSON**: Para integración con otras aplicaciones

## 🔧 Personalización

### Temas y Estilos
Los colores principales se definen en `css/styles.css` usando CSS Custom Properties:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    /* Cambia estos valores para personalizar los colores */
}
```

### Configuración de Mapas
Puedes cambiar el proveedor de mapas modificando la configuración en `js/map.js`:

```javascript
// Cambiar tiles del mapa
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(this.map);
```

## 📊 Métricas y Analytics

La aplicación rastrea automáticamente:
- Número de comparaciones realizadas
- Productos más buscados
- Supermercados más elegidos
- Patrones de uso temporal

## 🐛 Troubleshooting

### Problemas Comunes

**El mapa no carga:**
- Verifica tu conexión a internet
- Asegúrate de que el contenedor del mapa tenga altura definida

**Geolocalización no funciona:**
- Permite permisos de ubicación en tu navegador
- Usa HTTPS (requerido para geolocalización)

**Productos no se encuentran:**
- Verifica que el nombre esté en los datos de `data.js`
- Intenta con nombres más cortos o genéricos

**Estilos no se cargan:**
- Verifica que las rutas de CSS sean correctas
- Confirma que todos los archivos estén en la estructura correcta

## 🚀 Roadmap y Mejoras Futuras

### Versión 2.0
- [ ] Integración con APIs reales de supermercados
- [ ] Sistema de usuarios y listas guardadas
- [ ] Comparación de ofertas y promociones
- [ ] Notificaciones push para ofertas

### Versión 2.1
- [ ] Modo offline completo
- [ ] Integración con códigos QR/códigos de barras
- [ ] Sistema de reviews y calificaciones
- [ ] Calculadora de combustible

### Versión 3.0
- [ ] Machine Learning para recomendaciones
- [ ] Integración con delivery
- [ ] Análisis predictivo de precios
- [ ] API pública para desarrolladores

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Guías de Contribución
- Mantén la consistencia en el código
- Agrega comentarios claros en español
- Testea en múltiples navegadores
- Actualiza la documentación si es necesario

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Créditos


- **Mapas**: OpenStreetMap Contributors
- **Iconos**: Font Awesome
- **Alertas**: SweetAlert2 Team

## 📞 Soporte

Si tienes problemas o preguntas:
- Abre un Issue en GitHub
- Revisa la documentación en este README
- Verifica los logs de la consola del navegador

---

**¡Hecho por Abel Alvarado en Mendoza, Argentina!**