import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { SearchMedicalDataService } from './chat/search-medical-data.service';
import { PrismaModule } from './prisma/prisma.module';
import { MedicationsModule } from './medications/medications.module';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 200,
        },
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MedicationsModule,
    ElasticsearchModule,
  ],
  controllers: [AppController, ChatController],
  providers: [AppService, ChatService, SearchMedicalDataService],
})
export class AppModule {}
