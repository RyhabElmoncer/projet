package org.example.gactifs.asset.repository;

import org.example.gactifs.asset.models.ServiceDirection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceDirectionRepository extends JpaRepository<ServiceDirection, Long> {
    List<ServiceDirection> findByActifTrue();
    List<ServiceDirection> findByNomContainingIgnoreCase(String q);
}
