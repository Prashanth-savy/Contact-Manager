import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="search-container">
      <div class="search-wrapper">
        <div class="search-input-container">
          <span class="search-icon"></span>
          <input
            type="text"
            [formControl]="searchControl"
            class="search-input"
            placeholder="Search contacts by name or email..."
            autocomplete="off"
            [class.has-value]="searchControl.value && searchControl.value.length > 0"
          />
          <button
            *ngIf="searchControl.value && searchControl.value.length > 0"
            type="button"
            class="clear-button"
            (click)="clearSearch()"
            title="Clear search"
          >
            <span class="clear-icon">✕</span>
          </button>
        </div>
        
        <div class="search-results-info" *ngIf="searchControl.value && searchControl.value.length > 0">
          <span class="search-badge">
            <span class="search-icon-small">🔍</span>
            "{{ searchControl.value }}"
          </span>
          <span class="search-hint">Typos and partial matches supported</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      width: 100%;
      position: relative;
    }

    .search-wrapper {
      position: relative;
    }

    .search-input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-input {
      width: 100%;
      padding: 1rem 1rem 1rem 3rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      box-sizing: border-box;
      outline: none;
      color: #333;
      font-weight: 400;
    }

    .search-input::placeholder {
      color: #999;
      font-weight: 400;
    }

    .search-input:focus {
      border-color: rgba(255, 255, 255, 0.8);
      background: white;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .search-input.has-value {
      border-color: rgba(40, 167, 69, 0.6);
      background: #f8fff9;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      font-size: 1.2rem;
      color: #999;
      z-index: 1;
      pointer-events: none;
      transition: all 0.3s ease;
    }

    .search-input:focus + .search-icon {
      color: #667eea;
    }

    .clear-button {
      position: absolute;
      right: 0.75rem;
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(108, 117, 125, 0.1);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      color: #666;
      backdrop-filter: blur(10px);
    }

    .clear-button:hover {
      background: rgba(220, 53, 69, 0.1);
      color: #dc3545;
      transform: scale(1.1);
    }

    .clear-icon {
      font-size: 0.9rem;
      font-weight: 600;
    }

    .search-results-info {
      margin-top: 0.75rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-badge {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      color: #667eea;
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      border: 1px solid rgba(102, 126, 234, 0.2);
    }

    .search-icon-small {
      font-size: 0.8rem;
    }

    .search-hint {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.8rem;
      font-weight: 300;
      padding: 0.3rem 0.6rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    /* Enhanced animations */
    @keyframes searchPulse {
      0% {
        box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(102, 126, 234, 0);
      }
    }

    .search-input:focus {
      animation: searchPulse 2s infinite;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .search-results-info {
      animation: slideIn 0.3s ease-out;
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .search-input {
        padding: 1rem 1rem 1rem 2.8rem;
        font-size: 1rem;
        border-radius: 14px;
      }

      .search-icon {
        left: 0.9rem;
        font-size: 1.1rem;
      }

      .clear-button {
        right: 0.7rem;
        width: 30px;
        height: 30px;
      }

      .search-results-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .search-input {
        padding: 0.9rem 0.9rem 0.9rem 2.6rem;
        font-size: 0.95rem;
      }

      .search-badge {
        font-size: 0.8rem;
        padding: 0.3rem 0.6rem;
      }

      .search-hint {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
      }
    }

    /* Accessibility */
    .search-input:focus-visible {
      outline: 2px solid #667eea;
      outline-offset: 2px;
    }

    .clear-button:focus-visible {
      outline: 2px solid #667eea;
      outline-offset: 2px;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .search-input {
        border-width: 3px;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .search-input,
      .clear-button {
        transition: none;
      }
      
      .search-results-info {
        animation: none;
      }
      
      .search-input:focus {
        animation: none;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .search-input {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-color: rgba(255, 255, 255, 0.2);
      }

      .search-input::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }

      .search-badge {
        background: rgba(0, 0, 0, 0.3);
        color: #a0b4ff;
        border-color: rgba(160, 180, 255, 0.3);
      }
    }
  `]
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Output() searchChanged = new EventEmitter<string>();

  searchControl = new FormControl('');
  private subscription = new Subscription();

  ngOnInit(): void {
    // Set up debounced search with faster response
    const searchSub = this.searchControl.valueChanges.pipe(
      debounceTime(250), // Reduced debounce for faster search
      distinctUntilChanged()
    ).subscribe(value => {
      const searchValue = value || '';
      this.searchChanged.emit(searchValue);
    });

    this.subscription.add(searchSub);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.searchChanged.emit('');
  }
}