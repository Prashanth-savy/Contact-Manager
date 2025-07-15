import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactService, Contact } from '../../services/contact.service';
import { Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contact-list-container">
      <!-- Loading State -->
      <div *ngIf="isLoading && displayedContacts.length === 0" class="loading-container">
        <div class="loading-animation">
          <div class="spinner-modern"></div>
          <p>Loading contacts...</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage && !isLoading && displayedContacts.length === 0" class="error-container">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>{{ errorMessage }}</p>
          <button class="btn btn-primary" (click)="retryLoad()">
            <span class="btn-icon">🔄</span>
            Try Again
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && !errorMessage && allContacts.length === 0 && !searchQuery" class="empty-container">
        <div class="empty-content">
          <div class="empty-icon">📭</div>
          <h3>No contacts yet</h3>
          <p>Start by adding your first contact using the + button above.</p>
        </div>
      </div>

      <!-- No Search Results -->
      <div *ngIf="!isLoading && !errorMessage && allContacts.length === 0 && searchQuery" class="empty-container">
        <div class="empty-content">
          <div class="empty-icon">🔍</div>
          <h3>No matches found</h3>
          <p>No contacts match "<strong>{{ searchQuery }}</strong>"</p>
          <p class="search-hint">Try different keywords or check for typos</p>
        </div>
      </div>

      <!-- Contact List -->
      <div *ngIf="!isLoading && !errorMessage && allContacts.length > 0" class="contacts-wrapper">
        <div class="list-header">
          <div class="list-stats">
            <h3 class="contact-count">
              {{ allContacts.length }} 
              {{ allContacts.length === 1 ? 'Contact' : 'Contacts' }}
            </h3>
            <p class="search-info" *ngIf="searchQuery">
              <span class="search-badge">🔍 "{{ searchQuery }}"</span>
            </p>
          </div>
          <button 
            class="refresh-btn" 
            (click)="refreshContacts()"
            [disabled]="isLoading"
            title="Refresh contacts">
            <span class="refresh-icon" [class.spinning]="isLoading">🔄</span>
          </button>
        </div>

        <div class="contacts-grid" #contactsContainer>
          <div 
            *ngFor="let contact of displayedContacts; trackBy: trackByContactId" 
            class="contact-card"
            [class.deleting]="deletingIds.has(contact.id!)">
            
            <div class="contact-avatar">
              {{ getInitials(contact.name) }}
            </div>
            
            <div class="contact-details">
              <h4 class="contact-name">{{ contact.name }}</h4>
              <div class="contact-email">
                <span class="email-icon">📧</span>
                <a [href]="'mailto:' + contact.email" class="email-link">
                  {{ contact.email }}
                </a>
              </div>
              <div class="contact-meta" *ngIf="contact.created_at">
                <span class="meta-icon">📅</span>
                <span class="meta-text">Added {{ formatDate(contact.created_at) }}</span>
              </div>
            </div>
            
            <div class="contact-actions">
              <button 
                class="action-btn edit-btn" 
                (click)="editContact(contact)"
                [disabled]="deletingIds.has(contact.id!)"
                title="Edit contact">
                <span class="action-icon">✏️</span>
              </button>
              <button 
                class="action-btn delete-btn" 
                (click)="deleteContact(contact)"
                [disabled]="deletingIds.has(contact.id!)"
                title="Delete contact">
                <span *ngIf="!deletingIds.has(contact.id!)" class="action-icon">🗑️</span>
                <span *ngIf="deletingIds.has(contact.id!)" class="spinner-small"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Lazy Loading Indicator -->
        <div *ngIf="isLoadingMore && displayedContacts.length > 0" class="loading-more">
          <div class="spinner-small"></div>
          <span>Loading more contacts...</span>
        </div>

        <!-- Load More Button (fallback for browsers without intersection observer) -->
        <div *ngIf="hasMoreToLoad && !isLoadingMore" class="load-more-container">
          <button class="load-more-btn" (click)="loadMore()">
            Load More Contacts
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-list-container {
      width: 100%;
      position: relative;
    }

    .loading-container,
    .error-container,
    .empty-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
      text-align: center;
    }

    .loading-animation,
    .error-content,
    .empty-content {
      max-width: 400px;
      padding: 2rem;
    }

    .spinner-modern {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(102, 126, 234, 0.1);
      border-radius: 50%;
      border-top-color: #667eea;
      animation: modernSpin 1s linear infinite;
      margin: 0 auto 1.5rem auto;
    }

    .error-content,
    .empty-content {
      color: #666;
    }

    .error-icon,
    .empty-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      display: block;
    }

    .error-content h3,
    .empty-content h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .error-content p,
    .empty-content p {
      margin: 0 0 1.5rem 0;
      font-size: 1rem;
      line-height: 1.5;
    }

    .search-hint {
      font-size: 0.9rem;
      color: #999 !important;
      margin-bottom: 0 !important;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .list-stats {
      flex: 1;
    }

    .contact-count {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 1.4rem;
      font-weight: 700;
    }

    .search-info {
      margin: 0;
    }

    .search-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .refresh-btn {
      background: rgba(102, 126, 234, 0.1);
      border: 1px solid rgba(102, 126, 234, 0.2);
      color: #667eea;
      padding: 0.75rem;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .refresh-btn:hover:not(:disabled) {
      background: rgba(102, 126, 234, 0.15);
      transform: translateY(-1px);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .refresh-icon {
      font-size: 1.2rem;
      transition: transform 0.3s ease;
    }

    .refresh-icon.spinning {
      animation: modernSpin 1s linear infinite;
    }

    .contacts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.25rem;
    }

    .contact-card {
      background: white;
      border: 1px solid #e8ecef;
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .contact-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }

    .contact-card:hover {
      border-color: #667eea;
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }

    .contact-card:hover::before {
      transform: scaleX(1);
    }

    .contact-card.deleting {
      opacity: 0.6;
      pointer-events: none;
      transform: scale(0.98);
    }

    .contact-avatar {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.3rem;
      margin-bottom: 1rem;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .contact-details {
      margin-bottom: 1rem;
    }

    .contact-name {
      margin: 0 0 0.75rem 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
      word-break: break-word;
      line-height: 1.3;
    }

    .contact-email {
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .email-icon {
      font-size: 0.8rem;
      opacity: 0.7;
    }

    .email-link {
      color: #667eea;
      text-decoration: none;
      word-break: break-all;
      font-weight: 500;
    }

    .email-link:hover {
      text-decoration: underline;
    }

    .contact-meta {
      font-size: 0.8rem;
      color: #999;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .meta-icon {
      font-size: 0.7rem;
    }

    .contact-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .action-btn {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      background: #f8f9fa;
      color: #6c757d;
    }

    .action-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .edit-btn {
      color: #28a745;
    }

    .edit-btn:hover:not(:disabled) {
      background: rgba(40, 167, 69, 0.1);
      color: #28a745;
    }

    .delete-btn {
      color: #dc3545;
    }

    .delete-btn:hover:not(:disabled) {
      background: rgba(220, 53, 69, 0.1);
      color: #dc3545;
    }

    .action-icon {
      font-size: 1rem;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(220, 53, 69, 0.3);
      border-radius: 50%;
      border-top-color: #dc3545;
      animation: modernSpin 1s linear infinite;
    }

    .loading-more {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;
      color: #667eea;
      font-weight: 500;
    }

    .load-more-container {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .load-more-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.875rem 2rem;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .load-more-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .btn-icon {
      font-size: 1rem;
    }

    @keyframes modernSpin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes cardSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .contact-card {
      animation: cardSlideIn 0.4s ease-out;
    }

    /* Stagger animation for cards */
    .contact-card:nth-child(1) { animation-delay: 0ms; }
    .contact-card:nth-child(2) { animation-delay: 50ms; }
    .contact-card:nth-child(3) { animation-delay: 100ms; }
    .contact-card:nth-child(4) { animation-delay: 150ms; }
    .contact-card:nth-child(5) { animation-delay: 200ms; }
    .contact-card:nth-child(6) { animation-delay: 250ms; }

    /* Responsive Design */
    @media (max-width: 768px) {
      .contacts-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .contact-card {
        padding: 1.25rem;
      }

      .list-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .refresh-btn {
        align-self: flex-end;
        width: fit-content;
      }

      .contact-actions {
        justify-content: center;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #f0f0f0;
      }
    }

    @media (max-width: 480px) {
      .contact-card {
        padding: 1rem;
      }

      .contact-avatar {
        width: 48px;
        height: 48px;
        font-size: 1.1rem;
      }

      .contact-name {
        font-size: 1.1rem;
      }

      .contact-email,
      .contact-meta {
        font-size: 0.85rem;
      }

      .action-btn {
        width: 36px;
        height: 36px;
      }
    }

    /* Accessibility */
    .action-btn:focus-visible,
    .refresh-btn:focus-visible,
    .load-more-btn:focus-visible,
    .btn:focus-visible {
      outline: 2px solid #667eea;
      outline-offset: 2px;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .contact-card,
      .action-btn,
      .refresh-btn,
      .load-more-btn,
      .btn {
        transition: none;
        animation: none;
      }
      
      .spinner-modern,
      .spinner-small,
      .refresh-icon.spinning {
        animation: none;
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .contact-card {
        border-width: 2px;
      }
    }

    /* Print styles */
    @media print {
      .contact-actions,
      .refresh-btn,
      .load-more-container {
        display: none;
      }
      
      .contact-card {
        break-inside: avoid;
        box-shadow: none;
        border: 1px solid #000;
      }
    }
  `]
})
export class ContactListComponent implements OnInit, OnDestroy, OnChanges {
  @Input() searchQuery: string = '';
  @Input() refreshTrigger: number = 0;

  allContacts: Contact[] = [];
  displayedContacts: Contact[] = [];
  isLoading = false;
  isLoadingMore = false;
  errorMessage = '';
  deletingIds = new Set<number>();
  
  // Lazy loading properties
  private itemsPerPage = 12;
  private currentPage = 0;
  private intersectionObserver?: IntersectionObserver;
  
  private searchSubject = new Subject<string>();
  private subscription = new Subscription();

  constructor(private contactService: ContactService) {}

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    // Fallback scroll detection for browsers without intersection observer
    if (!this.intersectionObserver && this.hasMoreToLoad && !this.isLoadingMore) {
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.offsetHeight;
      
      if (scrollPosition >= documentHeight - 1000) {
        this.loadMore();
      }
    }
  }

  get hasMoreToLoad(): boolean {
    return this.displayedContacts.length < this.allContacts.length;
  }

  ngOnInit(): void {
    console.log('🎯 ContactListComponent initialized');
    
    this.contactService.initializeService();
    this.setupSearchSubscription();
    this.subscribeToServiceStates();
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchQuery']) {
      this.searchSubject.next(this.searchQuery);
    }
    
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      console.log('🔄 Refresh trigger activated');
      this.refreshContacts();
    }
  }

  private setupIntersectionObserver(): void {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && this.hasMoreToLoad && !this.isLoadingMore) {
              this.loadMore();
            }
          });
        },
        {
          rootMargin: '100px'
        }
      );
    }
  }

  private setupSearchSubscription(): void {
    const searchSub = this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(query => {
        console.log('🔍 Searching for:', query || '(empty)');
        
        this.clearError();
        this.isLoading = true;
        
        if (query.trim()) {
          return this.contactService.searchContacts(query);
        } else {
          this.isLoading = false;
          return this.contactService.contacts$;
        }
      })
    ).subscribe({
      next: (contacts) => {
        this.allContacts = contacts;
        this.resetPagination();
        this.loadInitialContacts();
        this.isLoading = false;
        this.clearError();
        console.log('📊 Search results:', contacts.length);
      },
      error: (error) => {
        this.errorMessage = this.getErrorMessage(error);
        this.isLoading = false;
        console.error('❌ Search error:', error);
      }
    });

    this.subscription.add(searchSub);
  }

  private subscribeToServiceStates(): void {
    const contactsSub = this.contactService.contacts$.subscribe({
      next: (contacts) => {
        if (!this.searchQuery) {
          this.allContacts = contacts;
          this.resetPagination();
          this.loadInitialContacts();
          
          if (contacts.length > 0 || !this.isLoading) {
            this.clearError();
          }
          console.log('📊 Contacts updated:', contacts.length);
        }
      }
    });

    const loadingSub = this.contactService.loading$.subscribe({
      next: (loading) => {
        this.isLoading = loading;
        if (loading) {
          this.clearError();
        }
      }
    });

    const errorSub = this.contactService.error$.subscribe({
      next: (error) => {
        if (error) {
          this.errorMessage = error;
          this.isLoading = false;
        }
      }
    });

    this.subscription.add(contactsSub);
    this.subscription.add(loadingSub);
    this.subscription.add(errorSub);
  }

  private resetPagination(): void {
    this.currentPage = 0;
    this.displayedContacts = [];
  }

  private loadInitialContacts(): void {
    const endIndex = this.itemsPerPage;
    this.displayedContacts = this.allContacts.slice(0, endIndex);
    this.currentPage = 1;
    
    // Set up intersection observer for the last item
    setTimeout(() => this.observeLastItem(), 100);
  }

  loadMore(): void {
    if (this.isLoadingMore || !this.hasMoreToLoad) {
      return;
    }

    this.isLoadingMore = true;
    
    // Simulate network delay for better UX
    setTimeout(() => {
      const startIndex = this.currentPage * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const newContacts = this.allContacts.slice(startIndex, endIndex);
      
      this.displayedContacts = [...this.displayedContacts, ...newContacts];
      this.currentPage++;
      this.isLoadingMore = false;
      
      // Re-observe the new last item
      setTimeout(() => this.observeLastItem(), 100);
    }, 300);
  }

  private observeLastItem(): void {
    if (this.intersectionObserver && this.displayedContacts.length > 0) {
      // Disconnect previous observations
      this.intersectionObserver.disconnect();
      
      // Find and observe the last contact card
      const contactCards = document.querySelectorAll('.contact-card');
      const lastCard = contactCards[contactCards.length - 1];
      
      if (lastCard && this.hasMoreToLoad) {
        this.intersectionObserver.observe(lastCard);
      }
    }
  }

  refreshContacts(): void {
    console.log('🔄 Manual refresh triggered');
    this.clearError();
    this.contactService.refreshContacts();
  }

  retryLoad(): void {
    console.log('🔄 Retry load triggered');
    this.clearError();
    this.contactService.refreshContacts();
  }

  private clearError(): void {
    if (this.errorMessage) {
      this.errorMessage = '';
      console.log('✅ Error state cleared');
    }
  }

  editContact(contact: Contact): void {
    console.log('✏️ Edit contact:', contact);
    
    const newName = prompt('Enter new name:', contact.name);
    if (newName && newName.trim() && newName.trim() !== contact.name) {
      this.clearError();
      
      const updateSub = this.contactService.updateContact(contact.id!, { 
        name: newName.trim() 
      }).subscribe({
        next: () => {
          console.log('✅ Contact updated successfully');
          this.clearError();
        },
        error: (error) => {
          alert('Failed to update contact: ' + this.getErrorMessage(error));
        }
      });
      
      this.subscription.add(updateSub);
    }
  }

  deleteContact(contact: Contact): void {
    if (!contact.id) return;

    const confirmed = confirm(`Are you sure you want to delete "${contact.name}"?`);
    if (confirmed) {
      console.log('🗑️ Deleting contact:', contact.name);
      
      this.clearError();
      this.deletingIds.add(contact.id);
      
      const deleteSub = this.contactService.deleteContact(contact.id).subscribe({
        next: () => {
          this.deletingIds.delete(contact.id!);
          console.log('✅ Contact deleted successfully');
          this.clearError();
        },
        error: (error) => {
          this.deletingIds.delete(contact.id!);
          alert('Failed to delete contact: ' + this.getErrorMessage(error));
          console.error('❌ Delete error:', error);
        }
      });
      
      this.subscription.add(deleteSub);
    }
  }

  trackByContactId(index: number, contact: Contact): number {
    return contact.id || index;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'today';
    } else if (diffDays <= 7) {
      return `${diffDays} days ago`;
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  private getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}