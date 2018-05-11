import { AngularFireStorage } from 'angularfire2/storage';

export class Project {
  public id: string;
  public userId: string;
  public user: string;
  public name: string;
  public storyFileUrl: string;
  public tags: any;
  public isPublic: boolean;
  public thumbnailUrl: string;

  constructor(obj = {}) {
    this.id = obj['id'];
    this.userId = obj['userId'];
    this.user = obj['user'];
    this.name = obj['name'];
    this.storyFileUrl = obj['storyFileUrl'];
    this.tags = obj['tags'];
    this.isPublic = obj['isPublic'];
    this.thumbnailUrl = obj['thumbnailUrl'];
  }

  public get tagsString() {
    return Object.keys(this.tags).join(', ');
  }

  public setTags(tag: string) {
    const tags = tag.split(' ').map(tag => tag.trim()).filter(tag => tag !== '');

    if (tags.length > 0) {
      this.tags = {};

      tags.forEach(key => this.tags[key] = true);
    } else {
      this.tags = null;
    }
  }

  public getThumbnailDownloadUrl(afStorage: AngularFireStorage) {
    if (this.thumbnailUrl) {
      return afStorage.ref(this.thumbnailUrl).getDownloadURL();
    }
  }

  public toJson() {
    return JSON.parse(JSON.stringify(this));
  }
}
