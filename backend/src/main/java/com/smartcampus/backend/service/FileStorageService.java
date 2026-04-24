package com.smartcampus.backend.service;

import com.smartcampus.backend.exception.TicketException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;

@Service
public class FileStorageService {

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    @Value("${app.upload.dir:uploads/tickets}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    // Save attachment using timestamp-based unique naming
    public String storeAttachment(MultipartFile file) {
        validateFile(file);

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            // Generate unique name using current time in milliseconds
            String originalFileName = file.getOriginalFilename();
            String fileName = System.currentTimeMillis() + "_" + sanitizeFileName(originalFileName);
            Path targetPath = uploadPath.resolve(fileName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return baseUrl + "/api/files/tickets/" + fileName;

        } catch (IOException ex) {
            throw new TicketException.InvalidOperation("Failed to store file. Please try again.");
        }
    }

    // Get file as byte array for direct download/view
    public byte[] getFile(String fileName) throws IOException {
        Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(fileName);
        return Files.readAllBytes(filePath);
    }

    // Delete existing file from storage
    public void deleteFile(String fileUrl) {
        try {
            if (fileUrl == null || !fileUrl.contains("/")) return;
            String fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(fileName);
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            System.err.println("Warning: Could not delete file: " + fileUrl);
        }
    }

    // Check file constraints
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new TicketException.InvalidOperation("File must not be empty.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new TicketException.InvalidOperation("File exceeds the 5MB limit.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new TicketException.InvalidOperation("File type not allowed. Only JPEG, PNG, GIF, WEBP are supported.");
        }
    }

    // Clean filename characters
    private String sanitizeFileName(String fileName) {
        if (fileName == null) return "attachment";
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}