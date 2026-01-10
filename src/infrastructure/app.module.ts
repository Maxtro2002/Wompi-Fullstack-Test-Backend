import { Module } from '@nestjs/common';

// AppModule keeps framework wiring separate from domain/application logic.
// Controllers will live under infrastructure/controllers, providers under infrastructure/* adapters.

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
