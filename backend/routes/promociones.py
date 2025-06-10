from flask import Blueprint, request, jsonify
from backend.db import get_db_connection  # Usa tu propia función

promociones_bp = Blueprint('promociones', __name__)

@promociones_bp.route('/api/promociones', methods=['GET'])
def obtener_promociones():
    conn = get_db_connection()
    promociones = conn.execute('SELECT * FROM promociones').fetchall()
    conn.close()
    return jsonify([dict(row) for row in promociones])

@promociones_bp.route('/api/promociones', methods=['POST'])
def crear_promocion():
    data = request.get_json()

    nombre = data.get('nombre')
    descripcion = data.get('descripcion')
    descuento = data.get('descuento')
    fecha_inicio = data.get('fecha_inicio')
    fecha_fin = data.get('fecha_fin')

    if not all([nombre, descuento, fecha_inicio, fecha_fin]):
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    conn = get_db_connection()
    conn.execute(
        '''
        INSERT INTO promociones (nombre, descripcion, descuento, fecha_inicio, fecha_fin)
        VALUES (?, ?, ?, ?, ?)
        ''',
        (nombre, descripcion, descuento, fecha_inicio, fecha_fin)
    )
    conn.commit()
    conn.close()
    return jsonify({'mensaje': 'Promoción creada correctamente'}), 201

@promociones_bp.route('/api/promociones/<int:id>', methods=['DELETE'])
def eliminar_promocion(id):
    conn = get_db_connection()
    conn.execute('DELETE FROM promociones WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({'mensaje': 'Promoción eliminada correctamente'})
