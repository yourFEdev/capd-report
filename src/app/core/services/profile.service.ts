import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProfileModel, ProfileUpdate } from '../models/profile.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/profile`;

  get() {
    return this.http.get<ProfileModel>(this.url);
  }
  update(payload: ProfileUpdate) {
    return this.http.put<ProfileModel>(this.url, payload);
  }
}
