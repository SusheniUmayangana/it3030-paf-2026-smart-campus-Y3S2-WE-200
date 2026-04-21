package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {

    List<TicketAttachment> findByTicket_Id(Long ticketId);

    long countByTicket_Id(Long ticketId);
}
