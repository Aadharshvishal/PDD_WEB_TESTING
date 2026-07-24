import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  /** Pings the root of the configured Flask API to check reachability. */
  async ping(baseUrl: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.get(baseUrl, { responseType: 'text' }));
      return true;
    } catch {
      return false;
    }
  }

  /** Sends an image blob to {baseUrl}/predict and returns the raw_score. */
  async predict(baseUrl: string, imageBlob: Blob): Promise<{ raw_score: number } | null> {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'capture.jpg');
      const res: any = await firstValueFrom(this.http.post(`${baseUrl}/predict`, formData));
      if (res && typeof res.raw_score === 'number') {
        return { raw_score: res.raw_score };
      }
      return null;
    } catch {
      return null;
    }
  }
}
