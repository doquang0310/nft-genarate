import l from "../../common/logger";

import { CollectionSchema, CollectionModel } from "../models/collections";

export class CollectionService {
  async getById(id: number): Promise<CollectionModel> {
    const data = (await CollectionSchema.findOne(
      { idCollection: id },
      "-_id -__v"
    ).lean()) as CollectionModel;
    return data;
  }

  async updateStatus(id: number, statusUpdate: number) {
    const update = await CollectionSchema.findOneAndUpdate(
      { idCollection: id },
      { $set: { status: statusUpdate }}
    )
  }

  async create(data) {
    const example = new CollectionSchema(data);
    const doc = (await example.save()) as CollectionModel;
    return doc;
  }
}

export default new CollectionService();
