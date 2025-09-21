package org.example.gactifs.asset.models;

import jakarta.persistence.*;
import lombok.*;
import org.example.gactifs.asset.enums.AssetCategory;
import org.example.gactifs.asset.enums.AssetStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "asset")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Asset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String reference;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private AssetCategory categorie;

    @Enumerated(EnumType.STRING)
    private AssetStatus etat;

    private LocalDate dateAcquisition;
    private BigDecimal valeur;
    private String numeroSerie;
    private String localisation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private ServiceDirection service;

    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
    private String createdBy;
    private String modifiedBy;
}
