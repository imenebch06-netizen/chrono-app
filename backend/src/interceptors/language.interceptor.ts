import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const rawLang = request.headers['accept-language'] || 'fr';
    const lang = rawLang.toLowerCase().slice(0, 2);

    
    const isDashboardRoute = request.url.includes('/dashboard') || request.url.includes('/organizations');

    return next.handle().pipe(
      map((data) => this.transform(data, lang, isDashboardRoute, new WeakSet()))
    );
  }

  private transform(data: any, lang: string, isDashboardRoute: boolean, visited: WeakSet<object>): any {
    if (!data || typeof data !== 'object' || data instanceof Date) {
      return data;
    }

    if (visited.has(data)) return data;
    visited.add(data);

    if (Array.isArray(data)) {
      return data.map((item) => this.transform(item, lang, isDashboardRoute, visited));
    }

    const result = { ...data };

   
    if (lang === 'en' && !isDashboardRoute) {
      if (result.nom_en) result.nom = result.nom_en;
      if (result.adress_en) result.adress = result.adress_en;
    }

    for (const key of Object.keys(result)) {
      if (result[key] && typeof result[key] === 'object') {
        result[key] = this.transform(result[key], lang, isDashboardRoute, visited);
      }
    }

    return result;
  }
}