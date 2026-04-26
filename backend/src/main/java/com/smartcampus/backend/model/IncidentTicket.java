package com.smartcampus.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "incident_tickets")
public class IncidentTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Column(nullable = false, length = 200)
    private String title;

    @NotNull(message = "Reporter is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id")
    private Resource resource;

    // ADDED: OnDelete SET NULL - When a User is deleted, set assignee_id to NULL
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private User assignee;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Description is required")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @NotBlank(message = "Priority is required")
    private String priority; // LOW, MEDIUM, HIGH, CRITICAL

    private String status = "OPEN"; // OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REJECTED

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    private String contactDetails;

    private LocalDateTime assignedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketComment> comments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "OPEN";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public IncidentTicket() {}

    // Getters & Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }

    public Resource getResource() { return resource; }
    public void setResource(Resource resource) { this.resource = resource; }

    public User getAssignee() { return assignee; }
    public void setAssignee(User assignee) { this.assignee = assignee; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String notes) { this.resolutionNotes = notes; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String reason) { this.rejectionReason = reason; }

    public String getContactDetails() { return contactDetails; }
    public void setContactDetails(String details) { this.contactDetails = details; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime time) { this.assignedAt = time; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime time) { this.resolvedAt = time; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public List<TicketAttachment> getAttachments() { return attachments; }
    public void setAttachments(List<TicketAttachment> attachments) { this.attachments = attachments; }

    public List<TicketComment> getComments() { return comments; }
    public void setComments(List<TicketComment> comments) { this.comments = comments; }
}