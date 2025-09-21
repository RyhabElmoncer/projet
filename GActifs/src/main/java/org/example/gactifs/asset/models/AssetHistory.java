package org.example.gactifs.asset.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "asset_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AssetHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long assetId;
    private String action;
    @Column(columnDefinition = "TEXT")
    private String details;
    private LocalDateTime timestamp;
    private String performedBy;
}
