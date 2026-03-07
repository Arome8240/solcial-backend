import { IsMongoId } from 'class-validator';

export class CreateChatDto {
  @IsMongoId()
  participantId: string;
}
