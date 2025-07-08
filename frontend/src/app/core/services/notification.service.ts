import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
  persistent?: boolean; // New: prevents auto-dismiss
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly MAX_NOTIFICATIONS = 5; // Limit concurrent notifications
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private generateId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addNotification(notification: Omit<Notification, 'id'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      duration:
        notification.duration ?? this.getDefaultDuration(notification.type),
    };

    let currentNotifications = this.notificationsSubject.value;

    // Limit concurrent notifications
    if (currentNotifications.length >= this.MAX_NOTIFICATIONS) {
      currentNotifications = currentNotifications.slice(1);
    }

    this.notificationsSubject.next([...currentNotifications, newNotification]);

    // Auto remove after duration (unless persistent)
    if (!newNotification.persistent && (newNotification.duration ?? 0) > 0) {
      setTimeout(() => {
        this.remove(newNotification.id);
      }, newNotification.duration);
    }
  }

  private getDefaultDuration(type: string): number {
    const durations = {
      success: 4000,
      info: 5000,
      warning: 6000,
      error: 0, // Errors don't auto-dismiss by default
    };
    return durations[type as keyof typeof durations] ?? 5000;
  }

  showSuccess(message: string, title?: string, duration?: number): void;
  showSuccess(
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>
  ): void;
  showSuccess(
    message: string,
    titleOrOptions?:
      | string
      | Partial<Omit<Notification, 'id' | 'type' | 'message'>>,
    duration?: number
  ): void {
    const options =
      typeof titleOrOptions === 'string'
        ? { title: titleOrOptions, duration }
        : titleOrOptions;

    this.addNotification({
      type: 'success',
      message,
      ...options,
    });
  }

  showError(message: string, title?: string, duration?: number): void;
  showError(
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>
  ): void;
  showError(
    message: string,
    titleOrOptions?:
      | string
      | Partial<Omit<Notification, 'id' | 'type' | 'message'>>,
    duration?: number
  ): void {
    const options =
      typeof titleOrOptions === 'string'
        ? { title: titleOrOptions, duration }
        : titleOrOptions;

    this.addNotification({
      type: 'error',
      message,
      persistent: true, // Errors are persistent by default
      ...options,
    });
  }

  showWarning(message: string, title?: string, duration?: number): void;
  showWarning(
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>
  ): void;
  showWarning(
    message: string,
    titleOrOptions?:
      | string
      | Partial<Omit<Notification, 'id' | 'type' | 'message'>>,
    duration?: number
  ): void {
    const options =
      typeof titleOrOptions === 'string'
        ? { title: titleOrOptions, duration }
        : titleOrOptions;

    this.addNotification({
      type: 'warning',
      message,
      ...options,
    });
  }

  showInfo(message: string, title?: string, duration?: number): void;
  showInfo(
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>
  ): void;
  showInfo(
    message: string,
    titleOrOptions?:
      | string
      | Partial<Omit<Notification, 'id' | 'type' | 'message'>>,
    duration?: number
  ): void {
    const options =
      typeof titleOrOptions === 'string'
        ? { title: titleOrOptions, duration }
        : titleOrOptions;

    this.addNotification({
      type: 'info',
      message,
      ...options,
    });
  }

  // Enhanced methods with better defaults
  showQuickSuccess(message: string): void {
    this.showSuccess(message, { duration: 2000 });
  }

  showPersistentError(message: string, title?: string): void {
    this.showError(message, { title, persistent: true });
  }

  showActionableWarning(
    message: string,
    title: string,
    actions: NotificationAction[]
  ): void {
    this.showWarning(message, {
      title,
      actions,
      persistent: true,
    });
  }

  remove(id: string): void {
    const updated = this.notificationsSubject.value.filter((n) => n.id !== id);
    this.notificationsSubject.next(updated);
  }

  clear(): void {
    this.notificationsSubject.next([]);
  }

  // Remove all notifications of a specific type
  clearByType(type: Notification['type']): void {
    const updated = this.notificationsSubject.value.filter(
      (n) => n.type !== type
    );
    this.notificationsSubject.next(updated);
  }

  // Get current count of notifications
  getCount(): number {
    return this.notificationsSubject.value.length;
  }

  // Check if there are any error notifications
  hasErrors(): boolean {
    return this.notificationsSubject.value.some((n) => n.type === 'error');
  }
}
