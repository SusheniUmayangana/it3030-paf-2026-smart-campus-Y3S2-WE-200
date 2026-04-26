package com.smartcampus.backend.exception;

public class TicketException {
    
    public static class AccessDenied extends RuntimeException {
        public AccessDenied(String message) { super(message); }
    }
    
    public static class InvalidOperation extends RuntimeException {
        public InvalidOperation(String message) { super(message); }
    }
    
    public static class NotFound extends RuntimeException {
        public NotFound(String message) { super(message); }
    }
}