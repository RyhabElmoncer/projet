package org.example.gactifs.asset.controlleur;

import lombok.RequiredArgsConstructor;
import org.example.gactifs.asset.dto.*;
import org.example.gactifs.asset.models.AssetHistory;
import org.example.gactifs.asset.services.AssetService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/auth/assets")
@RequiredArgsConstructor
public class AssetController {
    private final AssetService service;

    @GetMapping
    public ApiResponse<List<AssetDto>> getAll(
            @RequestParam Map<String,String> filters
    ){
        return ApiResponse.ok(service.getAll(filters));
    }

    @GetMapping("/paginated")
    public ApiResponse<PageResponse<AssetDto>> getPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String direction,
            @RequestParam Map<String,String> filters
    ){
        Page<AssetDto> p = service.getPaginated(page, size, sort, direction, filters);
        return ApiResponse.ok(PageResponse.fromPage(p));
    }

    @GetMapping("/{id}")
    public ApiResponse<AssetDto> getById(@PathVariable Long id){
        return ApiResponse.ok(service.getById(id));
    }

    @PostMapping
    public ApiResponse<AssetDto> create(@RequestBody AssetCreateDto dto){
        // actor can come from auth; for now use "system"
        return ApiResponse.ok(service.create(dto, "system"));
    }

    @PutMapping("/{id}")
    public ApiResponse<AssetDto> update(@PathVariable Long id, @RequestBody AssetUpdateDto dto){
        return ApiResponse.ok(service.update(id, dto, "system"));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id){
        service.delete(id, "system");
        return ApiResponse.ok(null);
    }

    @PatchMapping("/bulk/status")
    public ApiResponse<List<AssetDto>> bulkUpdateStatus(@RequestBody Map<String, Object> body){
        List<Integer> idsInt = (List<Integer>) body.get("assetIds");
        String status = (String) body.get("status");
        List<Long> ids = idsInt.stream().map(Integer::longValue).collect(Collectors.toList());
        return ApiResponse.ok(service.bulkUpdateStatus(ids, status, "system"));
    }

    @RequestMapping(method = RequestMethod.DELETE)
    public ApiResponse<Void> bulkDelete(@RequestBody Map<String, List<Long>> body){
        List<Long> ids = body.get("assetIds");
        service.bulkDelete(ids, "system");
        return ApiResponse.ok(null);
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String,Object>> stats(){
        return ApiResponse.ok(service.stats());
    }

    @PostMapping("/export")
    public ResponseEntity<byte[]> exportAssets(@RequestBody(required = false) Map<String, List<Long>> body){
        List<Long> ids = body != null ? body.get("assets") : null;
        byte[] csv = service.exportCsv(ids);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"assets.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/search")
    public ApiResponse<List<AssetDto>> search(@RequestParam("q") String q){
        return ApiResponse.ok(service.search(q));
    }

    @GetMapping("/service/{serviceId}")
    public ApiResponse<List<AssetDto>> byService(@PathVariable Long serviceId){
        return ApiResponse.ok(service.getByService(serviceId));
    }

    @GetMapping("/{assetId}/history")
    public ApiResponse<List<AssetHistory>> history(@PathVariable Long assetId){
        return ApiResponse.ok(service.getHistory(assetId));
    }
}
