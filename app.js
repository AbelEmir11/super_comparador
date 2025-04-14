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

  const totales = supermercados.map(() => 0); // Inicializar totales por supermercado

  /*listaDeCompras.forEach(({ nombre, cantidad }) => {
    const fila = document.createElement('tr');
    fila.innerHTML = `<td>${nombre} x${cantidad}</td>`;

    let precios = [];
    let disponibleEn = [];

    supermercados.forEach((supermercado, i) => {
      const datos = datosSupermercados.find(d => d.nombre === supermercado);
      const prod = datos.productos.find(p =>
        p.nombre.toLowerCase().includes(nombre.toLowerCase()) && p.disponible
      );

      if (prod) {
        const totalProducto = prod.precio * cantidad;
        precios[i] = totalProducto;
        totales[i] += totalProducto;
        fila.innerHTML += `<td>$${totalProducto}</td>`;
        disponibleEn.push({ nombre: supermercado, precio: totalProducto });
      } else {
        precios[i] = null;
        fila.innerHTML += `<td style="color: gray">No disponible</td>`;
      }
    });

    const menor = disponibleEn.reduce((a, b) => (a.precio < b.precio ? a : b), disponibleEn[0]);
    fila.innerHTML += `<td>${menor ? menor.nombre : 'Ninguno'}</td>`;

    tabla.appendChild(fila);

    // Filtramos supermercados que tienen al menos un producto disponible
let supermercadosDisponibles = resultados.filter(r => r.total > 0);

// Si hay al menos uno con productos disponibles
if (supermercadosDisponibles.length > 0) {
  // Buscamos el supermercado con menor total entre los disponibles
  let supermercadoGanador = supermercadosDisponibles.reduce((min, actual) =>
    actual.total < min.total ? actual : min
  );

  Swal.fire({
    title: '🎉 ¡Mejor opción encontrada!',
    html: `
      <div style="font-size: 18px;">
        <strong>${supermercadoGanador.nombre.toUpperCase()}</strong> ofrece el mejor precio.<br>
        <br>
        <i class="fa-solid fa-tags"></i> <strong>Total: $${supermercadoGanador.total}</strong>
      </div>
    `,
    icon: 'success',
    confirmButtonText: 'Ver Resultados',
    confirmButtonColor: '#28a745',
  });
} else {
  // Si ningún supermercado tiene los productos
  Swal.fire({
    title: '😞 Sin coincidencias',
    text: 'Ningún supermercado tiene los productos seleccionados.',
    icon: 'warning',
    confirmButtonText: 'Ok',
    confirmButtonColor: '#d33',
  });
}
  });

  // Agregar fila con los totales por supermercado
  const filaTotales = document.createElement('tr');
  filaTotales.innerHTML = `<td><strong>Total</strong></td>` +
    totales.map(total => `<td><strong>$${total}</strong></td>`).join('') +
    `<td></td>`; // Celda vacía para "Mejor precio"
  tabla.appendChild(filaTotales);
};*/
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
      disponibleEn.push({ nombre: supermercado, precio: totalProducto });
      fila.innerHTML += `<td>$${totalProducto}</td>`;
    } else {
      fila.innerHTML += `<td style="color: gray">No disponible</td>`;
    }
  });

  // Agregamos columna de "Mejor precio"
  if (disponibleEn.length > 0) {
    const mejor = disponibleEn.reduce((a, b) => (a.precio < b.precio ? a : b));
    fila.innerHTML += `<td style="color: green; font-weight: bold;">🏆 ${mejor.nombre}</td>`;
  } else {
    fila.innerHTML += `<td style="color: red;">Ninguno</td>`;
  }

  tabla.appendChild(fila);
});

// Total final por supermercado
const filaTotales = document.createElement('tr');
filaTotales.innerHTML = `<td><strong>Total</strong></td>`;
totales.forEach((total, i) => {
  filaTotales.innerHTML += `<td><strong>$${total}</strong></td>`;
});

const mejorTotal = Math.min(...totales.filter(t => t > 0));
const indiceMejor = totales.findIndex(t => t === mejorTotal);

if (indiceMejor !== -1) {
  filaTotales.innerHTML += `<td style="color: blue; font-weight: bold;">🏆 ${supermercados[indiceMejor]}</td>`;

  // SweetAlert con mejor supermercado total
  Swal.fire({
    icon: 'success',
    title: '¡Mejor opción!',
    html: `💰 <b>${supermercados[indiceMejor]}</b> tiene el mejor precio total: <b>$${mejorTotal}</b>`,
    confirmButtonText: 'Perfecto',
    background: '#f0f9ff',
  });
} else {
  filaTotales.innerHTML += `<td style="color: gray;">Sin datos</td>`;
}

tabla.appendChild(filaTotales);
};
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

