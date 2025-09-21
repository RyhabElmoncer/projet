package org.example.gactifs.asset.mapper;


import org.example.gactifs.asset.dto.ServiceDirectionDto;
import org.example.gactifs.asset.models.ServiceDirection;

public class ServiceMapper {
    public static ServiceDirectionDto toDto(ServiceDirection s){
        if (s==null) return null;
        return ServiceDirectionDto.builder()
                .id(s.getId())
                .nom(s.getNom())
                .description(s.getDescription())
                .code(s.getCode())
                .responsable(s.getResponsable())
                .email(s.getEmail())
                .telephone(s.getTelephone())
                .actif(s.isActif())
                .build();
    }

    public static ServiceDirection toEntity(ServiceDirectionDto dto){
        if (dto==null) return null;
        return ServiceDirection.builder()
                .id(dto.getId())
                .nom(dto.getNom())
                .description(dto.getDescription())
                .code(dto.getCode())
                .responsable(dto.getResponsable())
                .email(dto.getEmail())
                .telephone(dto.getTelephone())
                .actif(dto.getActif() == null ? true : dto.getActif())
                .build();
    }
}
