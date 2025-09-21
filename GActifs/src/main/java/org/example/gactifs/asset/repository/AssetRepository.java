package org.example.gactifs.asset.repository;

import org.example.gactifs.asset.enums.AssetStatus;
import org.example.gactifs.asset.models.Asset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {
    Page<Asset> findAll(Pageable pageable);

    Page<Asset> findByServiceId(Long serviceId, Pageable pageable);

    List<Asset> findByServiceId(Long serviceId);

    List<Asset> findByNomContainingIgnoreCaseOrReferenceContainingIgnoreCase(String nom, String ref);

    long countByEtat(AssetStatus status);
}
