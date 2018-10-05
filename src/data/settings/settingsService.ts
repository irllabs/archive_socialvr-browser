import { Injectable } from "@angular/core"
import { AngularFirestore } from "angularfire2/firestore"

@Injectable()
export class SettingsService {
  private _settings: any

  constructor(private afStore: AngularFirestore) {}

  public get settings() {
    return this._settings
  }

  public setupSettings() {
    const doc = this.afStore.collection("settings").doc("public").ref

    doc.onSnapshot(result => {
      this._settings = result.data()
    })
  }
}
