import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dtos/create-subscription.dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new subscription' })
  create(@Body() createDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  findAll(@Query('active') active?: boolean) {
    return this.subscriptionsService.findAll(active);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by id' })
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subscription' })
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateSubscriptionDto>,
  ) {
    return this.subscriptionsService.update(id, updateDto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle subscription active status' })
  toggle(@Param('id') id: string) {
    return this.subscriptionsService.toggleActive(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete subscription' })
  remove(@Param('id') id: string) {
    return this.subscriptionsService.delete(id);
  }
}
