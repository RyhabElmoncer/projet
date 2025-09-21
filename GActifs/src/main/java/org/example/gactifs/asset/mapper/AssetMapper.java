package org.example.gactifs.asset.mapper;


import org.example.gactifs.asset.dto.AssetCreateDto;
import org.example.gactifs.asset.dto.AssetDto;
import org.example.gactifs.asset.dto.AssetUpdateDto;
import org.example.gactifs.asset.models.Asset;
import org.example.gactifs.asset.models.ServiceDirection;

public class AssetMapper {
    public static AssetDto toDto(Asset a){
        if (a==null) return null;
        return AssetDto.builder()
                .id(a.getId())
                .nom(a.getNom())
                .reference(a.getReference())
                .description(a.getDescription())
                .categorie(a.getCategorie())
                .etat(a.getEtat())
                .dateAcquisition(a.getDateAcquisition())
                .valeur(a.getValeur())
                .numeroSerie(a.getNumeroSerie())
                .localisation(a.getLocalisation())
                .serviceId(a.getService() != null ? a.getService().getId() : null)
                .serviceName(a.getService() != null ? a.getService().getNom() : null)
                .createdBy(a.getCreatedBy())
                .modifiedBy(a.getModifiedBy())
                .build();
    }

    public static Asset fromCreateDto(AssetCreateDto dto, ServiceDirection service){
        if (dto==null) return null;
        return Asset.builder()
                .nom(dto.getNom())
                .reference(dto.getReference())
                .description(dto.getDescription())
                .categorie(dto.getCategorie())
                .etat(dto.getEtat())
                .dateAcquisition(dto.getDateAcquisition())
                .valeur(dto.getValeur())
                .numeroSerie(dto.getNumeroSerie())
                .localisation(dto.getLocalisation())
                .service(service)
                .build();
    }

    public static void updateFromDto(Asset asset, AssetUpdateDto dto, ServiceDirection service){
        if (dto.getNom() != null) asset.setNom(dto.getNom());
        if (dto.getReference() != null) asset.setReference(dto.getReference());
        if (dto.getDescription() != null) asset.setDescription(dto.getDescription());
        if (dto.getCategorie() != null) asset.setCategorie(dto.getCategorie());
        if (dto.getEtat() != null) asset.setEtat(dto.getEtat());
        if (dto.getDateAcquisition() != null) asset.setDateAcquisition(dto.getDateAcquisition());
        if (dto.getValeur() != null) asset.setValeur(dto.getValeur());
        if (dto.getNumeroSerie() != null) asset.setNumeroSerie(dto.getNumeroSerie());
        if (dto.getLocalisation() != null) asset.setLocalisation(dto.getLocalisation());
        if (service != null) asset.setService(service);
    }
}
