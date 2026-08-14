import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'anciennete',
  standalone: true
})
export class AnciennetePipe implements PipeTransform {
  transform(anneeEmbauche: number): string {
    if (!anneeEmbauche) return '';
    
    const anneeActuelle = new Date().getFullYear();
    const nbAnnees = anneeActuelle - anneeEmbauche;

    if (nbAnnees <= 0) {
      return "Moins d'un an";
    }
    return `${nbAnnees} ans d'ancienneté`;
  }
}