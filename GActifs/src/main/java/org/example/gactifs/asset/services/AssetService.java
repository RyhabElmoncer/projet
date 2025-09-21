package org.example.gactifs.asset.services;


import org.example.gactifs.asset.dto.AssetCreateDto;
import org.example.gactifs.asset.dto.AssetDto;
import org.example.gactifs.asset.dto.AssetUpdateDto;
import org.example.gactifs.asset.enums.AssetStatus;
import org.example.gactifs.asset.mapper.AssetMapper;
import org.example.gactifs.asset.models.Asset;
import org.example.gactifs.asset.models.AssetHistory;
import org.example.gactifs.asset.models.ServiceDirection;
import org.example.gactifs.asset.repository.AssetHistoryRepository;
import org.example.gactifs.asset.repository.AssetRepository;
import org.example.gactifs.asset.repository.ServiceDirectionRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AssetService {
    private final AssetRepository repo;
    private final ServiceDirectionRepository serviceRepo;
    private final AssetHistoryRepository historyRepo;

    public List<AssetDto> getAll(Map<String, String> filters){
        // simple filter implementation: search param q, serviceId, status, category
        List<Asset> all = repo.findAll();
        Stream<Asset> stream = all.stream();

        if (filters != null) {
            if (filters.containsKey("serviceId")) {
                Long sid = Long.valueOf(filters.get("serviceId"));
                stream = stream.filter(a -> a.getService() != null && sid.equals(a.getService().getId()));
            }
            if (filters.containsKey("status")) {
                String s = filters.get("status");
                stream = stream.filter(a -> a.getEtat() != null && a.getEtat().name().equalsIgnoreCase(s));
            }
            if (filters.containsKey("search")) {
                String q = filters.get("search").toLowerCase();
                stream = stream.filter(a ->
                        (a.getNom() != null && a.getNom().toLowerCase().contains(q)) ||
                                (a.getReference() != null && a.getReference().toLowerCase().contains(q))
                );
            }
        }
        return stream.map(AssetMapper::toDto).collect(Collectors.toList());
    }

    public Page<AssetDto> getPaginated(int page, int size, String sort, String direction, Map<String,String> filters){
        Sort.Direction dir = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort s = Sort.by(dir, (sort == null || sort.isBlank()) ? "id" : sort);
        Pageable p = PageRequest.of(page, size, s);

        // naive: if serviceId filter present, use repo.findByServiceId
        if (filters != null && filters.containsKey("serviceId")) {
            Long sid = Long.valueOf(filters.get("serviceId"));
            Page<Asset> pageRes = repo.findByServiceId(sid, p);
            return pageRes.map(AssetMapper::toDto);
        }

        Page<Asset> pageRes = repo.findAll(p);
        // further filter/search could be applied, but for simplicity we return page
        return pageRes.map(AssetMapper::toDto);
    }

    public AssetDto getById(Long id){
        return repo.findById(id).map(AssetMapper::toDto).orElse(null);
    }

    public AssetDto create(AssetCreateDto dto, String actor){
        ServiceDirection s = serviceRepo.findById(dto.getServiceId()).orElse(null);
        Asset asset = AssetMapper.fromCreateDto(dto, s);
        asset.setDateCreation(LocalDateTime.now());
        asset.setCreatedBy(actor);
        Asset saved = repo.save(asset);
        saveHistory(saved.getId(), "CREATED", "Création de l'actif", actor);
        return AssetMapper.toDto(saved);
    }

    public AssetDto update(Long id, AssetUpdateDto dto, String actor){
        return repo.findById(id).map(existing -> {
            ServiceDirection s = null;
            if (dto.getServiceId() != null) {
                s = serviceRepo.findById(dto.getServiceId()).orElse(null);
            }
            AssetMapper.updateFromDto(existing, dto, s);
            existing.setDateModification(LocalDateTime.now());
            existing.setModifiedBy(actor);
            Asset saved = repo.save(existing);
            saveHistory(saved.getId(), "UPDATED", "Mise à jour", actor);
            return AssetMapper.toDto(saved);
        }).orElse(null);
    }

    public void delete(Long id, String actor){
        repo.findById(id).ifPresent(a -> {
            repo.delete(a);
            saveHistory(id, "DELETED", "Suppression", actor);
        });
    }

    public Map<String, Object> stats(){
        long total = repo.count();
        long enService = repo.countByEtat(AssetStatus.EN_SERVICE);
        long enPanne = repo.countByEtat(AssetStatus.EN_PANNE);
        long maintenance = repo.countByEtat(AssetStatus.EN_MAINTENANCE);
        long hors = repo.countByEtat(AssetStatus.HORS_USAGE);
        BigDecimal totalValue = repo.findAll().stream()
                .map(a -> a.getValeur() == null ? BigDecimal.ZERO : a.getValeur())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String,Object> m = new HashMap<>();
        m.put("totalAssets", total);
        m.put("activeAssets", enService);
        m.put("brokenAssets", enPanne);
        m.put("maintenanceAssets", maintenance);
        m.put("outOfServiceAssets", hors);
        m.put("totalValue", totalValue);
        return m;
    }

    public byte[] exportCsv(List<Long> assetIds){
        List<Asset> assets = assetIds == null || assetIds.isEmpty() ? repo.findAll() : repo.findAllById(assetIds);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter pw = new PrintWriter(baos);
        pw.println("id,nom,reference,categorie,etat,dateAcquisition,valeur,numeroSerie,localisation,service");
        assets.forEach(a -> {
            pw.printf("%d,%s,%s,%s,%s,%s,%s,%s,%s%n",
                    a.getId(),
                    safe(a.getNom()),
                    safe(a.getReference()),
                    a.getCategorie() == null ? "" : a.getCategorie().name(),
                    a.getEtat() == null ? "" : a.getEtat().name(),
                    a.getDateAcquisition() == null ? "" : a.getDateAcquisition().toString(),
                    a.getValeur() == null ? "" : a.getValeur().toString(),
                    safe(a.getNumeroSerie()),
                    a.getService() != null ? safe(a.getService().getNom()) : ""
            );
        });
        pw.flush();
        return baos.toByteArray();
    }

    private String safe(String s){ return s == null ? "" : s.replaceAll(",", " "); }

    public List<AssetDto> bulkUpdateStatus(List<Long> ids, String status, String actor){
        AssetStatus st = AssetStatus.valueOf(status);
        List<Asset> assets = repo.findAllById(ids);
        assets.forEach(a -> {
            a.setEtat(st);
            a.setDateModification(LocalDateTime.now());
            a.setModifiedBy(actor);
        });
        List<Asset> saved = repo.saveAll(assets);
        saved.forEach(a -> saveHistory(a.getId(), "STATUS_CHANGED", "Changement d'état en "+status, actor));
        return saved.stream().map(AssetMapper::toDto).collect(Collectors.toList());
    }

    public void bulkDelete(List<Long> ids, String actor){
        List<Asset> assets = repo.findAllById(ids);
        repo.deleteAll(assets);
        ids.forEach(id -> saveHistory(id, "DELETED", "Suppression en masse", actor));
    }

    public List<AssetDto> search(String q){
        return repo.findByNomContainingIgnoreCaseOrReferenceContainingIgnoreCase(q, q)
                .stream().map(AssetMapper::toDto).collect(Collectors.toList());
    }

    public List<AssetDto> getByService(Long serviceId){
        return repo.findByServiceId(serviceId).stream().map(AssetMapper::toDto).collect(Collectors.toList());
    }

    public List<AssetHistory> getHistory(Long assetId){
        return historyRepo.findByAssetIdOrderByTimestampDesc(assetId);
    }

    private void saveHistory(Long assetId, String action, String details, String actor){
        AssetHistory h = AssetHistory.builder()
                .assetId(assetId)
                .action(action)
                .details(details)
                .timestamp(LocalDateTime.now())
                .performedBy(actor)
                .build();
        historyRepo.save(h);
    }
}
