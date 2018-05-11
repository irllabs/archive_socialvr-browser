import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions, ResponseContentType } from '@angular/http';

import Api from 'data/api/api';
import { UserService } from 'data/user/userService';
import { Observable } from 'rxjs/Observable';
import { BASE_URL, GOOGLE_API_KEY, GOOGLE_BASE_URL } from 'ui/common/constants';

const URL_SHORTENER_URL: string = `${GOOGLE_BASE_URL}urlshortener/v1/url`;

@Injectable()
export class ApiService implements Api {

  constructor(
    private http: Http,
    private userService: UserService,
  ) {
  }

  public logIn(userName: string, password: string): Observable<string> {
    const URL: string = `${BASE_URL}/auth/sign_in/`;
    const payload = {
      username: userName,
      password: password,
    };

    return this.http
      .post(URL, payload)
      .map(response => response.json().token);
  }

  public logInWithFirebaseIdToken(idToken) {
    const URL: string = `${BASE_URL}/auth/sign_in_with_id_token/`;
    const payload = {
      'id_token': idToken,
    };

    return this.http
      .post(URL, payload)
      .map(response => response.json());
  }

  public loadBinaryData(url: string) {
    return this.http
      .get(url, { responseType: ResponseContentType.ArrayBuffer })
      .map(response => response.arrayBuffer());
  }

  // GET /admin_groups/groupName
  getAllProjectsInGroup(groupId: string): Observable<any> {
    const URL: string = `${BASE_URL}/admin_groups/${groupId}/`;

    return this.http.get(URL, this.getRequestOptions())
      .map(response => response.json());
  }

  setProjectInGroup(groupId: string, projectId: string, isIn: boolean, projectType: string): Observable<any> {
    const URL: string = `${BASE_URL}/user_groups/${groupId}/`;
    const payloadBody = { projectId, isIn, projectType };

    return this.http.put(URL, payloadBody, this.getRequestOptions())
      .map(response => response.json());
  }

  getGroup(groupId: string): Observable<any> {
    const URL: string = `${BASE_URL}/user_groups/${groupId}/`;

    return this.http.get(URL, this.getRequestOptions())
      .map(response => response.json());
  }

  getRequestOptions(headerData = {}): RequestOptions {
    this.userService.authorize((name, val) => {
      headerData[name] = val;
    });

    return new RequestOptions({
      withCredentials: true,
      headers: new Headers(headerData),
    });
  }

  downloadMedia(mediaUrl: string, responseType: any = ResponseContentType.Blob): Observable<any> {
    return this.http
      .get(encodeURI(mediaUrl), { responseType })
      .map(response => response.blob());
  }

  getShortenedUrl(url: string): Observable<any> {
    return this.http
      .post(`${URL_SHORTENER_URL}?key=${GOOGLE_API_KEY}`, { 'longUrl': url })
      .map(response => response.json())
      .map(responseJson => responseJson.id);
  }
}
