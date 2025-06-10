document.addEventListener('DOMContentLoaded', () => {
  const promoForm = document.getElementById('promo-form');
  const promoList = document.getElementById('promo-list');

  const cargarPromociones = () => {
    fetch('/api/promociones')
      .then(res => res.json())
      .then(data => {
        promoList.innerHTML = '';
        data.forEach(promo => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${promo.nombre}</td>
            <td>${promo.descripcion}</td>
            <td>${promo.descuento}%</td>
            <td>${promo.fecha_inicio}</td>
            <td>${promo.fecha_fin}</td>
            <td><button class="btn btn-danger btn-sm" onclick="eliminarPromocion(${promo.id})">Eliminar</button></td>
          `;
          promoList.appendChild(row);
        });
      });
  };

  promoForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      nombre: document.getElementById('nombre').value,
      descripcion: document.getElementById('descripcion').value,
      descuento: parseInt(document.getElementById('descuento').value),
      fecha_inicio: document.getElementById('fecha_inicio').value,
      fecha_fin: document.getElementById('fecha_fin').value,
    };

    fetch('/api/promociones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    .then(res => {
      if (res.ok) {
        promoForm.reset();
        cargarPromociones();
      } else {
        alert('Error al guardar promoción');
      }
    });
  });

  window.eliminarPromocion = (id) => {
    if (confirm('¿Eliminar esta promoción?')) {
      fetch(`/api/promociones/${id}`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) cargarPromociones();
        });
    }
  };

  cargarPromociones();
});
