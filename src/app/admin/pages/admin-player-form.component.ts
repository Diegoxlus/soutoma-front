import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../auth/services/auth.service';
import { PlayerGender, PlayerRequest, PlayerResponse } from '../../models/player.model';
import { AdminPlayersService } from '../services/admin-players.service';

@Component({
  selector: 'app-admin-player-form',
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-player-form.component.html',
  styleUrl: './admin-player-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPlayerFormComponent {
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly playersService = inject(AdminPlayersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly imageError = signal<string | null>(null);
  protected readonly playerId = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly isEdit = Number.isFinite(this.playerId) && this.playerId > 0;

  protected readonly navItems = [
    { label: 'Inicio', description: 'Resumen general', route: '/admin' },
    { label: 'Cuadros', description: 'Gestionar torneos', route: '/admin/brackets' },
    { label: 'Jugadores', description: 'Gestionar jugadores', route: '/players' },
    { label: 'Patrocinadores', description: 'Gestionar sponsors', route: '/admin/sponsors' },
  ] as const;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    surnames: ['', Validators.required],
    dni: [''],
    phone: [''],
    gender: ['' as PlayerGender | ''],
    imageBase64: [''],
  });

  constructor() {
    const player = this.router.getCurrentNavigation()?.extras.state?.['player'] as PlayerResponse | undefined;

    if (player) {
      this.form.patchValue({
        name: player.name,
        surnames: player.surnames,
        dni: player.dni ?? '',
        phone: player.phone ?? '',
        gender: player.gender ?? '',
        imageBase64: player.imageBase64 ?? '',
      });
      this.imagePreview.set(player.imageBase64 ?? null);
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.imageError.set('Selecciona un archivo de imagen.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result ?? '');
      this.form.controls.imageBase64.setValue(image);
      this.imagePreview.set(image);
      this.imageError.set(null);
    };
    reader.onerror = () => {
      this.imageError.set('No se pudo leer la imagen.');
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.form.controls.imageBase64.setValue('');
    this.imagePreview.set(null);
    this.imageError.set(null);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    const formValue = this.form.getRawValue();
    const request: PlayerRequest = {
      name: formValue.name,
      surnames: formValue.surnames,
      dni: formValue.dni || null,
      phone: formValue.phone || null,
      gender: formValue.gender || null,
      imageBase64: formValue.imageBase64 || null,
    };

    const save$ = this.isEdit
      ? this.playersService.updatePlayer(this.playerId, request)
      : this.playersService.createPlayer(request);

    save$.subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigateByUrl('/players');
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set(
          this.isEdit
            ? 'No se pudo guardar la edición. El OpenAPI actual no publica endpoint de actualización.'
            : 'No se pudo crear el jugador. Revisa los datos o la sesión.',
        );
      },
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/admin/login');
  }
}
