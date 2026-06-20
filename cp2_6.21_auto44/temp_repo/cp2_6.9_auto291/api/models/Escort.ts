import mongoose, { Schema, Document } from 'mongoose';

export interface IEscort extends Document {
  name: string;
  avatar: string;
  martialSkill: number;
  experience: number;
  completedMissions: number;
  successfulMissions: number;
}

const EscortSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    required: true
  },
  martialSkill: {
    type: Number,
    required: true,
    min: 3,
    max: 9
  },
  experience: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  completedMissions: {
    type: Number,
    default: 0,
    min: 0
  },
  successfulMissions: {
    type: Number,
    default: 0,
    min: 0
  }
});

export default mongoose.model<IEscort>('Escort', EscortSchema);
