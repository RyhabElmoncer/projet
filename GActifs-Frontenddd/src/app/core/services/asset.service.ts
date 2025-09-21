// asset.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {environment} from "../../../environments/environment";
import {Asset, AssetCreateDto, AssetFilter, AssetStats, AssetUpdateDto} from '../../shared/models/asset.model';
import {ApiResponse, PageRequest, PageResponse} from "../../shared/models/service-direction.model";

@Injectable({
    providedIn: 'root'
})
export class AssetService {
    private readonly baseUrl = `${environment.SERVER_API_URL_2}/assets`;

    constructor(private http: HttpClient) {}

    // Get all assets with optional filtering
    getAllAssets(filter?: AssetFilter): Observable<Asset[]> {
        let params = new HttpParams();

        if (filter) {
            if (filter.serviceId) {
                params = params.set('serviceId', filter.serviceId.toString());
            }
            if (filter.status) {
                params = params.set('status', filter.status);
            }
            if (filter.category) {
                params = params.set('category', filter.category);
            }
            if (filter.searchTerm) {
                params = params.set('search', filter.searchTerm);
            }
            if (filter.dateAcquisitionFrom) {
                params = params.set('dateFrom', filter.dateAcquisitionFrom);
            }
            if (filter.dateAcquisitionTo) {
                params = params.set('dateTo', filter.dateAcquisitionTo);
            }
            if (filter.valeurMin) {
                params = params.set('valueMin', filter.valeurMin.toString());
            }
            if (filter.valeurMax) {
                params = params.set('valueMax', filter.valeurMax.toString());
            }
        }

        return this.http.get<ApiResponse<Asset[]>>(this.baseUrl, { params })
            .pipe(map(response => response.data || []));
    }

    // Get assets with pagination
    getAssetsPaginated(pageRequest: PageRequest, filter?: AssetFilter): Observable<PageResponse<Asset>> {
        let params = new HttpParams()
            .set('page', pageRequest.page.toString())
            .set('size', pageRequest.size.toString());

        if (pageRequest.sort) {
            params = params.set('sort', pageRequest.sort);
        }
        if (pageRequest.direction) {
            params = params.set('direction', pageRequest.direction);
        }

        if (filter) {
            if (filter.serviceId) {
                params = params.set('serviceId', filter.serviceId.toString());
            }
            if (filter.status) {
                params = params.set('status', filter.status);
            }
            if (filter.category) {
                params = params.set('category', filter.category);
            }
            if (filter.searchTerm) {
                params = params.set('search', filter.searchTerm);
            }
        }

        return this.http.get<ApiResponse<PageResponse<Asset>>>(`${this.baseUrl}/paginated`, { params })
            .pipe(map(response => response.data!));
    }

    // Get asset by ID
    getAssetById(id: number): Observable<Asset> {
        return this.http.get<ApiResponse<Asset>>(`${this.baseUrl}/${id}`)
            .pipe(map(response => response.data!));
    }

    // Create new asset
    createAsset(asset: AssetCreateDto): Observable<Asset> {
        return this.http.post<ApiResponse<Asset>>(this.baseUrl, asset)
            .pipe(map(response => response.data!));
    }

    // Update existing asset
    updateAsset(id: number, asset: AssetUpdateDto): Observable<Asset> {
        return this.http.put<ApiResponse<Asset>>(`${this.baseUrl}/${id}`, asset)
            .pipe(map(response => response.data!));
    }

    // Delete asset
    deleteAsset(id: number): Observable<void> {
        return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
            .pipe(map(() => void 0));
    }

    // Get asset statistics
    getAssetStats(): Observable<AssetStats> {
        return this.http.get<ApiResponse<AssetStats>>(`${this.baseUrl}/stats`)
            .pipe(map(response => response.data!));
    }

    // Export assets to Excel
    exportAssets(assets?: Asset[]): Observable<Blob> {
        const exportData = assets ? { assets } : {};
        return this.http.post(`${this.baseUrl}/export`, exportData, {
            responseType: 'blob'
        });
    }

    // Bulk operations
    bulkUpdateStatus(assetIds: number[], status: string): Observable<Asset[]> {
        return this.http.patch<ApiResponse<Asset[]>>(`${this.baseUrl}/bulk/status`, {
            assetIds,
            status
        }).pipe(map(response => response.data!));
    }

    bulkDelete(assetIds: number[]): Observable<void> {
        return this.http.request<ApiResponse<void>>('delete', this.baseUrl, {
            body: { assetIds }
        }).pipe(map(() => void 0));
    }

    // Search assets with advanced filters
    searchAssets(query: string): Observable<Asset[]> {
        const params = new HttpParams().set('q', query);
        return this.http.get<ApiResponse<Asset[]>>(`${this.baseUrl}/search`, { params })
            .pipe(map(response => response.data || []));
    }

    // Get assets by service
    getAssetsByService(serviceId: number): Observable<Asset[]> {
        return this.http.get<ApiResponse<Asset[]>>(`${this.baseUrl}/service/${serviceId}`)
            .pipe(map(response => response.data || []));
    }

    // Get assets history (audit log)
    getAssetHistory(assetId: number): Observable<any[]> {
        return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/${assetId}/history`)
            .pipe(map(response => response.data || []));
    }
}
