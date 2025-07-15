import { Component, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ContactService, Contact } from '../../services/contact.service';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="contact-form">
      
      <!-- Name Field -->
      <div class="form-group">
        <label for="name" class="form-label">
          <span class="label-text">Full Name</span>
          <span class="required">*</span>
        </label>
        <div class="input-wrapper">
          <input
            type="text"
            id="name"
            formControlName="name"
            class="form-input"
            [class.error]="isFieldInvalid('name')"
            [class.valid]="isFieldValid('name')"
            placeholder="Enter full name"
            autocomplete="name"
            (blur)="onFieldBlur('name')"
            (input)="onFieldInput('name')"
          />
          <div class="field-status">
            <span *ngIf="isFieldValid('name')" class="status-icon valid">✓</span>
            <span *ngIf="isFieldInvalid('name')" class="status-icon error">✕</span>
          </div>
        </div>
        <div class="error-message" *ngIf="isFieldInvalid('name')">
          <span *ngIf="contactForm.get('name')?.errors?.['required']">Name is required</span>
          <span *ngIf="contactForm.get('name')?.errors?.['minlength']">Name must be at least 2 characters</span>
          <span *ngIf="contactForm.get('name')?.errors?.['maxlength']">Name must not exceed 100 characters</span>
          <span *ngIf="contactForm.get('name')?.errors?.['whitespace']">Name cannot be only whitespace</span>
        </div>
      </div>

      <!-- Email Field -->
      <div class="form-group">
        <label for="email" class="form-label">
          <span class="label-text">Email Address</span>
          <span class="required">*</span>
        </label>
        <div class="input-wrapper">
          <input
            type="email"
            id="email"
            formControlName="email"
            class="form-input"
            [class.error]="isFieldInvalid('email')"
            [class.checking]="isCheckingEmail"
            [class.valid]="isFieldValid('email')"
            placeholder="Enter email address"
            autocomplete="email"
            (blur)="onFieldBlur('email')"
            (input)="onFieldInput('email')"
          />
          <div class="field-status">
            <span *ngIf="isCheckingEmail" class="status-icon checking">
              <span class="spinner-small"></span>
            </span>
            <span *ngIf="isFieldValid('email') && !isCheckingEmail" class="status-icon valid">✓</span>
            <span *ngIf="isFieldInvalid('email') && !isCheckingEmail" class="status-icon error">✕</span>
          </div>
        </div>
        
        <div class="checking-message" *ngIf="isCheckingEmail">
          <span class="checking-icon">🔄</span>
          Verifying email availability...
        </div>
        
        <div class="error-message" *ngIf="isFieldInvalid('email')">
          <span *ngIf="contactForm.get('email')?.errors?.['required']">Email is required</span>
          <span *ngIf="contactForm.get('email')?.errors?.['email']">Please enter a valid email format</span>
          <span *ngIf="contactForm.get('email')?.errors?.['emailExists']">This email already exists</span>
          <span *ngIf="contactForm.get('email')?.errors?.['whitespace']">Email cannot be only whitespace</span>
        </div>
        
        <div class="success-message-inline" *ngIf="isEmailAvailable && !isFieldInvalid('email') && !isCheckingEmail">
          Email is available
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary"
          (click)="onCancel()"
          [disabled]="isSubmitting"
        >
          <span class="btn-content">
            <span class="btn-icon">✕</span>
            Cancel
          </span>
        </button>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="!isFormCompletelyValid() || isSubmitting || isCheckingEmail"
        >
          <span class="btn-content">
            <span *ngIf="isSubmitting" class="spinner"></span>
            {{ isSubmitting ? 'Adding...' : 'Add Contact' }}
          </span>
        </button>
      </div>

      <!-- Status Messages -->
      <div class="success-message" *ngIf="successMessage">
        {{ successMessage }}
      </div>

      <div class="error-message-global" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>
    </form>
  `,
  styles: [`
    .contact-form {
      width: 100%;
      max-width: 100%;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.6rem;
      font-weight: 600;
      color: #333;
      font-size: 0.95rem;
    }

    .label-icon {
      font-size: 1rem;
    }

    .required {
      color: #e74c3c;
      font-weight: 700;
      margin-left: auto;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .form-input {
      width: 100%;
      padding: 1rem 3rem 1rem 1rem;
      border: 2px solid #e1e8ed;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: white;
      box-sizing: border-box;
      outline: none;
    }

    .form-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      transform: translateY(-1px);
    }

    .form-input.valid {
      border-color: #28a745;
      background: #f8fff9;
    }

    .form-input.error {
      border-color: #e74c3c;
      background: #fdf2f2;
    }

    .form-input.checking {
      border-color: #ffc107;
      background: #fffbf0;
    }

    .field-status {
      position: absolute;
      right: 1rem;
      display: flex;
      align-items: center;
    }

    .status-icon {
      font-size: 1.1rem;
      font-weight: 600;
    }

    .status-icon.valid {
      color: #28a745;
    }

    .status-icon.error {
      color: #e74c3c;
    }

    .status-icon.checking {
      color: #ffc107;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 193, 7, 0.3);
      border-radius: 50%;
      border-top-color: #ffc107;
      animation: spin 1s linear infinite;
    }

    .error-message,
    .checking-message,
    .success-message-inline {
      margin-top: 0.5rem;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      animation: slideDown 0.3s ease-out;
    }

    .error-message {
      color: #e74c3c;
    }

    .checking-message {
      color: #856404;
    }

    .success-message-inline {
      color: #155724;
    }

    .checking-icon {
      animation: spin 1s linear infinite;
    }

    .success-message {
      margin-top: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      color: #155724;
      border: 1px solid #c3e6cb;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
      animation: slideDown 0.3s ease-out;
    }

    .error-message-global {
      margin-top: 7px;
      padding: 2px;
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
      animation: slideDown 0.3s ease-out;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.875rem 1.5rem;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      text-decoration: none;
      position: relative;
      overflow: hidden;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-width: 140px;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .btn-primary:disabled {
      background: #cccccc;
      box-shadow: none;
    }

    .btn-secondary {
      background: #f8f9fa;
      color: #6c757d;
      border: 2px solid #e9ecef;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e9ecef;
      border-color: #dee2e6;
      transform: translateY(-1px);
    }

    .btn-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-icon {
      font-size: 1rem;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
    }

    .success-icon,
    .error-icon {
      font-size: 1.1rem;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
        max-height: 0;
      }
      to {
        opacity: 1;
        transform: translateY(0);
        max-height: 100px;
      }
    }

    /* Responsive Design */
    @media (max-width: 480px) {
      .form-actions {
        flex-direction: column-reverse;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }

      .form-input {
        padding: 1rem 2.5rem 1rem 1rem;
      }
    }

    /* Accessibility */
    .form-input:focus-visible {
      outline: 2px solid #667eea;
      outline-offset: 2px;
    }

    .btn:focus-visible {
      outline: 2px solid #667eea;
      outline-offset: 2px;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .form-input,
      .btn {
        transition: none;
      }
      
      .error-message,
      .checking-message,
      .success-message-inline,
      .success-message,
      .error-message-global {
        animation: none;
      }
      
      .checking-icon,
      .spinner-small,
      .spinner {
        animation: none;
      }
    }
  `]
})
export class ContactFormComponent implements OnDestroy {
  @Output() contactAdded = new EventEmitter<Contact>();
  @Output() formClosed = new EventEmitter<void>();

  contactForm: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  isCheckingEmail = false;
  isEmailAvailable = false;
  isEmailValid = false;
  private subscription = new Subscription();
  private lastEmailChecked = '';

  constructor(
    private formBuilder: FormBuilder,
    private contactService: ContactService
  ) {
    this.contactForm = this.createForm();
    this.setupEmailValidation();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        this.noWhitespaceValidator
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        this.noWhitespaceValidator
      ]]
    });
  }

  private setupEmailValidation(): void {
    const emailControl = this.contactForm.get('email');
    if (emailControl) {
      const emailSub = emailControl.valueChanges.pipe(
        debounceTime(250),
        distinctUntilChanged()
      ).subscribe(email => {
        this.checkEmailAvailability(email);
      });
      
      this.subscription.add(emailSub);
    }
  }

  private checkEmailAvailability(email: string): void {
    this.isEmailAvailable = false;
    this.isCheckingEmail = false;
    this.isEmailValid = false;
    
    const emailControl = this.contactForm.get('email');
    if (emailControl && emailControl.errors?.['emailExists']) {
      const errors = { ...emailControl.errors };
      delete errors['emailExists'];
      emailControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }

    if (!email || email.trim().length === 0) {
      this.lastEmailChecked = '';
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    if (trimmedEmail === this.lastEmailChecked) {
      return;
    }

    if (!this.isValidEmailStrict(trimmedEmail)) {
      this.lastEmailChecked = '';
      this.isEmailValid = false;
      return;
    }

    this.isEmailValid = true;
    this.isCheckingEmail = true;
    this.lastEmailChecked = trimmedEmail;

    setTimeout(() => {
      const exists = this.contactService.emailExists(trimmedEmail);
      
      if (emailControl) {
        if (exists) {
          const currentErrors = emailControl.errors || {};
          emailControl.setErrors({ ...currentErrors, emailExists: true });
          this.isEmailAvailable = false;
        } else {
          if (emailControl.errors?.['emailExists']) {
            const errors = { ...emailControl.errors };
            delete errors['emailExists'];
            emailControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
          }
          
          if (emailControl.valid && this.isEmailValid) {
            this.isEmailAvailable = true;
          }
        }
      }
      
      this.isCheckingEmail = false;
    }, 100);
  }

  private isValidEmailStrict(email: string): boolean {
    const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!strictEmailRegex.test(email)) return false;
    if (email.length > 254) return false;
    if (email.includes('..')) return false;
    if (email.startsWith('.') || email.endsWith('.')) return false;
    if (email.includes('@.') || email.includes('.@')) return false;
    
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    if (parts[0].length > 64) return false;
    if (parts[1].length < 2) return false;
    
    return true;
  }

  private noWhitespaceValidator(control: AbstractControl): {[key: string]: any} | null {
    if (control.value && typeof control.value === 'string' && control.value.trim().length === 0) {
      return { 'whitespace': true };
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    if (fieldName === 'email') {
      return !!(field && field.valid && field.value && this.isEmailValid && !this.isCheckingEmail);
    }
    return !!(field && field.valid && field.value && (field.dirty || field.touched));
  }

  onFieldBlur(fieldName: string): void {
    const field = this.contactForm.get(fieldName);
    if (field) {
      const trimmedValue = field.value ? field.value.trim() : '';
      field.setValue(trimmedValue, { emitEvent: true });
      field.markAsTouched();
    }
  }

  onFieldInput(fieldName: string): void {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
    
    const field = this.contactForm.get(fieldName);
    if (field) {
      field.markAsDirty();
      
      if (fieldName === 'email') {
        this.isEmailAvailable = false;
      }
    }
  }

  isFormCompletelyValid(): boolean {
    if (!this.contactForm.valid) {
      return false;
    }

    const nameValue = this.contactForm.get('name')?.value;
    const emailValue = this.contactForm.get('email')?.value;
    
    const hasValidName = nameValue && 
                        typeof nameValue === 'string' && 
                        nameValue.trim().length >= 2 &&
                        nameValue.trim().length <= 100;
    
    const hasValidEmail = emailValue && 
                         typeof emailValue === 'string' && 
                         emailValue.trim().length > 0 && 
                         this.isValidEmailStrict(emailValue.trim()) &&
                         !this.contactService.emailExists(emailValue.trim().toLowerCase());
    
    return hasValidName && hasValidEmail && !this.isCheckingEmail;
  }

  onSubmit(): void {
    if (!this.isFormCompletelyValid()) {
      this.handleValidationErrors();
      return;
    }
    
    this.clearMessages();
    this.trimAllFields();
    this.markAllFieldsAsTouched();
    
    if (this.isFormCompletelyValid() && !this.isSubmitting && !this.isCheckingEmail) {
      this.submitForm();
    } else {
      this.handleValidationErrors();
    }
  }

  private submitForm(): void {
    this.isSubmitting = true;

    const contactData = {
      name: this.contactForm.value.name.trim(),
      email: this.contactForm.value.email.trim().toLowerCase()
    };

    if (!this.isValidEmailStrict(contactData.email)) {
      this.errorMessage = 'Invalid email format. Please enter a valid email address.';
      this.isSubmitting = false;
      return;
    }

    if (this.contactService.emailExists(contactData.email)) {
      this.errorMessage = 'A contact with this email already exists';
      this.isSubmitting = false;
      return;
    }

    const sub = this.contactService.createContact(contactData).subscribe({
      next: (contact) => {
        this.successMessage = `Contact "${contact.name}" added successfully!`;
        this.contactAdded.emit(contact);
        this.isSubmitting = false;
        
        setTimeout(() => {
          this.resetForm();
          this.formClosed.emit();
        }, 1500);
      },
      error: (error) => {
        this.errorMessage = this.getErrorMessage(error);
        this.isSubmitting = false;
        
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });

    this.subscription.add(sub);
  }

  private handleValidationErrors(): void {
    const nameControl = this.contactForm.get('name');
    const emailControl = this.contactForm.get('email');
    
    const errors: string[] = [];
    
    if (nameControl?.invalid) {
      if (nameControl.errors?.['required']) {
        errors.push('Name is required');
      } else if (nameControl.errors?.['minlength']) {
        errors.push('Name must be at least 2 characters');
      } else if (nameControl.errors?.['whitespace']) {
        errors.push('Name cannot be only spaces');
      }
    }
    
    if (emailControl?.invalid) {
      if (emailControl.errors?.['required']) {
        errors.push('Email is required');
      } else if (emailControl.errors?.['email']) {
        errors.push('Please enter a valid email address');
      } else if (emailControl.errors?.['emailExists']) {
        errors.push('This email already exists');
      } else if (emailControl.errors?.['whitespace']) {
        errors.push('Email cannot be only spaces');
      }
    }
    
    if (this.isCheckingEmail) {
      errors.push('Please wait while we verify email availability');
    }
    
    const emailValue = emailControl?.value;
    if (emailValue && !this.isValidEmailStrict(emailValue.trim())) {
      errors.push('Email format is invalid. Please check for typos.');
    }
    
    if (errors.length > 0) {
      this.errorMessage = errors.join('. ');
    } else {
      this.errorMessage = 'Please fill in all required fields correctly';
    }
    
    this.markAllFieldsAsTouched();
    
    setTimeout(() => {
      this.errorMessage = '';
    }, 8000);
  }

  private trimAllFields(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      if (control && control.value && typeof control.value === 'string') {
        control.setValue(control.value.trim(), { emitEvent: false });
      }
    });
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      if (control) {
        control.markAsTouched();
        control.markAsDirty();
      }
    });
  }

  onCancel(): void {
    this.formClosed.emit();
  }

  resetForm(): void {
    this.isCheckingEmail = false;
    this.isEmailAvailable = false;
    this.isEmailValid = false;
    this.lastEmailChecked = '';
    
    this.contactForm.reset();
    this.clearMessages();
    
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      if (control) {
        control.setErrors(null);
        control.markAsUntouched();
        control.markAsPristine();
        control.setValue('', { emitEvent: false });
      }
    });

    this.contactForm.updateValueAndValidity();
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  }
}