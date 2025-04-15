const input = document.getElementById("productInput");
const addBtn = document.getElementById("addProductBtn");
const list = document.getElementById("productList");

const products = [];
const listaDeCompras = [];

addBtn.addEventListener("click", () => {
  const inputValue = input.value.trim().toLowerCase();

  if (inputValue) {
    const items = inputValue.split(",").map(item => item.trim()).filter(item => item !== "");

    items.forEach((item) => {
      // Buscar el producto real por coincidencia parcial
      let productoReal = null;
      for (const supermercado of datosSupermercados) {
        productoReal = supermercado.productos.find(
          (p) => p.nombre.toLowerCase().includes(item)
        );
        if (productoReal) break;
      }

      if (productoReal) {
        const nombreReal = productoReal.nombre.toLowerCase();
        const yaExiste = listaDeCompras.find(p => p.nombre === nombreReal);

        if (yaExiste) {
          yaExiste.cantidad += 1; // Incrementar cantidad
        } else {
          listaDeCompras.push({ nombre: nombreReal, cantidad: 1 });
        }

        actualizarListaDeCompras();
      } else {
       swal.fire({
          icon: 'error',
          title: 'Producto no encontrado',
          text: `No se encontró el producto "${item}" en la lista de supermercados.`,
          confirmButtonText: 'Aceptar'
        });
        
        
      }
    });

    input.value = "";
  }
});

// app.js

// Array para almacenar los datos de los supermercados
const supermercados = ['atomo', 'oscardavid', 'vea'];
const datosSupermercados = [];

// Función para cargar los datos de un supermercado
async function cargarDatosSupermercado(nombre) {
  try {
    const response = await fetch(`data/${nombre}.json`);
    const data = await response.json();
    datosSupermercados.push({ nombre, productos: data });
  } catch (error) {
    console.error(`Error al cargar datos de ${nombre}:`, error);
  }
}

// Cargar datos de todos los supermercados
async function cargarTodosLosDatos() {
  await Promise.all(supermercados.map(cargarDatosSupermercado));
  console.log('Datos de supermercados cargados:', datosSupermercados);
  // Aquí puedes llamar a la función que inicializa la aplicación
}

cargarTodosLosDatos();
// app.js



// Función para agregar un producto a la lista de compras
function agregarProducto(nombreProducto) {
  const nombre = nombreProducto.trim().toLowerCase();
  if (nombre && !listaDeCompras.includes(nombre)) {
    listaDeCompras.push(nombre);
    actualizarListaDeCompras();
  }
}

