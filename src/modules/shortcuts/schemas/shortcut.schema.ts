import { User, UserDocument } from './../../users/schemas/user.schema';
import {
  Workspace,
  WorkspaceDocument,
} from './../../workspaces/schemas/workspace.schema';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ShortcutDocument = Shortcut & Document;

@Schema({ collection: 'shortcuts', timestamps: true })
export class Shortcut {
  @Prop({ required: true, minlength: 4 })
  title: string;

  @Prop({ required: true })
  link: string;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: Workspace.name,
    index: true,
  })
  workspace: WorkspaceDocument;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    index: true,
  })
  user: UserDocument;

  constructor(partial: Partial<Shortcut>) {
    Object.assign(this, partial);
  }
}

export const ShortcutSchema = SchemaFactory.createForClass(Shortcut);
