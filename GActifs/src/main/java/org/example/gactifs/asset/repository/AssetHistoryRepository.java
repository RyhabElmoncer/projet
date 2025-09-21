package org.example.gactifs.asset.repository;

import org.example.gactifs.asset.models.AssetHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssetHistoryRepository extends JpaRepository<AssetHistory, Long> {
    List<AssetHistory> findByAssetIdOrderByTimestampDesc(Long assetId);
}
