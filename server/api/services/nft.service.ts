import l from "../../common/logger";

import { NftSchema, NftModel } from "../models/nft";

export class NftService {
  async getByIdCollection(id: number): Promise<NftModel> {
    const data = (await NftSchema.findOne(
      { idCollections: id },
      "-_id -__v"
    ).lean()) as NftModel;
    return data;
  }

  async create(data){
    const example = new NftSchema(data);
    const doc = (await example.save()) as NftModel;
    return doc;
  }
}

export default new NftService();
