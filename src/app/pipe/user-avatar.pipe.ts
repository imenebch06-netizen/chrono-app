import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'userAvatar',
  standalone: true
})
export class UserAvatarPipe implements PipeTransform {
  transform(user: any): string {
    if (!user) {
      return 'https://ui-avatars.com/api/?name=U&background=4338CA&color=ffffff&rounded=true';
    }

    
    const target = user.user || user; 
    const prenom = target.prenom || target.firstName || '';
    const nom = target.nom || target.lastName || target.username || '';
    
    const nomComplet = `${prenom} ${nom}`.trim() || 'User';

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nomComplet)}&background=4338CA&color=ffffff&bold=true&rounded=true`;
  }
}