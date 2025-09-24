package org.example.gactifs.Reclamation.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name = "piece_jointes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
class PieceJointe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nomFichier;
    private String typeFichier;
    private Long tailleFichier;
    private String cheminFichier;
    private LocalDateTime dateAjout;
}

