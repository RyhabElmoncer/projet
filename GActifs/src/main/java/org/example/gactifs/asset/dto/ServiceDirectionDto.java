package org.example.gactifs.asset.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceDirectionDto {
    private Long id;
    private String nom;
    private String description;
    private String code;
    private String responsable;
    private String email;
    private String telephone;
    private Boolean actif;
}
