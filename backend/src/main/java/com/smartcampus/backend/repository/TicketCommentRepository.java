package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.TicketComment; 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {

    // Get all non-deleted comments for a ticket
    List<TicketComment> findByTicket_IdAndIsDeletedFalseOrderByCreatedAtAsc(Long ticketId);

    Optional<TicketComment> findByIdAndAuthor_Id(Long commentId, Long authorId);
}