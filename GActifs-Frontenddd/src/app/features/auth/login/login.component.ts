import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {AuthService} from "../../../core/services/auth.service";
import {FormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    standalone: true,
    imports: [
        FormsModule,
        NgIf
    ],
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    email: string = '';
    password: string = '';
    loading: boolean = false;
    errorMessage: string = '';

    constructor(private authService: AuthService, private router: Router) {}

    onLogin(): void {
        this.errorMessage = '';
        if (!this.email || !this.password) {
            this.errorMessage = 'Veuillez remplir tous les champs.';
            return;
        }

        this.loading = true;
        this.authService.login(this.email, this.password).subscribe({
            next: () => {
                this.loading = false;
                const role = this.authService.getRole();
                if (role === 'ADMIN') {
                    this.router.navigate(['/dashboard']);
                } else {
                    this.router.navigate(['/dashboard']);
                }
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                this.errorMessage = 'Email ou mot de passe incorrect.';
            }
        });
    }
}
