package org.example.gactifs.Reclamation.model;

import jakarta.persistence.*;
import lombok.*;
import org.example.gactifs.asset.models.Asset;
import org.example.gactifs.asset.models.ServiceDirection;
import org.example.gactifs.auth.Model.User;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "reclamations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reclamation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numero;
    private String objet;
    private String description;

    @Enumerated(EnumType.STRING)
    private TypeReclamation typeReclamation;

    @Enumerated(EnumType.STRING)
    private PrioriteReclamation priorite;

    @Enumerated(EnumType.STRING)
    private StatutReclamation statut;

    private LocalDateTime dateCreation;
    private LocalDateTime dateEcheance;
    private LocalDateTime dateResolution;

    private String reclamantNom;
    private String reclamantEmail;
    private String reclamantTelephone;

    private String resolution;
    private Integer satisfactionClient;
    private Double cout;
    private Integer tempsResolution;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PieceJointe> pieceJointes;

    @ManyToOne
    private User technicienAssigne;

    @ManyToOne
    private ServiceDirection serviceDirection;

    @ManyToOne
    private Asset asset;

    // Enumérations
    public enum TypeReclamation { TECHNIQUE, FONCTIONNEL, PERFORMANCE, SECURITE, ACCES, FORMATION, AUTRE }
    public enum PrioriteReclamation { CRITIQUE, HAUTE, MOYENNE, BASSE }
    public enum StatutReclamation { NOUVELLE, EN_ATTENTE, EN_COURS, EN_ATTENTE_CLIENT, RESOLUE, FERMEE, ANNULEE }
}
