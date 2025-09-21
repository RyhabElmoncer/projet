import { Component, OnInit, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef, Renderer2, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [RouterOutlet, CommonModule, FormsModule, RouterLinkActive, RouterLink],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('menuToggle') menuToggle!: ElementRef<HTMLButtonElement>;
    @ViewChild('sidebar') sidebar!: ElementRef<HTMLDivElement>;
    @ViewChild('overlay') overlay!: ElementRef<HTMLDivElement>;

    private isBrowser: boolean;
    private menuClickUnlisten: (() => void) | null = null;
    private overlayClickUnlisten: (() => void) | null = null;
    private resizeUnlisten: (() => void) | null = null;

    sidebarOpen = false;
    isMobile = false;

    constructor(
        private authService: AuthService,
        private renderer: Renderer2,
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    ngOnInit(): void {
        if (this.isBrowser) {
            this.checkScreenSize();
        }
    }

    ngAfterViewInit(): void {
        if (!this.isBrowser) return;

        this.setupEventListeners();
    }

    ngOnDestroy(): void {
        // Remove all listeners
        if (this.menuClickUnlisten) this.menuClickUnlisten();
        if (this.overlayClickUnlisten) this.overlayClickUnlisten();
        if (this.resizeUnlisten) this.resizeUnlisten();
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: any): void {
        if (!this.isBrowser) return;

        this.checkScreenSize();

        // Auto-close sidebar on mobile when resizing to desktop
        if (!this.isMobile && this.sidebarOpen) {
            this.closeSidebar();
        }
    }

    @HostListener('document:keydown.escape', ['$event'])
    onEscapeKey(event: KeyboardEvent): void {
        if (!this.isBrowser) return;

        if (this.sidebarOpen && this.isMobile) {
            this.closeSidebar();
        }
    }

    private checkScreenSize(): void {
        if (!this.isBrowser) return;

        this.isMobile = window.innerWidth < 1024;

        // On desktop, sidebar should be visible by default
        if (!this.isMobile) {
            this.sidebarOpen = true;
            // Ensure sidebar classes are correct on desktop
            if (this.sidebar?.nativeElement) {
                this.sidebar.nativeElement.classList.add('open');
                this.overlay?.nativeElement?.classList.remove('active');
            }
        } else {
            this.sidebarOpen = false;
            // Ensure sidebar is closed on mobile initially
            if (this.sidebar?.nativeElement) {
                this.sidebar.nativeElement.classList.remove('open');
                this.overlay?.nativeElement?.classList.remove('active');
            }
        }
    }

    private setupEventListeners(): void {
        // Setup menu toggle click
        if (this.menuToggle && this.sidebar && this.overlay) {
            this.menuClickUnlisten = this.renderer.listen(
                this.menuToggle.nativeElement,
                'click',
                () => {
                    this.toggleSidebar();
                }
            );

            this.overlayClickUnlisten = this.renderer.listen(
                this.overlay.nativeElement,
                'click',
                () => {
                    this.closeSidebar();
                }
            );
        }

        // Setup resize listener
        this.resizeUnlisten = this.renderer.listen('window', 'resize', () => {
            this.onResize(null);
        });

        // Close sidebar when clicking on router links on mobile
        this.renderer.listen('document', 'click', (event) => {
            const target = event.target as HTMLElement;
            if (target.classList.contains('nav-link') && this.isMobile) {
                setTimeout(() => {
                    this.closeSidebar();
                }, 200);
            }
        });
    }

    toggleSidebar(): void {
        if (!this.isBrowser) return;

        this.sidebarOpen = !this.sidebarOpen;

        if (this.sidebar?.nativeElement && this.overlay?.nativeElement) {
            if (this.sidebarOpen) {
                this.sidebar.nativeElement.classList.add('open');
                this.overlay.nativeElement.classList.add('active');
            } else {
                this.sidebar.nativeElement.classList.remove('open');
                this.overlay.nativeElement.classList.remove('active');
            }
        }
    }

    closeSidebar(): void {
        if (!this.isBrowser) return;

        if (this.isMobile) {
            this.sidebarOpen = false;

            if (this.sidebar?.nativeElement && this.overlay?.nativeElement) {
                this.sidebar.nativeElement.classList.remove('open');
                this.overlay.nativeElement.classList.remove('active');
            }
        }
    }

    openSidebar(): void {
        if (!this.isBrowser) return;

        this.sidebarOpen = true;

        if (this.sidebar?.nativeElement && this.overlay?.nativeElement) {
            this.sidebar.nativeElement.classList.add('open');
            this.overlay.nativeElement.classList.add('active');
        }
    }

    logout(): void {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            this.authService.logout();
        }
    }

    // Method to get current route for dynamic header title
    getCurrentRoute(): string {
        const url = this.router.url;
        const segments = url.split('/').filter(segment => segment);

        if (segments.length === 0 || segments[0] !== 'dashboard') {
            return 'Dashboard';
        }

        switch (segments[1]) {
            case 'assetmanagement':
                return 'Gestion des actifs';
            case 'users':
                return 'Utilisateurs';
            case 'analytics':
                return 'Analyses';
            case 'reports':
                return 'Rapports';
            case 'settings':
                return 'Paramètres';
            default:
                return 'Tableau de bord';
        }
    }

    // Method to check if a route is active (alternative to routerLinkActive)
    isRouteActive(route: string): boolean {
        return this.router.url === route;
    }

    // Method for handling navigation programmatically
    navigateTo(route: string): void {
        this.router.navigate([route]);

        // Close sidebar on mobile after navigation
        if (this.isMobile) {
            setTimeout(() => {
                this.closeSidebar();
            }, 200);
        }
    }

    // Method to handle user menu actions
    onUserMenuAction(action: string): void {
        switch (action) {
            case 'profile':
                this.navigateTo('/dashboard/profile');
                break;
            case 'settings':
                this.navigateTo('/dashboard/settings');
                break;
            case 'logout':
                this.logout();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    // Method to handle notifications
    onNotificationClick(): void {
        // Add your notification logic here
        console.log('Notifications clicked');
        // this.notificationService.markAsRead();
        // this.router.navigate(['/dashboard/notifications']);
    }

    // Method to handle settings
    onSettingsClick(): void {
        this.navigateTo('/dashboard/settings');
    }
}