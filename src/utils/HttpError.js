/**
 * Representa un error HTTP personalizado.
 *
 * Extiende la clase Error de JavaScript para asociar
 * un código de estado HTTP a un mensaje de error.
 */
export class HttpError extends Error {
    /**
     * Crea un error HTTP con un código y un mensaje.
     *
     * @param {number} status - Código de estado HTTP.
     * @param {string} message - Descripción del error.
     */
    constructor(status, message) {
        super(message);
        this.name = "HttpError";
        this.status = status;
    }
}