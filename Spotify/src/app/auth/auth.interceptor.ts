import { iAccessData } from './Models/i-access-data';
import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authSvc:AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    return this.authSvc.user$.pipe(switchMap((user:iAccessData|null) => {

      if(!user) return next.handle(request);

      const newRequest = request.clone({
        headers: request.headers.append('Authorization','Bearer '+ user.accessToken)
      })

      return next.handle(newRequest);
    }))

  }
}
