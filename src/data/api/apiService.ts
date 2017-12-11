import {Injectable} from '@angular/core';
import {Http, Response, Headers, RequestOptions, ResponseContentType} from '@angular/http';
import {Observable} from 'rxjs/Observable';

import {AssetInteractor} from 'core/asset/assetInteractor';
import Api from 'data/api/api';
import {BASE_URL, MIME_TYPE_MP4} from 'ui/common/constants';
import {AuthenticationService} from 'data/authentication/authenticationService';
import {generateUniqueId} from 'data/util/uuid';

// import * as firebase from 'firebase/app';
// import 'firebase/auth';
// import 'firebase/storage';

const URL_GET_AUTH_TOKEN: string = '/get_auth_token/';
const URL_LOG_IN: string = '/login/';
const URL_LOG_OUT: string = '/logout/';
const URL_PATH_MEDIA: string = '/media/';
const URL_PATH_USER: string = '/user/';
const URL_PATH_USERS: string = '/users/';
const URL_PATH_PROJECTS: string = '/projects/';
const SIGN_URL: string = '/sign_url/';
const SEARCH_URL: string = '/search/';

@Injectable()
export class ApiService implements Api {

  constructor(
    private http: Http,
    private authenticationService: AuthenticationService,
    private assetInteractor: AssetInteractor,
  ) {}

  // POST /get_auth_token/
  logIn(userName: string, password: string): Observable<string> {
    const URL: string = `${BASE_URL}${URL_GET_AUTH_TOKEN}`;
    const payload = {
      username: userName,
      password: password
    };

    return this.http.post(URL, payload, {withCredentials: true})
      .map(response => response.json())
      .map(responseJson => responseJson.token);
  }

  logOut(): Observable<any> {
    const URL: string = `${BASE_URL}${URL_LOG_OUT}`;
    return this.http.delete(URL, {withCredentials: true});
  }

  // GET /media/?s3_key&content_type
  getUploadPolicy(): Observable<any> {
    const URL: string = `${BASE_URL}${URL_PATH_MEDIA}`;
    return this.http.get(URL, {withCredentials: true})
      .map(response => response.json());
  }

  // GET  /user/
  getUser(): Observable<any> {
    const URL: string = `${BASE_URL}${URL_PATH_USER}`;
    return this.http.get(URL, this.getRequestOptions())
      .map(response => response.json());
  }

  // POST /users/
  createUser(firstName: string, lastName: string, userName: string, password: string, email: string): Observable<any> {
    const URL: string = `${BASE_URL}${URL_PATH_USERS}`;
    const payload = {
      password: password,
      first_name: firstName,
      last_name: lastName,
      username: userName,
      email: email
    };
    return this.http.post(URL, payload, {withCredentials: true})
      .map(response => response.json());
  }

  // POST /users/userId/projects/
  createProject(userId: string, projectName: string, projectTags: string, storyFile: any, thumbnail: string): Observable<any> {
    const URL: string = `${BASE_URL}${URL_PATH_USERS}${userId}${URL_PATH_PROJECTS}`;
    const formData: FormData = new FormData();
    formData.append('name', projectName);
    formData.append('tags', projectTags);
    formData.append('project_file', storyFile);
    formData.append('project_thumbnail', thumbnail);

    return this.http.post(URL, formData, this.getRequestOptions())
      .map(response => response.json());
  }

  // GET /users/userId/projects/
  getProjects(userId: string): Observable<any> {
    const URL: string = `${BASE_URL}${URL_PATH_USERS}${userId}${URL_PATH_PROJECTS}`;
    console.log('getProjects');
    return this.http.get(URL, this.getRequestOptions())
      .map(response => response.json());
  }

  // GET /users/userId/projects/projectId/
  getProjectData(userId: string, projectId): Observable<any> {
    const URL: string = `${BASE_URL}${URL_PATH_USERS}${userId}${URL_PATH_PROJECTS}${projectId}/`;
    return this.http.get(URL, this.getRequestOptions())
      .map(response => response.json());
  }

  // GET /users/userId/projects/projectId/sign_url/
  getProjectUrl(userId: string, projectId: string): Observable<string> {
    //return Observable.from('test');
    const URL: string = `${BASE_URL}${URL_PATH_USERS}${userId}${URL_PATH_PROJECTS}${projectId}${SIGN_URL}`;
    return this.http.get(URL, this.getRequestOptions())
       .map(response => response.json().signed_url);
  }

