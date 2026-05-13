import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { PartnerProfileIconComponent } from './partner-profile-icon.component';

type FullProfile = {
  _id: string;
  partnerName: string;
  nickName: string;
  contactPerson1: string;
  phoneNo1: string;
  contactPerson2?: string;
  phoneNo2?: string;
  email: string;
  address: string;
  about?: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  pan: string;
  partnerCode: string;
  paymentTerms?: string;
  remarks?: string;
  isActive: boolean;
  createdAt: string;
  memberSince?: string;
};

@Component({
  selector: 'app-partner-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, PartnerProfileIconComponent],
  templateUrl: './partner-profile.component.html',
  styles: [
    `
      :host {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        min-height: 0;
      }

      .profile-status-badge {
        transition:
          background-color 200ms ease,
          color 200ms ease,
          box-shadow 200ms ease,
          transform 200ms ease;
      }

      .profile-status-badge:hover {
        background: color-mix(in oklch, var(--primary) 82%, white);
        color: #fff;
        box-shadow: 0 0 0 1px color-mix(in oklch, var(--primary) 55%, transparent);
        transform: translateY(-1px);
      }

      .about-editing-field {
        caret-color: var(--primary);
      }
    `,
  ],
})
export class PartnerProfileComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  @ViewChild('aboutInput') aboutInput?: ElementRef<HTMLTextAreaElement>;

  profile: FullProfile | null = null;
  error: string | null = null;
  editingAbout = false;
  aboutDraft = '';
  savingAbout = false;

  async ngOnInit(): Promise<void> {
    if (!this.auth.token()) return;
    try {
      this.profile = await firstValueFrom(this.http.get<FullProfile>('/api/brand-partners/profile'));
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Failed to load profile';
    }
  }

  initials(name?: string): string {
    if (!name) return 'BP';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  startEditAbout(): void {
    if (!this.profile) return;
    this.aboutDraft = this.profile.about ?? '';
    this.editingAbout = true;
    this.focusAboutInput();
  }

  cancelEditAbout(): void {
    this.editingAbout = false;
    this.aboutDraft = '';
  }

  async saveAbout(): Promise<void> {
    if (!this.profile) return;
    this.savingAbout = true;
    try {
      await firstValueFrom(
        this.http.put<FullProfile>('/api/brand-partners/profile/about', { about: this.aboutDraft }),
      );
      this.profile = { ...this.profile, about: this.aboutDraft };
      this.editingAbout = false;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Failed to save';
    } finally {
      this.savingAbout = false;
    }
  }

  private focusAboutInput(): void {
    queueMicrotask(() => {
      const input = this.aboutInput?.nativeElement;
      if (!input) return;
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
  }
}
