import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingMap = new Map<string, boolean>();

  public isLoading$ = this.loadingSubject.asObservable();

  setLoading(loading: boolean, key: string = 'global'): void {
    if (loading) {
      this.loadingMap.set(key, loading);
    } else {
      this.loadingMap.delete(key);
    }

    this.loadingSubject.next(this.loadingMap.size > 0);
  }

  isLoadingKey(key: string): boolean {
    return this.loadingMap.has(key);
  }

  clearLoading(): void {
    this.loadingMap.clear();
    this.loadingSubject.next(false);
  }
}
