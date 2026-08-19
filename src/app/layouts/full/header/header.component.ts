import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
  inject,
  OnInit
} from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { Router, RouterModule } from '@angular/router';

import { NgScrollbarModule } from 'ngx-scrollbar';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService, NotificationItem } from 'src/app/services/notification.service';
import { CommonModule } from '@angular/common';
import { UserAvatarPipe } from 'src/app/pipe/user-avatar.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgScrollbarModule,
    TablerIconsModule,
    MaterialModule,
    MatBadgeModule,
    UserAvatarPipe
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None,
  
})
export class HeaderComponent implements OnInit {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();

  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  currentUser: any = null;
  notifications: NotificationItem[] = [];

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      // Ne charge les notifications que si l'utilisateur est connecté et N'EST PAS ADMIN
      if (user && user.role !== 'ADMIN') {
        this.loadNotifications();
      } else {
        this.notifications = [];
      }
    });
  }

  loadNotifications(): void {
    this.notificationService.getMyNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
      },
      error: (err) => console.error('Erreur chargement notifications', err)
    });
  }

  onNotificationClick(item: NotificationItem): void {
    // 1. Marquer comme lue
    if (!item.isRead) {
      this.notificationService.markAsRead(item.id).subscribe(() => {
        item.isRead = true;
      });
    }

    // 2. Rediriger vers l'espace des demandes d'absence
    this.router.navigate(['/app-demandes']);
  }

  deleteNotification(id: number, event: MouseEvent): void {
    event.stopPropagation(); // Empêche le déclenchement du clic de navigation
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}