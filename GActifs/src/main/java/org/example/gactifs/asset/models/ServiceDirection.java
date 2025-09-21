package org.example.gactifs.asset.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "service_direction")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceDirection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String description;
    private String code;
    private String responsable;
    private String email;
    private String telephone;
    private boolean actif = true;
}
