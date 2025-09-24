package org.example.gactifs.Category.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String description;
    private String code;
    private String couleur;
    private String icone;
    private boolean actif;

    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;

    private Integer nombreActifs;
}