// Función para actualizar la visualización de la lista de compras
function actualizarListaDeCompras() {
  const listaElement = document.getElementById('productList');
  listaElement.innerHTML = '';

  listaDeCompras.forEach((producto, index) => {
    const li = document.createElement('li');
    li.textContent = `${producto.nombre} x${producto.cantidad}`;
  
    // Botón sumar
    const btnSumar = document.createElement('button');
    btnSumar.textContent = '+';
    btnSumar.classList.add('boton-cantidad');
    btnSumar.onclick = () => {
      producto.cantidad++;
      actualizarListaDeCompras();
    };
  
    // Botón restar
    const btnRestar = document.createElement('button');
    btnRestar.textContent = '−';
    btnRestar.classList.add('boton-cantidad');
    btnRestar.onclick = () => {
      if (producto.cantidad > 1) {
        producto.cantidad--;
      } else {
        listaDeCompras.splice(index, 1); // Eliminar si llega a 0
      }
      actualizarListaDeCompras();
    };
  
    // Botón eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.classList.add('boton-eliminar');
    btnEliminar.onclick = () => {
      listaDeCompras.splice(index, 1);
      actualizarListaDeCompras();
    };
  
    li.appendChild(btnRestar);
    li.appendChild(btnSumar);
    li.appendChild(btnEliminar);
    listaElement.appendChild(li);
  });
  
}
function compararPrecios() {
  const tabla = document.getElementById('tablaResultados');
  tabla.innerHTML = ''; // Limpiar tabla

  const encabezado = document.createElement('tr');
  encabezado.innerHTML = `
    <th>Producto</th>
    ${supermercados.map(s => `<th>${s}</th>`).join('')}
    <th>Mejor precio</th>
  `;
  tabla.appendChild(encabezado);

  const totales = supermercados.map(() => 0); // Total por super
  const disponiblesPorSuper = supermercados.map(() => 0); // Disponibilidad por super
  const sumaPreciosPorSuper = supermercados.map(() => 0); // Para calcular promedios

  listaDeCompras.forEach(({ nombre, cantidad }) => {
    const fila = document.createElement('tr');
    fila.innerHTML = `<td>${nombre} x${cantidad}</td>`;

    let disponibleEn = [];

    supermercados.forEach((supermercado, i) => {
      const datos = datosSupermercados.find(d => d.nombre === supermercado);
      const prod = datos.productos.find(p =>
        p.nombre.toLowerCase().includes(nombre.toLowerCase()) && p.disponible
      );

      if (prod) {
        const totalProducto = prod.precio * cantidad;
        totales[i] += totalProducto;
        sumaPreciosPorSuper[i] += totalProducto;
        disponiblesPorSuper[i]++;
        fila.innerHTML += `<td>$${totalProducto}</td>`;
        disponibleEn.push({ nombre: supermercado, precio: totalProducto });
      } else {
        fila.innerHTML += `<td style="color: gray">No disponible</td>`;
      }
    });

    // Determinar el mejor precio entre los disponibles
    const menor = disponibleEn.reduce((a, b) => (a.precio < b.precio ? a : b), disponibleEn[0]);
    fila.innerHTML += `<td>🏆 ${menor ? menor.nombre : 'Ninguno'}</td>`;
    tabla.appendChild(fila);
  });

  // Fila de totales
  const filaTotales = document.createElement('tr');
  filaTotales.innerHTML = `<td><strong>Total</strong></td>`;
  totales.forEach(total => {
    filaTotales.innerHTML += `<td><strong>$${total}</strong></td>`;
  });

  // Identificar mejor opción general (más productos disponibles y menor total)
  const maxDisponibles = Math.max(...disponiblesPorSuper);
  let mejorOpcion = null;
  let menorTotal = Infinity;
  supermercados.forEach((supermercado, i) => {
    if (disponiblesPorSuper[i] === maxDisponibles && totales[i] < menorTotal) {
      menorTotal = totales[i];
      mejorOpcion = supermercado;
    }
  });

  // Identificar mejor precio promedio
  let mejorPromedio = Infinity;
  let supermercadoConMejorPromedio = null;
  supermercados.forEach((supermercado, i) => {
    if (disponiblesPorSuper[i] > 0) {
      const promedio = sumaPreciosPorSuper[i] / disponiblesPorSuper[i];
      if (promedio < mejorPromedio) {
        mejorPromedio = promedio;
        supermercadoConMejorPromedio = supermercado;
      }
    }
  });

  // Columna extra "Mejor opción"
  let celdaOpcion = '<td><strong>';
  supermercados.forEach((supermercado, i) => {
    let texto = '';
    if (supermercado === mejorOpcion) texto += '🟢';
    if (supermercado === supermercadoConMejorPromedio) texto += ' 🔵';
    celdaOpcion += `<td>${texto.trim()}</td>`;
  });
  celdaOpcion += '</strong></td>';

  filaTotales.innerHTML += `<td>🏆 ${mejorOpcion}</td>`;
  tabla.appendChild(filaTotales);

  // Mensaje final con ambas consideraciones
  Swal.fire({
    icon: 'info',
    title: 'Resultado del Comparador',
    html: `
      <p>🟢 <strong>Mejor opción general:</strong> ${mejorOpcion} (mayor disponibilidad de productos)</p>
      <p>🔵 <strong>Mejor precio en promedio:</strong> ${supermercadoConMejorPromedio}
      (precios en general mas bajos)</p>
      <p> <strong> ¡dependiendo de lo que mas te convenga, elige donde comprar gastando menos!.</strong>  </p>
    `,
    confirmButtonText: 'Entendido',
  });
}




function mostrarResultados(resultados) {
  console.log("Mostrando resultados", resultados); 
  const resultadosElement = document.getElementById('results');
  resultadosElement.innerHTML = '';

  resultados.forEach((resultado) => {
    const div = document.createElement('div');
    div.className = 'resultado border p-4 mb-4 rounded bg-white shadow';

    const titulo = document.createElement('h3');
    titulo.textContent = `🛒 Supermercado: ${resultado.nombre}`;
    titulo.className = 'text-lg font-bold mb-2';
    div.appendChild(titulo);

    const total = document.createElement('p');
    total.innerHTML = `<strong>Total:</strong> $${resultado.total.toFixed(2)}`;
    div.appendChild(total);

    if (resultado.productosFaltantes.length > 0) {
      const faltantes = document.createElement('p');
      faltantes.innerHTML = `<strong>Productos no disponibles:</strong> ${resultado.productosFaltantes.join(', ')}`;
      faltantes.className = 'text-red-600';
      div.appendChild(faltantes);
    }

    resultadosElement.appendChild(div);
  });
  console.log("Final de mostrarResultados");
}

  document.getElementById('compareBtn').addEventListener('click', compararPrecios);
  const compareBtn = document.getElementById("compareBtn");

