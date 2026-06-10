import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BracketGender } from '../../models/bracket.model';
import { AdminBracketsService } from '../services/admin-brackets.service';

@Component({
  selector: 'app-admin-bracket-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-bracket-form.component.html',
  styleUrl: './admin-bracket-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBracketFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly bracketsService = inject(AdminBracketsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly saveError = signal(false);
  protected readonly bracketId = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly isEdit = Number.isFinite(this.bracketId) && this.bracketId > 0;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    numberOfPairs: [16, [Validators.required, Validators.min(2), Validators.max(64)]],
    gender: ['MASCULINO' as BracketGender, Validators.required],
    orderNumber: [1, [Validators.required, Validators.min(1)]],
    publicVisible: [true],
  });

  constructor() {
    if (this.isEdit) {
      this.loading.set(true);
      this.bracketsService.getBracket(this.bracketId).subscribe({
        next: (bracket) => {
          this.form.patchValue({
            name: bracket.name,
            description: bracket.description ?? '',
            numberOfPairs: bracket.numberOfPairs,
            gender: bracket.gender,
            orderNumber: bracket.orderNumber,
            publicVisible: bracket.publicVisible,
          });
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.saveError.set(true);
        },
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set(false);

    const formValue = this.form.getRawValue();
    const request = {
      ...formValue,
      description: formValue.description || null,
    };
    const save$ = this.isEdit
      ? this.bracketsService.updateBracket(this.bracketId, request)
      : this.bracketsService.createBracket(request);

    save$.subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigateByUrl('/admin/brackets');
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set(true);
      },
    });
  }
}
