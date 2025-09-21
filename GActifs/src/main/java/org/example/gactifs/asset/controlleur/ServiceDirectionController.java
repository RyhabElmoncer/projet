package org.example.gactifs.asset.controlleur;

import lombok.RequiredArgsConstructor;
import org.example.gactifs.asset.dto.ApiResponse;
import org.example.gactifs.asset.dto.PageResponse;
import org.example.gactifs.asset.dto.ServiceDirectionDto;
import org.example.gactifs.asset.mapper.ServiceMapper;
import org.example.gactifs.asset.models.ServiceDirection;
import org.example.gactifs.asset.services.ServiceDirectionService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auth/services")
@RequiredArgsConstructor
public class ServiceDirectionController {
    private final ServiceDirectionService service;

    @GetMapping
    public ApiResponse<List<ServiceDirectionDto>> getAll(@RequestParam(required = false) Boolean actif){
        List<ServiceDirectionDto> list = (actif != null && actif) ? service.getActive() : service.getAll();
        return ApiResponse.ok(list);
    }

    @GetMapping("/paginated")
    public ApiResponse<PageResponse<ServiceDirectionDto>> getPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size){
        Page<?> p = service.getPaginated(page, size);
        // map to DTOs:
        Page<ServiceDirectionDto> pageDto = p.map(s -> ServiceMapper.toDto((ServiceDirection) s));
        return ApiResponse.ok(PageResponse.fromPage(pageDto));
    }

    @GetMapping("/{id}")
    public ApiResponse<ServiceDirectionDto> getById(@PathVariable Long id){
        return ApiResponse.ok(service.getById(id));
    }

    @PostMapping
    public ApiResponse<ServiceDirectionDto> create(@RequestBody ServiceDirectionDto dto){
        return ApiResponse.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<ServiceDirectionDto> update(@PathVariable Long id, @RequestBody ServiceDirectionDto dto){
        return ApiResponse.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id){
        service.delete(id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/search")
    public ApiResponse<List<ServiceDirectionDto>> search(@RequestParam("q") String q){
        return ApiResponse.ok(service.search(q));
    }

    @PatchMapping("/{id}/toggle")
    public ApiResponse<ServiceDirectionDto> toggle(@PathVariable Long id){
        ServiceDirectionDto dto = service.getById(id);
        if (dto == null) return ApiResponse.error("Service introuvable");
        dto.setActif(!Boolean.TRUE.equals(dto.getActif()));
        return ApiResponse.ok(service.update(id, dto));
    }
}
