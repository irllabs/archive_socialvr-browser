import { Observable } from 'rxjs/Observable';

export default interface ApiService {

  logIn(userName: string, password: string): Observable<string>;

  getShortenedUrl(url: string): Observable<any>;

  getAllProjectsInGroup(groupId: string): Observable<any>;

  setProjectInGroup(groupId: string, projectId: string, isIn: boolean, projectType: string): Observable<any>;

  getGroup(groupId: string): Observable<any>;

}
