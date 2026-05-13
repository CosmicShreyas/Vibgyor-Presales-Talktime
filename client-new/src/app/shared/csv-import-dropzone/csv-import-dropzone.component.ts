import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-csv-import-dropzone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './csv-import-dropzone.component.html',
})
export class CsvImportDropzoneComponent {
  /** When set, shown under the hint (e.g. chosen file name from parent) */
  readonly selectedName = input<string | null>(null);
  /** Unique id for the hidden file input (required if multiple dropzones on one page) */
  readonly inputId = input('csv-import-dropzone');
  readonly disabled = input(false);
  readonly fileSelected = output<File | null>();

  readonly dragOver = signal(false);

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (!this.disabled()) this.dragOver.set(true);
  }

  onDragLeave(ev: DragEvent): void {
    ev.preventDefault();
    const el = ev.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    if (ev.clientX <= r.left || ev.clientX >= r.right || ev.clientY <= r.top || ev.clientY >= r.bottom) {
      this.dragOver.set(false);
    }
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.dragOver.set(false);
    if (this.disabled()) return;
    const f = ev.dataTransfer?.files?.[0];
    if (!f) return;
    const ok = f.name.toLowerCase().endsWith('.csv') || f.type === 'text/csv' || f.type === 'application/vnd.ms-excel';
    if (ok) this.fileSelected.emit(f);
  }

  onInputChange(ev: Event): void {
    const inp = ev.target as HTMLInputElement;
    const f = inp.files?.[0] ?? null;
    this.fileSelected.emit(f);
    inp.value = '';
  }

  browse(inp: HTMLInputElement): void {
    if (!this.disabled()) inp.click();
  }
}
