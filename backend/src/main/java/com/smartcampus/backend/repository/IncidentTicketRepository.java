package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.IncidentTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentTicketRepository extends JpaRepository<IncidentTicket, Long> {

    Page<IncidentTicket> findByReporter_Id(Long reporterId, Pageable pageable);

    Page<IncidentTicket> findByStatus(String status, Pageable pageable);

    Page<IncidentTicket> findByAssignee_Id(Long assigneeId, Pageable pageable);

    Page<IncidentTicket> findByPriority(String priority, Pageable pageable);

    Page<IncidentTicket> findByStatusAndPriority(String status, String priority, Pageable pageable);

    boolean existsByIdAndReporter_Id(Long id, Long reporterId);

    @Query("SELECT COUNT(a) FROM TicketAttachment a WHERE a.ticket.id = :ticketId")
    long countAttachmentsByTicketId(@Param("ticketId") Long ticketId);
}