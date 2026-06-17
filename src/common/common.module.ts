import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { CookieService } from './cookie.service';
import { DatabaseService } from './database.service';
import { loggerConfig } from './logger.config';

@Global()
@Module({
  imports: [PinoLoggerModule.forRoot(loggerConfig)],
  providers: [CookieService, DatabaseService],
  exports: [CookieService, DatabaseService],
})
export class CommonModule {}
