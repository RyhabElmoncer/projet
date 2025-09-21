package org.example.gactifs.asset.dto;

import lombok.*;
import org.example.gactifs.asset.enums.AssetCategory;
import org.example.gactifs.asset.enums.AssetStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetDto {
    private Long id;
    private String nom;
    private String reference;
    private String description;
    private AssetCategory categorie;
    private AssetStatus etat;
    private LocalDate dateAcquisition;
    private BigDecimal valeur;
    private String numeroSerie;
    private String localisation;
    private Long serviceId;
    private String serviceName;
    private String createdBy;
    private String modifiedBy;
}
