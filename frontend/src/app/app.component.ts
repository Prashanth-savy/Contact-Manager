import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactListComponent } from './components/contact-list/contact-list.component';
import { ContactFormComponent } from './components/contact-form/contact-form.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    ContactListComponent, 
    ContactFormComponent,
    SearchBarComponent
  ],
  template: `
    <div class="app-container">
      <!-- Header -->
      <header class="app-header">
        <div class="header-content">
          <div class="logo-section">
            <div class="logo">👥</div>
            <div class="title-section">
              <h1>Contact Manager</h1>
              <p class="subtitle">Manage your contacts efficiently</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="app-main">
        <div class="container">
          <!-- Search and Add Section -->
          <div class="action-bar">
            <app-search-bar 
              (searchChanged)="onSearchChanged($event)"
              class="search-section">
            </app-search-bar>
            
            <button 
              class="add-contact-btn"
              (click)="showAddForm = true"
              title="Add New Contact">
              <span class="btn-icon">+</span>
              <span class="btn-text">Add Contact</span>
            </button>
          </div>

          <!-- Contact List -->
          <div class="content-section">
            <app-contact-list 
              [searchQuery]="searchQuery"
              [refreshTrigger]="refreshTrigger"
              class="contact-list-wrapper">
            </app-contact-list>
          </div>
        </div>
      </main>

      <!-- Contact Form Modal -->
      <div class="modal-overlay" *ngIf="showAddForm" (click)="onOverlayClick($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Add New Contact</h2>
            <button class="close-btn" (click)="showAddForm = false" title="Close">
              ✕
            </button>
          </div>
          <div class="modal-body">
            <app-contact-form 
              (contactAdded)="onContactAdded($event)"
              (formClosed)="showAddForm = false">
            </app-contact-form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
    }

    .app-header {
      background: rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(25px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding: 1.5rem 0;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo {
      font-size: 2.5rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      padding: 0.5rem;
      backdrop-filter: blur(10px);
    }

    .title-section h1 {
      margin: 0;
      color: white;
      font-size: 2rem;
      font-weight: 700;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .subtitle {
      margin: 0;
      color: rgba(255, 255, 255, 0.95);
      font-size: 1rem;
      font-weight: 300;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }

    .app-main {
      flex: 1;
      padding: 2rem 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    .action-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      align-items: center;
    }

    .search-section {
      flex: 1;
      max-width: 600px;
    }

    .add-contact-btn {
      background: rgba(255, 255, 255, 0.95);
      border: none;
      border-radius: 12px;
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      color: #667eea;
      font-weight: 600;
      font-size: 1rem;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      white-space: nowrap;
    }

    .add-contact-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      background: white;
    }

    .btn-icon {
      font-size: 1.2rem;
      font-weight: 300;
    }

    .content-section {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .contact-list-wrapper {
      display: block;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.3s ease-out;
    }

    .modal-content {
      background: white;
      border-radius: 20px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease-out;
    }

    .modal-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color:white;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      transition: all 0.3s ease;
      opacity: 0.8;
    }

    .close-btn:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.1);
    }

    .modal-body {
      padding: 2rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .header-content {
        padding: 0 1rem;
      }

      .container {
        padding: 0 1rem;
      }

      .action-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .add-contact-btn {
        justify-content: center;
      }

      .content-section {
        padding: 1.5rem;
      }

      .modal-content {
        margin: 1rem;
        max-width: calc(100% - 2rem);
      }

      .modal-header,
      .modal-body {
        padding: 1.5rem;
      }

      .logo-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .title-section h1 {
        font-size: 1.5rem;
      }
    }

    @media (max-width: 480px) {
      .btn-text {
        display: none;
      }

      .add-contact-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        z-index: 999;
        box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
      }

      .btn-icon {
        font-size: 1.5rem;
      }
    }
  `]
})
export class AppComponent {
  searchQuery: string = '';
  refreshTrigger: number = 0;
  showAddForm: boolean = false;

  onContactAdded(contact: any): void {
    console.log('New contact added:', contact);
    this.refreshTrigger++;
    this.showAddForm = false;
  }

  onSearchChanged(query: string): void {
    this.searchQuery = query;
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.showAddForm = false;
    }
  }
}