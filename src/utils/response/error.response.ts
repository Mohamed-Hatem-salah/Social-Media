import { NextFunction, Request, Response } from "express";

export interface IError extends Error {
    statusCode: number

}

export class ApplicationException extends Error {
    constructor(
        message: string,
        public statusCode: number = 400,
        cause?: unknown
    ) {
        super(message, { cause });
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}


export class BadRequistException extends ApplicationException {
    constructor(
        message: string,
        cause?: unknown
    ) {
        super(message, 400, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}


export class NotfoundException extends ApplicationException {
    constructor(
        message: string,
        cause?: unknown
    ) {
        super(message, 404, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}


export class unautharizedException extends ApplicationException {
    constructor(
        message: string,
        cause?: unknown
    ) {
        super(message, 401, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}


export class forbiddenException extends ApplicationException {
    constructor(
        message: string,
        cause?: unknown
    ) {
        super(message, 403, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}


export class ConflictException extends ApplicationException {
    constructor(
        message: string,
        cause?: unknown
    ) {
        super(message, 409, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}


export const globalErrorHandling = (
    error: IError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    return res.status(error.statusCode || 500).json({
        err_message: error.message || 'Something went wrong! please try again later ❌',
        stack: process.env.MOOD === 'development' ? error.stack : undefined,
        cause: error.cause,
        error
    });
};

