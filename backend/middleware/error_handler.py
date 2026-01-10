"""
Global error handler middleware for FastAPI
Provides structured error responses and logging
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import traceback

logger = logging.getLogger(__name__)

class AppException(Exception):
    """Base application exception"""
    def __init__(self, message: str, status_code: int = 500, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationException(AppException):
    """Input validation exception"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=400, details=details)

class NotFoundException(AppException):
    """Resource not found exception"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=404, details=details)

class UnauthorizedException(AppException):
    """Unauthorized access exception"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=401, details=details)

class RateLimitException(AppException):
    """Rate limit exceeded exception"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=429, details=details)

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(f"Validation error on {request.url.path}: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Invalid input data",
            "details": errors
        }
    )

async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom application exceptions"""
    logger.error(
        f"Application error on {request.url.path}: {exc.message}",
        extra={"status_code": exc.status_code, "details": exc.details}
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "details": exc.details
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    error_id = f"ERR-{int(time.time())}"
    logger.error(
        f"Unexpected error [{error_id}] on {request.url.path}: {str(exc)}",
        exc_info=True,
        extra={"error_id": error_id, "path": request.url.path}
    )
    
    # Don't expose internal error details in production
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "error_id": error_id
        }
    )
