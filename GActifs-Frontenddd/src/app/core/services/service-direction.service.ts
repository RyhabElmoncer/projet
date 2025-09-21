
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {environment} from "../../../environments/environment";
import {
    ApiResponse,
    PageRequest,
    PageResponse,
    ServiceDirection,
    ServiceDirectionCreateDto, ServiceDirectionUpdateDto
} from "../../shared/models/service-direction.model";

@Injectable({
    providedIn: 'root'
})
export class ServiceDirectionService {
    private readonly baseUrl = `${environment.SERVER_API_URL_2}/services`;

    constructor(private http: HttpClient) {
    }

    // Get all services
    getAllServices(): Observable<ServiceDirection[]> {
        return this.http.get<ApiResponse<ServiceDirection[]>>(this.baseUrl)
            .pipe(map(response => response.data || []));
    }

    // Get active services only
    getActiveServices(): Observable<ServiceDirection[]> {
        const params = new HttpParams().set('actif', 'true');
        return this.http.get<ApiResponse<ServiceDirection[]>>(this.baseUrl, {params})
            .pipe(map(response => response.data || []));
    }

    // Get services with pagination
    getServicesPaginated(pageRequest: PageRequest): Observable<PageResponse<ServiceDirection>> {
        const params = new HttpParams()
            .set('page', pageRequest.page.toString())
            .set('size', pageRequest.size.toString())
            .set('sort', pageRequest.sort || 'nom')
            .set('direction', pageRequest.direction || 'asc');

        return this.http.get<ApiResponse<PageResponse<ServiceDirection>>>(`${this.baseUrl}/paginated`, {params})
            .pipe(map(response => response.data!));
    }

    // Get service by ID
    getServiceById(id: number): Observable<ServiceDirection> {
        return this.http.get<ApiResponse<ServiceDirection>>(`${this.baseUrl}/${id}`)
            .pipe(map(response => response.data!));
    }

    // Create new service
    createService(service: ServiceDirectionCreateDto): Observable<ServiceDirection> {
        return this.http.post<ApiResponse<ServiceDirection>>(this.baseUrl, service)
            .pipe(map(response => response.data!));
    }

    // Update existing service
    updateService(id: number, service: ServiceDirectionUpdateDto): Observable<ServiceDirection> {
        return this.http.put<ApiResponse<ServiceDirection>>(`${this.baseUrl}/${id}`, service)
            .pipe(map(response => response.data!));
    }

    // Delete service
    deleteService(id: number): Observable<void> {
        return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
            .pipe(map(() => void 0));
    }

    // Search services
    searchServices(query: string): Observable<ServiceDirection[]> {
        const params = new HttpParams().set('q', query);
        return this.http.get<ApiResponse<ServiceDirection[]>>(`${this.baseUrl}/search`, {params})
            .pipe(map(response => response.data || []));
    }

    // Toggle service status
    toggleServiceStatus(id: number): Observable<ServiceDirection> {
        return this.http.patch<ApiResponse<ServiceDirection>>(`${this.baseUrl}/${id}/toggle`, {})
            .pipe(map(response => response.data!));
    }
}