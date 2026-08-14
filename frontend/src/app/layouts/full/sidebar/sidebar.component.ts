import { Component, EventEmitter, Input, OnInit, Output, inject, ChangeDetectorRef } from '@angular/core';
import { BrandingComponent } from './branding.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { navItems as RAW_NAV_ITEMS } from './sidebar-data';
import { AppNavItemComponent } from './nav-item/nav-item.component';
import { AuthService } from 'src/app/services/auth.service';
import { NavItem } from './nav-item/nav-item';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    BrandingComponent,
    TablerIconsModule,
    MaterialModule,
    AppNavItemComponent,
    CommonModule
  ],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  public navItems: NavItem[] = [];

  ngOnInit(): void {
    const userRole = (this.authService.getUserRole() || '').toUpperCase();
    const currentUser = this.authService.getUser();

    // 🟢 Règle Manager élargie et corrigée
    const isManager = 
      userRole === 'MANAGER' || 
      userRole === 'DIRECTEUR' || 
      userRole === 'DIRECTEUR_GENERAL' ||
      (userRole === 'EMPLOYE' && (
        currentUser?.isManager === true ||
        !!currentUser?.managedOrganizationId ||
        !!currentUser?.organizationId ||
        currentUser?.poste?.toLowerCase().includes('directeur') ||
        currentUser?.jobTitle?.toLowerCase().includes('directeur')
      ));

    // 🔍 Filtrage unique
    const itemsFiltres = RAW_NAV_ITEMS.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      
      const rolesUpper = item.roles.map((r) => r.toUpperCase());

      // Si le menu demande le rôle MANAGER
      if (rolesUpper.includes('MANAGER')) {
        return isManager;
      }

      // Si le rôle de l'utilisateur correspond exactement
      return rolesUpper.includes(userRole);
    });

    this.navItems = itemsFiltres.map((item) => {
      const { roles, ...itemSansRoles } = item;
      return itemSansRoles;
    });

    this.cdr.detectChanges();
  }
}