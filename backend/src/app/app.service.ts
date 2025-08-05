import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getLive(): string {
    return 'live!';
  }
}
