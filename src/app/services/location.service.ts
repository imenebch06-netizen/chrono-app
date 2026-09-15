import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private http = inject(HttpClient);

 
  getAddressInBothLanguages(lat: number, lng: number): Observable<{ fr: any; en: any }> {
    const fr$ = this.http.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`);
    const en$ = this.http.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`);

    return forkJoin({ fr: fr$, en: en$ });
  }

 
  getCoordsFromAddress(address: string, lang: string = 'fr'): Observable<any> {
  const query = address.trim();
  const url = `https://nominatim.openstreetmap.org/search` +
              `?format=json` +
              `&q=${encodeURIComponent(query)}` +
              `&countrycodes=dz` +
              `&accept-language=${lang}` +
              `&limit=5`;

  return this.http.get(url);
}

formatCleanAddress(res: any): string {
  if (!res || !res.address) return res?.display_name || '';

  const addr = res.address;
 
  const place = addr.building || addr.amenity || addr.office || '';
  const road = addr.road || '';
  const neighbourhood = addr.suburb || addr.neighbourhood || addr.residential || '';
  const city = addr.city || addr.town || addr.village || '';
  const state = addr.state || '';
  const country = addr.country || '';

  
  const parts = [place, road, neighbourhood, city, state, country].filter(
    (item, index, self) => item && self.indexOf(item) === index
  );

  return parts.join(', ');
}
}