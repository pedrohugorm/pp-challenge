import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { SearchMedicalDataService } from './chat/search-medical-data.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, ChatController],
  providers: [AppService, ChatService, SearchMedicalDataService],
})
export class AppModule {}
