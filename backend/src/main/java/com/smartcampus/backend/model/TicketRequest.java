package com.smartcampus.backend.model;

import jakarta.validation.constraints.NotBlank;

public class TicketRequest {

    // Inner class for creating a new ticket
    public static class Create {
        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Description is required")
        private String description;

        @NotBlank(message = "Category is required")
        private String category;

        @NotBlank(message = "Priority is required")
        private String priority;

        private Long resourceId;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }

        public Long getResourceId() { return resourceId; }
        public void setResourceId(Long resourceId) { this.resourceId = resourceId; }
    }

    // Inner class for adding a comment
    public static class Comment {
        @NotBlank(message = "Comment content cannot be empty")
        private String content;

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}