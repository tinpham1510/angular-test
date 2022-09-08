import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { RequestOptions } from './interface/request-options';

@Injectable()
export class ApiService {
  constructor(private http: HttpClient) {}
  public getDefaultHeaders(additional?: { [name: string]: any }): HttpHeaders {
    const token =
      'eyJraWQiOiJIK3VScTAzY0g5SUxnUDRnNkhNYjl6WWNSNHJyQk5UNGRKaTFKYlV6YWFRPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI1ODBiZTExNC1hZTFkLTQ2NjQtODIzNy1hMDEyMjJkNDcxNmIiLCJhdWQiOiI3Z3ZhNzduYXF0a2sxZzQwZm8yajFkZXYwcSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6IjExYWZkMmFhLWFkNmUtNGFmYy05NGM4LTYzODViMDcwYzhhOCIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNjYyNTE4MjU0LCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb21cL2V1LXdlc3QtMV82aUU0SkllUTAiLCJjb2duaXRvOnVzZXJuYW1lIjoiNTgwYmUxMTQtYWUxZC00NjY0LTgyMzctYTAxMjIyZDQ3MTZiIiwiZXhwIjoxNjYyNTIxODU0LCJpYXQiOjE2NjI1MTgyNTQsImVtYWlsIjoibGluaEBsaW1pdGxlc3NpbnNpZ2h0LmNvbSJ9.i3SzGjCd1EtmdB3iUKXvo1TqJJg_hKgdxmATMKdAMhkhvMZSTMxlUVScDTVcWqGbS3HkHyuA6QeNGk7ndI0zZdGNgXMHG3KCZvmXHFNoQYkgJm5Z7YINo0ZVK8wkP_6NcDOztEMRr7qNSqa5w5zg0NjwOFBzb4ajjs2Es2Kl8fjGd8Q8AUC2qMG2crU1n8Mxrf_totCNJ6jPYeckUnCTKjE8OiO7Pd717-4qCHmy4pDlPWMvgmvciKtwdzXkbOlKhu9x3mn4XUEHEV3xJPQb02eryHMXCg9mur_6wuf0qMfJZ3SrW3FMTlk5uUUxbWWEK30AMR8PJxqDpblA4uYyZw';
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (token) {
      headers = headers.set('Authorization', 'Bearer ' + token);
    }

    if (additional) {
      for (const name in additional) {
        const value = additional[name];
        headers = headers.set(name, value);
      }
    }

    return headers;
  }

  public getDefaultRequestOptions(additionalHeaders?: {
    [name: string]: any;
  }): RequestOptions {
    return {
      headers: this.getDefaultHeaders(additionalHeaders),
    };
  }

  public post(method: string, body?: any): Observable<any> {
    const options = this.getDefaultRequestOptions();
    const json: string = JSON.stringify(body);
    const url: string =
      'https://api.limitlessinsights.com/dashboard/dev' + method;
    return this.http.post(url, json, options).pipe();
  }

  public get(method: string, params?: HttpParams): Observable<any> {
    const options = this.getDefaultRequestOptions();
    const json: string = JSON.stringify(params);
    const url: string =
      'https://api.limitlessinsights.com/dashboard/dev' + method;
    return this.http.post(url, json, options).pipe();
  }
}
