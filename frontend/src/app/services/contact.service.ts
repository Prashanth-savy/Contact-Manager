import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, retry, map, tap, shareReplay } from 'rxjs/operators';

export interface Contact {
  id?: number;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly apiUrl = 'http://localhost:3000/api/contacts';
  private contactsSubject = new BehaviorSubject<Contact[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private isInitialized = false;
  private contactsCache$: Observable<Contact[]> | null = null;

  public contacts$ = this.contactsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {
    // Don't auto-load contacts in constructor
    // Let components control when to load
  }

  /**
   * Initialize the service (called by components when needed)
   */
  initializeService(): void {
    if (!this.isInitialized) {
      this.isInitialized = true;
      this.loadContacts();
    }
  }

  /**
   * Get all contacts with caching
   */
  getContacts(): Observable<Contact[]> {
    // If we already have a cached observable, reuse it
    if (this.contactsCache$) {
      return this.contactsCache$;
    }

    this.setLoading(true);
    this.clearError();

    // Create cached observable with shareReplay to prevent multiple HTTP calls
    this.contactsCache$ = this.http.get<ApiResponse<Contact[]>>(this.apiUrl).pipe(
      retry(2),
      map(response => {
        if (response.success) {
          this.contactsSubject.next(response.data);
          return response.data;
        }
        throw new Error(response.error || 'Failed to load contacts');
      }),
      tap(() => this.setLoading(false)),
      catchError(error => {
        this.setLoading(false);
        this.handleError('Failed to load contacts', error);
        return throwError(() => error);
      }),
      shareReplay(1) // Cache the result and share among subscribers
    );

    return this.contactsCache$;
  }

  /**
   * Load contacts (internal method)
   */
  private loadContacts(): void {
    const subscription = this.getContacts().subscribe({
      next: (contacts) => {
        console.log('📊 Contacts loaded:', contacts.length);
      },
      error: (error) => {
        console.error('❌ Failed to load contacts:', error);
      }
    });

    // Auto-unsubscribe after first load
    setTimeout(() => subscription.unsubscribe(), 0);
  }

  /**
   * Create a new contact
   */
  createContact(contact: Omit<Contact, 'id'>): Observable<Contact> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<ApiResponse<Contact>>(this.apiUrl, contact)
      .pipe(
        map(response => {
          if (response.success) {
            // Add new contact to current list
            const currentContacts = this.contactsSubject.value;
            const updatedContacts = [...currentContacts, response.data].sort((a, b) => 
              a.name.localeCompare(b.name)
            );
            this.contactsSubject.next(updatedContacts);
            
            // Clear cache to force fresh data on next request
            this.contactsCache$ = null;
            
            return response.data;
          }
          throw new Error(response.error || 'Failed to create contact');
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          this.setLoading(false);
          this.handleError('Failed to create contact', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update an existing contact
   */
  updateContact(id: number, contact: Partial<Contact>): Observable<Contact> {
    this.setLoading(true);
    this.clearError();

    return this.http.put<ApiResponse<Contact>>(`${this.apiUrl}/${id}`, contact)
      .pipe(
        map(response => {
          if (response.success) {
            // Update contact in current list
            const currentContacts = this.contactsSubject.value;
            const updatedContacts = currentContacts.map(c => 
              c.id === id ? response.data : c
            ).sort((a, b) => a.name.localeCompare(b.name));
            this.contactsSubject.next(updatedContacts);
            
            // Clear cache to force fresh data on next request
            this.contactsCache$ = null;
            
            return response.data;
          }
          throw new Error(response.error || 'Failed to update contact');
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          this.setLoading(false);
          this.handleError('Failed to update contact', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete a contact
   */
  deleteContact(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.success) {
            // Remove contact from current list
            const currentContacts = this.contactsSubject.value;
            const updatedContacts = currentContacts.filter(c => c.id !== id);
            this.contactsSubject.next(updatedContacts);
            
            // Clear cache to force fresh data on next request
            this.contactsCache$ = null;
            
            return;
          }
          throw new Error(response.error || 'Failed to delete contact');
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          this.setLoading(false);
          this.handleError('Failed to delete contact', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Search contacts
   */
  searchContacts(query: string): Observable<Contact[]> {
    this.setLoading(true);
    this.clearError();

    if (!query.trim()) {
      // If no query, return current contacts without API call
      this.setLoading(false);
      return this.contacts$;
    }

    const params = new HttpParams().set('q', query.trim());

    return this.http.get<ApiResponse<Contact[]>>(`${this.apiUrl}/search`, { params })
      .pipe(
        retry(2),
        map(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.error || 'Failed to search contacts');
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          this.setLoading(false);
          this.handleError('Failed to search contacts', error);
          return throwError(() => error);
        }),
        shareReplay(1) // Cache search results
      );
  }

  /**
   * Refresh contacts list (force reload)
   */
  refreshContacts(): void {
    console.log('🔄 Refreshing contacts...');
    
    // Clear cache to force fresh API call
    this.contactsCache$ = null;
    
    // Load fresh data
    this.loadContacts();
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get contacts without triggering API call (from cache)
   */
  getCurrentContacts(): Contact[] {
    return this.contactsSubject.value;
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email already exists
   */
  emailExists(email: string, excludeId?: number): boolean {
    const contacts = this.contactsSubject.value;
    return contacts.some(contact => 
      contact.email.toLowerCase() === email.toLowerCase() && contact.id !== excludeId
    );
  }

  /**
   * Get contact by ID
   */
  getContactById(id: number): Contact | undefined {
    return this.contactsSubject.value.find(contact => contact.id === id);
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Clear error state
   */
  private clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Handle errors
   */
  private handleError(message: string, error: HttpErrorResponse): void {
    let errorMessage = message;

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('ContactService Error:', {
      message,
      error,
      status: error.status,
      statusText: error.statusText
    });

    this.errorSubject.next(errorMessage);
  }

  /**
   * Get current error message
   */
  getError(): string | null {
    return this.errorSubject.value;
  }

  /**
   * Get loading status
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Get current contacts count
   */
  getContactsCount(): number {
    return this.contactsSubject.value.length;
  }

  /**
   * Clear all cached data (useful for logout/reset)
   */
  clearCache(): void {
    this.contactsCache$ = null;
    this.contactsSubject.next([]);
    this.isInitialized = false;
  }
}