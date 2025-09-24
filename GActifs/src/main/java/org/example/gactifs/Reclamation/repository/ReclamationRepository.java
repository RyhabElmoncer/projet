package org.example.gactifs.Reclamation.repository;

import org.example.gactifs.Reclamation.model.Reclamation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {
    boolean existsByNumero(String numero);
}
