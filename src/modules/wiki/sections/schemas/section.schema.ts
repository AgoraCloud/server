import { User, UserDocument } from '../../../users/schemas/user.schema';
import {
  Workspace,
  WorkspaceDocument,
} from '../../../workspaces/schemas/workspace.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type WikiSectionDocument = WikiSection & mongoose.Document;

@Schema({ collection: 'wiki_sections', timestamps: true })
export class WikiSection {
  @Prop({ required: true, minlength: 1 })
  name: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Workspace.name,
    index: true,
  })
  workspace: WorkspaceDocument;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    index: true,
  })
  user: UserDocument;

  constructor(partial: Partial<WikiSection>) {
    Object.assign(this, partial);
  }
}

export const WikiSectionSchema = SchemaFactory.createForClass(WikiSection);
