import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { UserThrottlerGuard } from '../auth/user.throttler.guard.js';
import {
  type CreateMeetingInput,
  createMeetingSchema,
  type MeetingResponseInput,
  meetingResponseSchema,
  type UpdateMeetingInput,
  updateMeetingSchema,
} from './schemas/meeting.schema.js';
import { MeetingsService } from './meetings.service.js';

@Controller('meetings')
@UseGuards(AuthGuard, UserThrottlerGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    const viewer = this.getViewer(request);
    return this.meetingsService.findAll(viewer.id);
  }

  @Get('participants')
  findParticipants() {
    return this.meetingsService.findParticipants();
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createMeetingSchema))
    input: CreateMeetingInput,
  ) {
    const viewer = this.getViewer(request);
    return this.meetingsService.create(input, viewer.id);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updateMeetingSchema))
    input: UpdateMeetingInput,
  ) {
    const viewer = this.getViewer(request);
    return this.meetingsService.update(id, input, viewer.id);
  }

  @Patch(':id/cancel')
  cancel(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const viewer = this.getViewer(request);
    return this.meetingsService.cancel(id, viewer.id);
  }

  @Delete(':id')
  delete(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const viewer = this.getViewer(request);
    return this.meetingsService.delete(id, viewer.id);
  }

  @Patch(':id/response')
  respond(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(meetingResponseSchema))
    input: MeetingResponseInput,
  ) {
    const viewer = this.getViewer(request);
    return this.meetingsService.respond(id, input.status, viewer.id);
  }

  private getViewer(request: AuthenticatedRequest) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }
    return request.authUser;
  }
}
