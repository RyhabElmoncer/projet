import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        // HttpClient using Fetch API
        provideHttpClient(withFetch()),
        // Import external modules
        importProvidersFrom(
            BrowserAnimationsModule,
            NgbModule,
            ToastrModule.forRoot({
                positionClass: 'toast-top-right',
                preventDuplicates: true,
                timeOut: 3000,
                closeButton: true,
                progressBar: true
            })
        ),
    ]
};
