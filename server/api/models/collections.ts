import mongoose from "mongoose";
import sequence from "mongoose-sequence";

const AutoIncrement = sequence(mongoose);

// Status : 1 Created
// Status : 2 Proccess
// Status : 3 Done
// Status : 4 Error

export interface CollectionModel extends mongoose.Document {
  name : string,
  status: number;
}

const schemaCollections = new mongoose.Schema(
  {
    idCollection: { type: Number, unique: true },
    name : {type : String},
    status: { type: Number },
  },
  {
    collection: "collections",
  }
);

schemaCollections.plugin(AutoIncrement, { inc_field: "idCollection" });

export const CollectionSchema = mongoose.model<CollectionModel>(
  "CollectionSchema",
  schemaCollections
);
