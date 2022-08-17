import mongoose from "mongoose";
import sequence from "mongoose-sequence";

const AutoIncrement = sequence(mongoose);

export interface NftModel extends mongoose.Document {
  length: any;
  idCollections: number;
  idNft: any;
  data: string;
}

const schemaNfts = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    idCollections: { type: Number },
    idNft: { type: Number },
    data: { type: String },
  },
  {
    collection: "nfts",
  }
);

schemaNfts.plugin(AutoIncrement, { inc_field: "id" });

export const NftSchema = mongoose.model<NftModel>("NftSchema", schemaNfts);

