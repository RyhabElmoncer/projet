package org.example.gactifs.Category.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
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
