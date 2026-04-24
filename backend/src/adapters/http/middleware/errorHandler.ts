import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../validation/schemas';

// Error middleware: catches all controller errors and returns consistent HTTP responses
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
// Parameter validation error - 400 Bad Request
  if (err instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: 'Parámetros inválidos',
      message: err.message,
    });
    return;
  }

  // Business error - 422
  if (err.message.includes('"from"') || err.message.includes('rango')) {
    res.status(422).json({
      success: false,
      error: 'Error de validación de negocio',
      message: err.message,
    });
    return;
  }

// Unexpected error - 500
  console.error('[ERROR]', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
  });
}