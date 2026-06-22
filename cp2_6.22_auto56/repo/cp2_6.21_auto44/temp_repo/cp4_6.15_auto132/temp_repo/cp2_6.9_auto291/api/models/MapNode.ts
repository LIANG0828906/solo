import mongoose, { Schema, Document } from 'mongoose';

export interface IMapNode extends Document {
  name: string;
  x: number;
  y: number;
  type: 'town' | 'mountain' | 'river';
}

const MapNodeSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['town', 'mountain', 'river'],
    required: true
  }
});

export default mongoose.model<IMapNode>('MapNode', MapNodeSchema);
