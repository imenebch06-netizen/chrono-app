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
import { TranslateModule } from '@ngx-translate/core';
import { ThemeToggleComponent } from 'src/app/components/theme-toggle/theme-toggle.component';
import { LangToggleComponent } from 'src/app/components/lang-toggle/lang-toggle.component';
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
    UserAvatarPipe,
    TranslateModule,
    ThemeToggleComponent,
    LangToggleComponent
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
   
    if (!item.isRead) {
      this.notificationService.markAsRead(item.id).subscribe(() => {
        item.isRead = true;
      });
    }

   
    this.router.navigate(['/app-demandes']);
  }

  deleteNotification(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  parseNotification(item: NotificationItem): { key: string; params: Record<string, string> } {
    if (!item || !item.message) return { key: '', params: {} };

    switch (item.type) {
      case 'DEMANDE_CREEE': {
        
        const match = item.message.match(/^(.*?) a soumis une demande de (.*?)\.?$/i);
        if (match) {
          return {
            key: 'NOTIFICATIONS.TYPES.DEMANDE_CREEE.MESSAGE_PARAMS',
            params: { author: match[1].trim(), leaveType: match[2].trim() }
          };
        }
        break;
      }

      case 'DEMANDE_VALIDEE': {
        
        const matchBy = item.message.match(/^(?:Votre|La) demande (?:de (.*?)\s+)?a été validée par (.*?)\.?$/i);
        if (matchBy) {
          return {
            key: 'NOTIFICATIONS.TYPES.DEMANDE_VALIDEE.MESSAGE_PARAMS_BY',
            params: { leaveType: matchBy[1]?.trim() || '', validator: matchBy[2].trim() }
          };
        }
        const matchSimple = item.message.match(/^(?:Votre|La) demande (?:de (.*?)\s+)?a été validée\.?$/i);
        if (matchSimple) {
          return {
            key: 'NOTIFICATIONS.TYPES.DEMANDE_VALIDEE.MESSAGE_PARAMS',
            params: { leaveType: matchSimple[1]?.trim() || '' }
          };
        }
        break;
      }

      case 'DEMANDE_REFUSEE': {
        
        const matchBy = item.message.match(/^(?:Votre|La) demande (?:de (.*?)\s+)?a été refusée par (.*?)\.?$/i);
        if (matchBy) {
          return {
            key: 'NOTIFICATIONS.TYPES.DEMANDE_REFUSEE.MESSAGE_PARAMS_BY',
            params: { leaveType: matchBy[1]?.trim() || '', validator: matchBy[2].trim() }
          };
        }
        const matchSimple = item.message.match(/^(?:Votre|La) demande (?:de (.*?)\s+)?a été refusée\.?$/i);
        if (matchSimple) {
          return {
            key: 'NOTIFICATIONS.TYPES.DEMANDE_REFUSEE.MESSAGE_PARAMS',
            params: { leaveType: matchSimple[1]?.trim() || '' }
          };
        }
        break;
      }
    }

    return { key: '', params: {} };
  }
}