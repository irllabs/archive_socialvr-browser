import { Component } from '@angular/core';
import { AngularFireStorage } from 'angularfire2/storage';
import { Project } from 'data/project/projectModel';

@Component({
  selector: 'project-thumbnail',
  styleUrls: ['./project-thumbnail.scss'],
  templateUrl: './project-thumbnail.html',
  inputs: ['project']
})
export class ProjectThumbnail {
  public project: Project;
  public url: string = '';

  constructor(
    public afStorage: AngularFireStorage,
  ) {
  }

  ngOnInit(){
    console.log('init', this.project);
    if (this.project && this.project.thumbnailUrl) {
      this.afStorage.ref(this.project.thumbnailUrl).getDownloadURL().toPromise().then(
        (res) => {
          this.url = res;
        }
      );
    }
  }
}
