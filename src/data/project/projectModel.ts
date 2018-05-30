export const PROJECT_STATES = {
  ASSETS_NOT_UPLOADED: 1,
  ASSETS_UPLOADED: 2,
};

export class Project {
  public id: string;
  public userId: string;
  public user: string;
  public name: string;
  public story: any;
  public tags: any;
  public isPublic: boolean;
  public thumbnailUrl: string;
  public state: number = PROJECT_STATES.ASSETS_NOT_UPLOADED;

  constructor(obj = {}) {
    this.id = obj['id']['_binaryString'] ? obj['id']['_binaryString'] : obj['id'];
    this.userId = obj['userId'];
    this.user = obj['user'];
    this.name = obj['name'];
    this.story = obj['story'];
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

  public toJson() {
    return {
      id: this.id,
      userId: this.userId,
      user: this.user,
      name: this.name,
      nameLower: (this.name || '').toLocaleLowerCase(),
      story: this.story,
      tags: this.tags,
      isPublic: this.isPublic,
      thumbnailUrl: this.thumbnailUrl,
      state: this.state,
    };
  }
}
