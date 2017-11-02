import {Injectable} from '@angular/core';
import {Http, Response, Headers, RequestOptions, ResponseContentType} from '@angular/http';
import {Observable} from 'rxjs/Observable';

import Api from 'data/api/api';
import {AuthenticationService} from 'data/authentication/authenticationService';
const getUser = require('../../__stubs__/user.json');
const getProjects = require('../../__stubs__/projects.json');

console.log(getUser, getProjects);

@Injectable()
export class ApiService implements Api {

  constructor(
    private http: Http,
    private authenticationService: AuthenticationService
  ) {}

  logIn(userName: string, password: string): Observable<string> {
    return Observable.from('STUB_TOKEN');
  }

  logOut(): Observable<any> {
    return Observable.from('');
  }

  getUser(): Observable<any> {
    return Observable.from(getUser);
  }

  createUser(firstName: string, lastName: string, userName: string, password: string, email: string): Observable<any> {
    return Observable.from('');
  }

  createProject(userId: string, projectName: string, projectTags: string, storyFile: any, thumbnail: string): Observable<any> {
    return Observable.from('');
  }

  getProjects(userId: string): Observable<any> {
    return Observable.from(getProjects);
  }

  getProjectData(userId: string, projectId): Observable<any> {
    return Observable.from(getProjects[0]);
  }

  getProjectUrl(userId: string, projectId: string): Observable<string> {
    const projectUrl = getProjects[0].storage_url;
    return Observable.from(projectUrl);
  }

  getProject(signedProjectUrl: string): Observable<any> {
    return this.http.get(signedProjectUrl, {responseType: ResponseContentType.ArrayBuffer})
      .map(response => response.arrayBuffer());
  }

  updateProject(userId: string, projectId: string, projectName: string, projectTags: string, storyFile: any, thumbnail: string): Observable<any> {
    return Observable.from('');
  }

  updateSharableStatus(userId: string, projectId: string, is_public: boolean): Observable<any> {
    return Observable.from('');
  }

  deleteProject(userId: string, projectId: string): Observable<any> {
    return Observable.from('');
  }

  searchPublicProjects(query: string): Observable<any> {
    return Observable.from('');
  }

  getAllProjectsInGroup(groupId: string): Observable<any> {
    return Observable.from('');
  }

  setProjectInGroup(groupId: string, projectId: string, isIn: boolean, projectType: string): Observable<any> {
    return Observable.from('');
  }

  getGroup(groupId: string): Observable<any> {
    return Observable.from('');
  }

}
