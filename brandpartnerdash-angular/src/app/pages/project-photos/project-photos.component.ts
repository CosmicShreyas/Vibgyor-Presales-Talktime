import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { LeadsIconComponent } from '../leads/leads-icon.component';

type LeadOption = { uniqueId: string; name: string; status: string };
type UploadedImage = {
  imageId: string;
  title: string;
  leadName: string;
  uploadedAt: string;
  tags?: string[];
};

@Component({
  selector: 'app-project-photos',
  standalone: true,
  imports: [CommonModule, FormsModule, LeadsIconComponent],
  templateUrl: './project-photos.component.html',
})
export class ProjectPhotosComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  open = false;
  leads: LeadOption[] = [];
  uploadedImages: UploadedImage[] = [];
  imageBlobUrls: Record<string, string> = {};
  loading = true;
  title = '';
  tags = '';
  selectedLead = '';
  photo: File | null = null;
  photoFileName = 'No file selected.';
  uploading = false;
  lightboxIndex: number | null = null;

  async ngOnInit(): Promise<void> {
    if (!this.auth.token()) return;
    await Promise.all([this.loadLeads(), this.loadImages()]);
  }

  private async loadLeads(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<{ leads: LeadOption[] }>('/api/brand-partners/leads'));
      this.leads = data.leads;
    } catch {
      this.leads = [];
    }
  }

  private async loadImages(): Promise<void> {
    this.loading = true;
    try {
      const data = await firstValueFrom(this.http.get<{ success: boolean; images: UploadedImage[] }>('/api/brand-partners/images'));
      if (data.success) {
        this.uploadedImages = data.images;
        for (const image of data.images) {
          void this.loadImageBlob(image.imageId);
        }
      }
    } catch {
      this.uploadedImages = [];
    } finally {
      this.loading = false;
    }
  }

  private async loadImageBlob(imageId: string): Promise<void> {
    try {
      const blob = await firstValueFrom(
        this.http.get(`/api/brand-partners/images/${imageId}`, { responseType: 'blob' }),
      );
      this.imageBlobUrls = { ...this.imageBlobUrls, [imageId]: URL.createObjectURL(blob) };
    } catch {
      // ignore
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.photo = file;
    this.photoFileName = file?.name ?? 'No file selected.';
  }

  closeUploadDialog(): void {
    this.open = false;
    this.title = '';
    this.tags = '';
    this.selectedLead = '';
    this.photo = null;
    this.photoFileName = 'No file selected.';
  }

  async handleUpload(): Promise<void> {
    if (!this.photo || !this.title || !this.selectedLead || !this.auth.token()) return;
    this.uploading = true;
    const formData = new FormData();
    formData.append('image', this.photo);
    formData.append('leadUniqueId', this.selectedLead);
    formData.append('title', this.title);
    formData.append('tags', this.tags);

    try {
      const data = await firstValueFrom(
        this.http.post<{ success: boolean; image: UploadedImage }>('/api/brand-partners/images/upload', formData),
      );
      if (data.success) {
        this.uploadedImages = [data.image, ...this.uploadedImages];
        await this.loadImageBlob(data.image.imageId);
        this.closeUploadDialog();
      }
    } finally {
      this.uploading = false;
    }
  }

  async handleDelete(imageId: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`/api/brand-partners/images/${imageId}`));
      this.uploadedImages = this.uploadedImages.filter((image) => image.imageId !== imageId);
      const next = { ...this.imageBlobUrls };
      delete next[imageId];
      this.imageBlobUrls = next;
    } catch {
      // ignore
    }
  }

  openLightbox(index: number): void {
    this.lightboxIndex = index;
  }

  closeLightbox(): void {
    this.lightboxIndex = null;
  }

  prevImage(): void {
    if (this.lightboxIndex === null) return;
    this.lightboxIndex = (this.lightboxIndex - 1 + this.uploadedImages.length) % this.uploadedImages.length;
  }

  nextImage(): void {
    if (this.lightboxIndex === null) return;
    this.lightboxIndex = (this.lightboxIndex + 1) % this.uploadedImages.length;
  }
}
