package org.example.gactifs.asset.services;

import org.example.gactifs.asset.dto.ServiceDirectionDto;
import org.example.gactifs.asset.mapper.ServiceMapper;
import org.example.gactifs.asset.models.ServiceDirection;
import org.example.gactifs.asset.repository.ServiceDirectionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceDirectionService {
    private final ServiceDirectionRepository repo;

    public List<ServiceDirectionDto> getAll(){
        return repo.findAll().stream().map(ServiceMapper::toDto).collect(Collectors.toList());
    }

    public List<ServiceDirectionDto> getActive(){
        return repo.findByActifTrue().stream().map(ServiceMapper::toDto).collect(Collectors.toList());
    }

    public Page<ServiceDirection> getPaginated(int page, int size){
        return repo.findAll(PageRequest.of(page, size));
    }

    public ServiceDirectionDto getById(Long id){
        return repo.findById(id).map(ServiceMapper::toDto).orElse(null);
    }

    public ServiceDirectionDto create(ServiceDirectionDto dto){
        ServiceDirection s = ServiceMapper.toEntity(dto);
        s.setId(null);
        ServiceDirection saved = repo.save(s);
        return ServiceMapper.toDto(saved);
    }

    public ServiceDirectionDto update(Long id, ServiceDirectionDto dto){
        return repo.findById(id).map(existing -> {
            existing.setNom(dto.getNom() != null ? dto.getNom() : existing.getNom());
            existing.setDescription(dto.getDescription() != null ? dto.getDescription() : existing.getDescription());
            existing.setCode(dto.getCode() != null ? dto.getCode() : existing.getCode());
            existing.setResponsable(dto.getResponsable() != null ? dto.getResponsable() : existing.getResponsable());
            existing.setEmail(dto.getEmail() != null ? dto.getEmail() : existing.getEmail());
            existing.setTelephone(dto.getTelephone() != null ? dto.getTelephone() : existing.getTelephone());
            existing.setActif(dto.getActif() == null ? existing.isActif() : dto.getActif());
            return ServiceMapper.toDto(repo.save(existing));
        }).orElse(null);
    }

    public void delete(Long id){
        repo.deleteById(id);
    }

    public List<ServiceDirectionDto> search(String q){
        return repo.findByNomContainingIgnoreCase(q).stream().map(ServiceMapper::toDto).collect(Collectors.toList());
    }
}
