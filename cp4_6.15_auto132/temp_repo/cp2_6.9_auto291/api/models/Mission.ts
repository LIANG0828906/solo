import mongoose, { Schema, Document } from 'mongoose';

export interface ICartSelection {
  type: 'single' | 'double';
  count: number;
}

export interface IMission extends Document {
  userId: string;
  escorts: string[];
  carts: ICartSelection[];
  route: string[];
  banditEncounters: number;
  status: 'pending' | 'in-progress' | 'success' | 'failed';
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
}

const MissionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  escorts: [{
    type: Schema.Types.ObjectId,
    ref: 'Escort',
    required: true
  }],
  carts: [{
    type: {
      type: String,
      enum: ['single', 'double'],
      required: true
    },
    count: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  route: [{
    type: String,
    required: true
  }],
  banditEncounters: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'success', 'failed'],
    default: 'pending'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IMission>('Mission', MissionSchema);
