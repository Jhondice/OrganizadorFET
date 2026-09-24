export class ApiError extends Error {
  /** @param {string} code @param {string} message @param {object} [fields] */
  constructor(code, message, fields) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.fields = fields || null;
  }
}
