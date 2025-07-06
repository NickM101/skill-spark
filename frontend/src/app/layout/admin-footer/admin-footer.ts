// File: src/app/features/admin/components/admin-footer/admin-footer.component.ts

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface FooterStats {
  uptime: string;
  version: string;
  lastUpdate: Date;
  serverStatus: 'online' | 'maintenance' | 'offline';
}

@Component({
  selector: 'app-admin-footer',
  templateUrl: './admin-footer.html',
  styleUrls: ['./admin-footer.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFooterComponent implements OnInit {
  currentYear = new Date().getFullYear();

  // Observable for real-time stats
  footerStats$: Observable<FooterStats>;

  constructor() {
    // Mock footer stats - in real app, this would come from a service
    this.footerStats$ = this.getMockStats();
  }

  ngOnInit(): void {
    // Initialize any footer-specific logic
  }

  private getMockStats(): Observable<FooterStats> {
    // Simulate real-time stats updates
    return new Observable<FooterStats>((observer) => {
      const updateStats = () => {
        const stats: FooterStats = {
          uptime: this.calculateUptime(),
          version: '1.0.0',
          lastUpdate: new Date(),
          serverStatus: 'online',
        };
        observer.next(stats);
      };

      // Initial emission
      updateStats();

      // Update every 30 seconds
      const interval = setInterval(updateStats, 30000);

      // Cleanup
      return () => clearInterval(interval);
    });
  }

  private calculateUptime(): string {
    // Mock uptime calculation - in real app, this would come from server
    const startTime = new Date('2024-01-01');
    const now = new Date();
    const uptimeMs = now.getTime() - startTime.getTime();

    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    return `${days}d ${hours}h`;
  }

  onSupportClick(): void {
    // Handle support/help click
    window.open('/help', '_blank');
  }

  onStatusClick(): void {
    // Handle system status click
    window.open('/status', '_blank');
  }

  onDocumentationClick(): void {
    // Handle documentation click
    window.open('/docs', '_blank');
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'online':
        return 'var(--success-color)';
      case 'maintenance':
        return 'var(--warn-color)';
      case 'offline':
        return 'var(--error-color)';
      default:
        return 'var(--text-secondary)';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'online':
        return 'All Systems Operational';
      case 'maintenance':
        return 'Maintenance Mode';
      case 'offline':
        return 'System Offline';
      default:
        return 'Unknown Status';
    }
  }
}
