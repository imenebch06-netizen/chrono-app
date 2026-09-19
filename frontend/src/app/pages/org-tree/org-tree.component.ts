import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Organization, OrganizationService } from '../../services/organization.service';

@Component({
  selector: 'app-org-tree',
  standalone: true,
  imports: [
    CommonModule, 
    MatTreeModule, 
    MatIconModule, 
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './org-tree.component.html',
  styleUrls: ['./org-tree.component.scss']
})
export class OrgTreeComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private translateService = inject(TranslateService);

  treeControl = new NestedTreeControl<Organization>((node) => node.children);
  dataSource = new MatTreeNestedDataSource<Organization>();

  ngOnInit(): void {
    this.orgService.getOrganizationTree().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        if (data.length > 0) {
          data.forEach(node => this.treeControl.expand(node));
        }
      },
      error: (err) => console.error(this.translateService.instant('ORG_TREE.ERROR_LOADING'), err)
    });
  }

  hasChild = (_: number, node: Organization) =>
    !!node.children && node.children.length > 0;

  getTotalEffectif(node: Organization): number {
    const direct = node._count?.membres || 0;
    const childrenCount = node.children
      ? node.children.reduce((acc, child) => acc + this.getTotalEffectif(child), 0)
      : 0;
    return direct + childrenCount;
  }

  getBadgeClass(code?: string): string {
    switch (code?.toUpperCase()) {
      case 'DG': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'DIRECTION': return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 'DEPARTEMENT': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'SERVICE': return 'bg-amber-100 text-amber-700 border-amber-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  }

  getOrgName(node: Organization): string {
  const currentLang = this.translateService.currentLang || this.translateService.defaultLang;
  if (currentLang === 'en' && node.nom_en) {
    return node.nom_en;
  }
  return node.nom;
}
}