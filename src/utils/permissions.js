/**
 * Comprueba si un usuario tiene permiso para modificar una anomalía.
 *
 * Los administradores pueden modificar cualquier expediente.
 * Los investigadores solo pueden modificar los expedientes propios.
 * Los usuarios Clase C no tienen permisos de modificación.
 *
 * @param {Object} user - Usuario autenticado, con id y role.
 * @param {Object} anomaly - Anomalía que contiene el campo owner.
 * @returns {boolean} True si tiene permiso, false en caso contrario.
 */
export function canModifyAnomaly(user, anomaly) {
    if (user.role === "admin") {
        return true;
    }

    return user.role === "user" &&
        anomaly.owner.toString() === user.id;
}