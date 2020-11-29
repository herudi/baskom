function withSpace(str: string) {
    str = str.replace(/([a-z])([A-Z])/g, '$1 $2');
    str = str.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    return str;
};

export class BaskomError extends Error {
    code: number;
    statusCode: number;
    status: number;
    constructor(message = null) {
        super();
        this.code = this.getCode();
        this.statusCode = this.getCode();
        this.status = this.getCode();
        this.name = this.getName();
        this.message = message || withSpace(this.getName() || 'UnknownError');
    }
    getName(): string {
        return 'UnknownError';
    }
    getCode(): number {
        return 500;
    }
};
export class BadRequestError extends BaskomError {
    getCode() { return 400 };
    getName() { return 'BadRequestError' };
};
export class UnauthorizedError extends BaskomError {
    getCode() { return 401 };
    getName() { return 'UnauthorizedError' };
};
export class ForbiddenError extends BaskomError {
    getCode() { return 403 };
    getName() { return 'ForbiddenError' };
};
export class NotFoundError extends BaskomError {
    getCode() { return 404 };
    getName() { return 'NotFoundError' };
};
export class MethodNotAllowedError extends BaskomError {
    getCode() { return 405 };
    getName() { return 'MethodNotAllowedError' };
};
export class ConflictError extends BaskomError {
    getCode() { return 409 };
    getName() { return 'ConflictError' };
};
export class UnsupportedMediaTypeError extends BaskomError {
    getCode() { return 415 };
    getName() { return 'UnsupportedMediaTypeError' };
};
export class UnprocessableEntityError extends BaskomError {
    getCode() { return 422 };
    getName() { return 'UnprocessableEntityError' };
};
export class InternalServerError extends BaskomError {
    getCode() { return 500 };
    getName() { return 'InternalServerError' };
};
export class NotImplementedError extends BaskomError {
    getCode() { return 501 };
    getName() { return 'NotImplementedError' };
};
export class BadGatewayError extends BaskomError {
    getCode() { return 502 };
    getName() { return 'BadGatewayError' };
};
export class ServiceUnavailableError extends BaskomError {
    getCode() { return 503 };
    getName() { return 'ServiceUnavailableError' };
};