  // GET project from temporary signed URL or public URL
  getProject(signedProjectUrl: string): Observable<any> {
    //const localUrl = '__stubs__/painting.zip';
    return this.http.get(signedProjectUrl, {responseType: ResponseContentType.ArrayBuffer})
      .map(response => response.arrayBuffer());
  }

  // PUT /users/userId/projects/projectId/
  updateProject(userId: string, projectId: string, projectName: string, projectTags: string, storyFile: any, thumbnail: string): Observable<any> {
    const URL: string = `${BASE_URL}${URL_PATH_USERS}${userId}${URL_PATH_PROJECTS}${projectId}/`;
    const formData: FormData = new FormData();
    formData.append('id', projectId); //TODO: should not be sending ...
    formData.append('name', projectName);
    formData.append('tags', projectTags);
    formData.append('project_file', storyFile);
    formData.append('project_thumbnail', thumbnail);

    return this.http.put(URL, formData, this.getRequestOptions())
      .map(response => response.json());
  }

  updateSharableStatus(userId: string, projectId: string, is_public: boolean): Observable<any> {
    const URL: string = `${BASE_URL}${URL_PATH_USERS}${userId}${URL_PATH_PROJECTS}${projectId}/is_public/`;
    const payloadBody = {is_public};
    return this.http.put(URL, payloadBody, this.getRequestOptions())
      .map(response => response.json());
  }

  // DELETE /users/userId/projects/projectId/
  deleteProject(userId: string, projectId: string): Observable<any> {
    const URL: string = `${BASE_URL}${URL_PATH_USERS}${userId}${URL_PATH_PROJECTS}${projectId}/`;
    return this.http.delete(URL, this.getRequestOptions());
  }

  // GET /search/
  searchPublicProjects(query: string): Observable<any> {
    const encodedQuery = encodeURIComponent(query);
    const URL: string = `${BASE_URL}${SEARCH_URL}?tags=${encodedQuery}`;
    return this.http.get(URL, this.getRequestOptions())
      .map(response => response.json());
  }

  // GET /admin_groups/groupName
  getAllProjectsInGroup(groupId: string): Observable<any> {
    const URL: string = `${BASE_URL}/admin_groups/${groupId}/`;
    return this.http.get(URL, this.getRequestOptions())
      .map(response => response.json());
  }

  setProjectInGroup(groupId: string, projectId: string, isIn: boolean, projectType: string): Observable<any> {
    const URL: string = `${BASE_URL}/user_groups/${groupId}/`;
    const payloadBody = {projectId, isIn, projectType};
    return this.http.put(URL, payloadBody, this.getRequestOptions())
      .map(response => response.json());
  }

  getGroup(groupId: string): Observable<any> {
    const URL: string = `${BASE_URL}/user_groups/${groupId}/`;
    return this.http.get(URL, this.getRequestOptions())
      .map(response => response.json());
  }

  getRequestOptions(): RequestOptions {
    const headers: Headers = new Headers({
      'Authorization': 'Token ' + this.authenticationService.getToken()
    });
    return new RequestOptions({
      withCredentials: true,
      headers: headers
    });
  }

  downloadMedia(mediaUrl): Observable<any> {
    return this.http.get(mediaUrl, {withCredentials: true})
  }

  uploadMedia(key: string, file): Observable<any> {
    const uploadPolicy = this.assetInteractor.getUploadPolicy();
    const payload = Object.assign(uploadPolicy.fields, { key, file });
    const formData = Object.keys(payload).reduce((formData, key) => {
      formData.append(key, payload[key]);
      return formData;
    }, new FormData());

    return this.http.post(uploadPolicy.url, formData, {withCredentials: true})
      .map(response => {
        // Set remote file name in mediaFile.remoteFileName if successful
        const remoteFileName = `${uploadPolicy.url}${key}`;
        return remoteFileName;
      })
  }

  uploadVideo(videoFile): Observable<any> {
    // const storagePath = `videos/${generateUniqueId()}.mp4`;
    // let uploadPromise;
    //
    // if (!firebase.auth().currentUser) {
    //   uploadPromise = firebase.auth().signInAnonymously().then(resolve => this.uploadFile(storagePath, videoFile));
    // }
    // else {
    //   uploadPromise = this.uploadFile(storagePath, videoFile);
    // }
    //
    return Observable.fromPromise(Promise.resolve());
  }
  //
  // private uploadFile(storagePath, file) {
  //   return firebase.storage().ref()
  //     .child(storagePath)
  //     .put(file)
  //     .then(snapshot => {
  //       return {
  //         downloadUrl: snapshot.downloadURL,
  //         storagePath: storagePath
  //       }
  //     });
  // }

}
