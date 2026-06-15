import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IRecording extends Document {
  title: string
  notes: string
  qinming: string
  exportedImage: string
  createdAt: Date
}

export interface IGuqin extends Document {
  userId: Types.ObjectId
  name: string
  qinzhenMaterial: 'jade' | 'bone' | 'wood' | 'copper'
  stringType: 'taigu' | 'zhongqing' | 'xihe'
  lacquerColor: string
  stringTunings: number[]
  recordings: IRecording[]
  createdAt: Date
  updatedAt: Date
}

const RecordingSchema: Schema = new Schema<IRecording>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    qinming: {
      type: String,
      default: '',
      trim: true,
    },
    exportedImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
)

const GuqinSchema: Schema = new Schema<IGuqin>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    qinzhenMaterial: {
      type: String,
      enum: ['jade', 'bone', 'wood', 'copper'],
      default: 'wood',
    },
    stringType: {
      type: String,
      enum: ['taigu', 'zhongqing', 'xihe'],
      default: 'zhongqing',
    },
    lacquerColor: {
      type: String,
      default: '#4a2c1a',
    },
    stringTunings: {
      type: [Number],
      default: [0, 0, 0, 0, 0, 0, 0],
      validate: {
        validator: (v: number[]) => v.length === 7,
        message: 'stringTunings must have exactly 7 elements',
      },
    },
    recordings: {
      type: [RecordingSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

let GuqinModel: Model<IGuqin>

try {
  GuqinModel = mongoose.model<IGuqin>('Guqin')
} catch {
  GuqinModel = mongoose.model<IGuqin>('Guqin', GuqinSchema)
}

export default GuqinModel
