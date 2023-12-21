import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { iRegister } from './Models/register';
import { iAccessData } from './Models/i-access-data';
import { BehaviorSubject, Observable, map, tap, throwError } from 'rxjs';
import { iLogin } from './Models/login';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  jwtHelper:JwtHelperService = new JwtHelperService()//ci permette di lavorare facilmente con i jwt

  authSubject = new BehaviorSubject<iAccessData|null>(null);//null è il valore di default, quindi si parte con utente non loggato

  user$ = this.authSubject.asObservable();//contiene i dati dell'utente loggato oppure null
  isLoggedIn$ = this.user$.pipe(map(user => !!user))//fornisce true o false in base allo stato di autenticaziuone dell'utente
  //isLoggedIn$ = this.user$.pipe(map(user => Boolean(user)))

  constructor(
    private http: HttpClient,//per le chiamate http
    private router: Router//per i redirect
  ) {

    this.restoreUser()//come prima cosa controllo se è già attiva una sessione, e la ripristino

  }

  //ng g environment
  registerUrl:string = environment.apiUrl + '/register';
  loginUrl:string = environment.apiUrl + '/login'



  signUp(data:iRegister):Observable<iAccessData>{
    return this.http.post<iAccessData>(this.registerUrl, data)
  }

  login(data:iLogin):Observable<iAccessData>{
    return this.http.post<iAccessData>(this.loginUrl, data)
    .pipe(tap(data => {

      this.authSubject.next(data)
      localStorage.setItem('accessData',JSON.stringify(data))


      this.autoLogout(data.accessToken)
    }))
  }

  autoLogout(jwt:string){
    const expDate = this.jwtHelper.getTokenExpirationDate(jwt) as Date;//recupero la data di scadenza del jwt
    const expMs = expDate.getTime() - new Date().getTime();//sottraggo i ms della data attuale da quelli della data del jwt

    setTimeout(()=>{//avvio un timer che fa logout allo scadere del tempo
      this.logout()
    },expMs)
  }

  logout(){
    this.authSubject.next(null);//comunico al behaviorsubject che il valore da propagare è null
    localStorage.removeItem('accessData');//elimino i dati salvati in localstorage
    this.router.navigate(['/auth/login']);//redirect al login
  }

  //metodo che controlla al reload di pagina se l'utente è loggato e se il jwt è scaduto
  restoreUser(){

      const userJson:string|null =  localStorage.getItem('accessData');//recupero i dati di accesso
      if(!userJson) return;//se i dati non ci sono blocco la funzione

      const accessData:iAccessData = JSON.parse(userJson);//se viene eseguita questa riga significa che i dati ci sono, quindi converto la stringa(che conteneva un json) in oggetto
      if(this.jwtHelper.isTokenExpired(accessData.accessToken)) return;//ora controllo se il token è scaduto, se lo è fermiamo la funzione

      //se nessun return viene eseguito proseguo
      this.authSubject.next(accessData)//invio i dati dell'utente al behaviorsubject
      this.autoLogout(accessData.accessToken)//riavvio il timer per la scadenza della sessione
  }


  errors(err: any) {
    switch (err.error) {
        case "Email and Password are required":
            return new Error('Email e password obbligatorie');
            break;
        case "Email already exists":
            return new Error('Utente esistente');
            break;
        case 'Email format is invalid':
            return new Error('Email scritta male');
            break;
        case 'Cannot find user':
            return new Error('utente inesistente');
            break;
            default:
        return new Error('Errore');
            break;
    }
  }

}
