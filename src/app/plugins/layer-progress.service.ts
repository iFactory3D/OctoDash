import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Observer, Subscription, timer } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { OctoprintLayerProgress } from '../model/octoprint/layerProgress.model';

@Injectable({
  providedIn: 'root',
})
export class LayerProgressService {
  private httpGETRequest: Subscription;
  private observable: Observable<DisplayLayerProgressAPI>;

  public constructor(
    private configService: ConfigService,
    private notificationService: NotificationService,
    private http: HttpClient,
  ) {
    this.observable = new Observable((observer: Observer<DisplayLayerProgressAPI>): void => {
      timer(1000, this.configService.getAPIPollingInterval()).subscribe((): void => {
        if (this.httpGETRequest) {
          this.httpGETRequest.unsubscribe();
        }
        this.httpGETRequest = this.http
          .get(
            this.configService.getApiURL('plugin/DisplayLayerProgress/values', false),
            this.configService.getHTTPHeaders(),
          )
          .subscribe(
            (data: OctoprintLayerProgress): void => {
              observer.next({
                current: data.layer.current === '-' ? 0 : Number(data.layer.current),
                total: data.layer.total === '-' ? 0 : Number(data.layer.total),
                fanSpeed: data.fanSpeed === '-' ? 0 : data.fanSpeed === 'Off' ? 0 : data.fanSpeed.replace('%', ''),
              });
            },
            (error: HttpErrorResponse): void => {
              this.notificationService.setError("Can't retrieve layer progress!", error.message);
            },
          );
      });
    }).pipe(shareReplay(1));
  }

  public getObservable(): Observable<DisplayLayerProgressAPI> {
    return this.observable;
  }
}

export interface DisplayLayerProgressAPI {
  current: number;
  total: number;
  fanSpeed: number | string;
}
