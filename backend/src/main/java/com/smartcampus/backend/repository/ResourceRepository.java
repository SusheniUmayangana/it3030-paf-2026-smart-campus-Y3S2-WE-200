package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    List<Resource> findByType(ResourceType type);

    List<Resource> findByLocationContainingIgnoreCase(String location);
}