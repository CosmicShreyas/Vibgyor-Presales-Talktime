import { Component, Input } from '@angular/core';
import { StatIconComponent, StatIconName } from './stat-icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [StatIconComponent],
  template: `
    <div class="rounded-2xl border border-border bg-stat-card p-5 text-stat-card-foreground shadow-card transition-transform hover:-translate-y-0.5">
      <div class="mb-3 flex items-start justify-between gap-3">
        <p class="text-sm font-medium text-stat-card-foreground/70">{{ label }}</p>
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-foreground shadow-sm">
          <app-stat-icon [name]="icon" />
        </div>
      </div>
      <p class="text-4xl font-semibold tracking-tight">{{ value }}</p>
      <p class="mt-3 text-sm text-stat-card-foreground/70">{{ description }}</p>
    </div>
  `,
})
export class StatCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number | string;
  @Input({ required: true }) description!: string;
  @Input({ required: true }) icon!: StatIconName;
}
