package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.IncidentTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentTicketRepository extends JpaRepository<IncidentTicket, Long> {

    // ========== BASIC QUERIES ==========
    
    Page<IncidentTicket> findByReporter_Id(Long reporterId, Pageable pageable);

    Page<IncidentTicket> findByStatus(String status, Pageable pageable);

    Page<IncidentTicket> findByAssignee_Id(Long assigneeId, Pageable pageable);

    Page<IncidentTicket> findByPriority(String priority, Pageable pageable);

    Page<IncidentTicket> findByStatusAndPriority(String status, String priority, Pageable pageable);

    boolean existsByIdAndReporter_Id(Long id, Long reporterId);

    @Query("SELECT COUNT(a) FROM TicketAttachment a WHERE a.ticket.id = :ticketId")
    long countAttachmentsByTicketId(@Param("ticketId") Long ticketId);

    // ========== USER FILTERING WITH STATUS/PRIORITY ==========
    
    Page<IncidentTicket> findByReporter_IdAndStatus(Long reporterId, String status, Pageable pageable);
    
    Page<IncidentTicket> findByReporter_IdAndPriority(Long reporterId, String priority, Pageable pageable);
    
    Page<IncidentTicket> findByReporter_IdAndStatusAndPriority(Long reporterId, String status, String priority, Pageable pageable);

    // ========== TECHNICIAN VIEWS ==========
    
    // For technicians to see unassigned OPEN/IN_PROGRESS tickets
    Page<IncidentTicket> findByStatusInAndAssigneeIsNull(List<String> statuses, Pageable pageable);
    
    // Alternative: find by multiple statuses (for more complex queries if needed)
    Page<IncidentTicket> findByStatusIn(List<String> statuses, Pageable pageable);
    
    // Find tickets where assignee is null (unassigned)
    Page<IncidentTicket> findByAssigneeIsNull(Pageable pageable);
    
    // Find unassigned tickets with specific status and priority
    Page<IncidentTicket> findByAssigneeIsNullAndStatusAndPriority(String status, String priority, Pageable pageable);

    // ========== ADMIN VIEWS ==========
    
    // Count tickets by status (for dashboard)
    long countByStatus(String status);
    
    // Count tickets by priority
    long countByPriority(String priority);
    
    // Find tickets created between dates
    Page<IncidentTicket> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end, Pageable pageable);
    
    // ========== USER DELETION SUPPORT ==========
    
    // Find all tickets where a user is assigned as technician
    List<IncidentTicket> findAllByAssignee_Id(Long assigneeId);
    
    // Count tickets assigned to a technician
    long countByAssignee_Id(Long assigneeId);
}