package com.smartcampus.backend.service;

import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ResourceService {

    private final ResourceRepository repository;

    public ResourceService(ResourceRepository repository) {
        this.repository = repository;
    }

    // Get all resources
    public List<Resource> getAll() {
        return repository.findAll();
    }

    // Create new resource
    public Resource create(Resource resource) {
        return repository.save(resource);
    }

    // Update existing resource
    public Resource update(Long id, Resource updated) {
        Resource existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));

        existing.setName(updated.getName());
        existing.setType(updated.getType());
        existing.setCapacity(updated.getCapacity());
        existing.setLocation(updated.getLocation());
        existing.setStatus(updated.getStatus());
        existing.setAvailabilityStart(updated.getAvailabilityStart());
        existing.setAvailabilityEnd(updated.getAvailabilityEnd());
        existing.setImageUrl(updated.getImageUrl());

        return repository.save(existing);
    }

    // Delete resource
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException(id);
        }
        repository.deleteById(id);
    }
}