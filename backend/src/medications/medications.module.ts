import { Module } from '@nestjs/common';
import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => {
        return {
          stores: [
            createKeyv(
              `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
            ),
          ],
        };
      },
    }),
    PrismaModule,
  ],
  controllers: [MedicationsController],
  providers: [MedicationsService],
})
export class MedicationsModule {}
