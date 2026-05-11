import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { VariantsService } from './variants.service';
import { VariantsController } from './variants.controller';

@Module({
  providers: [ItemsService, VariantsService],
  controllers: [ItemsController, VariantsController],
})
export class ItemsModule {}