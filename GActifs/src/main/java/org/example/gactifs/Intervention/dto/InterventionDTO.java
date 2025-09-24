package org.example.gactifs.Intervention.dto;
import lombok.*;
import org.example.gactifs.Intervention.model.Intervention;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterventionDTO {
    private Long id;
    private String titre;
    private String description;
    private Intervention.TypeIntervention typeIntervention;
    private Intervention.PrioriteIntervention priorite;
    private Intervention.StatutIntervention statut;
    private LocalDateTime dateCreation;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private LocalDateTime dateEcheance;
    private Double dureeEstimee;
    private Double dureeReelle;
    private Double cout;
    private String creePar;
    private String validateur;
    private LocalDateTime dateValidation;
    private Long assetId;
    private Long technicienId;
    private Long serviceDirectionId;
}

