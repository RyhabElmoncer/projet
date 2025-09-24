package org.example.gactifs.Intervention.model;

import jakarta.persistence.*;
import lombok.*;
import org.example.gactifs.asset.models.Asset;
import org.example.gactifs.asset.models.ServiceDirection;
import org.example.gactifs.auth.Model.User;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "interventions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Intervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String description;

    @Enumerated(EnumType.STRING)
    private TypeIntervention typeIntervention;

    @Enumerated(EnumType.STRING)
    private PrioriteIntervention priorite;

    @Enumerated(EnumType.STRING)
    private StatutIntervention statut;

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

    @ManyToOne
    private Asset asset;

    @ManyToOne
    private User technicienAssigne;

    @ManyToOne
    private ServiceDirection serviceDirection;



    public enum TypeIntervention {
        MAINTENANCE_PREVENTIVE, MAINTENANCE_CORRECTIVE, REPARATION,
        INSTALLATION, CONFIGURATION, MISE_A_JOUR, DIAGNOSTIC, AUTRE
    }

    public enum PrioriteIntervention {
        CRITIQUE, HAUTE, MOYENNE, BASSE
    }

    public enum StatutIntervention {
        PLANIFIEE, EN_ATTENTE, EN_COURS, SUSPENDUE,
        TERMINEE, ANNULEE, VALIDEE
    }
}

