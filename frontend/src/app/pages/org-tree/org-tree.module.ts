// org-tree.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrgTreeComponent } from './org-tree.component';
import { NgxOrgChartModule } from 'ngx-org-chart';

@NgModule({
  declarations: [OrgTreeComponent],
  imports: [CommonModule, NgxOrgChartModule],
  exports: [OrgTreeComponent]
})
export class OrgTreeModule {}
