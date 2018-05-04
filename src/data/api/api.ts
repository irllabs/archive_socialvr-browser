import {Observable} from 'rxjs/Observable';

export default interface ApiService {

  logIn(userName: string, password: string): Observable<string>;

  getUploadPolicy(): Observable<any>;

  getUser(): Observable<any>;

  createUser(firstName: string, lastName: string, userName: string, password: string, email: string): Observable<any>;

  createProject(userId: string, projectName: string, projectTags: string, storyFile: any, thumbnail: string): Observable<any>;

  getProjects(userId: string): Observable<any>;

  getProjectData(userId: string, projectId): Observable<any>;

  getProjectUrl(userId: string, projectId: string): Observable<string>;

  getProject(signedProjectUrl: string): Observable<any>;

  updateProject(userId: string, projectId: string, projectName: string, projectTags: string, storyFile: any, thumbnail: string): Observable<any>;

  updateSharableStatus(userId: string, projectId: string, is_public: boolean): Observable<any>;

  uploadMedia(key: string, file, uploadPolicy): Observable<any>;

  getShortenedUrl(url: string): Observable<any>;

  deleteProject(userId: string, projectId: string): Observable<any>;

  searchPublicProjects(query: string): Observable<any>;

  getAllProjectsInGroup(groupId: string): Observable<any>;

  setProjectInGroup(groupId: string, projectId: string, isIn: boolean, projectType: string): Observable<any>;

  getGroup(groupId: string): Observable<any>;

}
