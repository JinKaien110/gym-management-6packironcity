export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
        this.statusCode = message === "Forbidden: Invalid Account Type" ? 403 : 400 ;
    }
}