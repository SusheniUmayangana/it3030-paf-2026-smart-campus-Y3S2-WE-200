package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.IncidentTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface IncidentTicketRepository extends JpaRepository<IncidentTicket, Long> {

    // USER: view their own tickets
    Page<IncidentTicket> findByReporter_Id(UUID reporterId, Pageable pageable);

    // ADMIN: filter by status
    Page<IncidentTicket> findByStatus(String status, Pageable pageable);

    // ADMIN: filter by priority
    Page<IncidentTicket> findByPriority(String priority, Pageable pageable);

    // TECHNICIAN: view assigned tickets
    Page<IncidentTicket> findByAssignee_Id(UUID assigneeId, Pageable pageable);

    // ADMIN: filter by status + priority
    Page<IncidentTicket> findByStatusAndPriority(String status, String priority, Pageable pageable);

    // Reporter owns the ticket check
    boolean existsByIdAndReporter_Id(Long id, UUID reporterId);

    // Count attachments for a ticket (used for max 3 enforcement)
    @Query("SELECT COUNT(a) FROM TicketAttachment a WHERE a.ticket.id = :ticketId")
    long countAttachmentsByTicketId(@Param("ticketId") Long ticketId);
}
