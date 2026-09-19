import { Injectable } from '@angular/core';
import { addCollection } from '@iconify/iconify';
import solarIcons from '@iconify-json/solar/icons.json';

@Injectable({
  providedIn: 'root'
})
export class IconService {
  constructor() {
    // Charge l'ensemble du pack Solar en mémoire locale
    addCollection(solarIcons as any);
  }
}