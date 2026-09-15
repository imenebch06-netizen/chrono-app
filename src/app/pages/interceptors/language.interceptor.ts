import { HttpInterceptorFn } from '@angular/common/http';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  let currentLang = 'fr';

  // Lecture directe sans passer par le DI pour contourner la dépendance circulaire avec TranslateService
  try {
    currentLang = localStorage.getItem('chrono-lang') || 'fr';
  } catch {
    currentLang = 'fr';
  }

  // Clone la requête pour ajouter le header Accept-Language
  const modifiedReq = req.clone({
    setHeaders: {
      'Accept-Language': currentLang,
    },
  });

  return next(modifiedReq);
};