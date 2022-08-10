import NftService from "../../services/nft.service";
import { Request, Response, NextFunction } from "express";
import { genNftOrder } from "../../../queue/nftGen";
import CollectionService from "../../services/collection.service";

export class Controller {
  async genNftCollection(req: Request, res: Response, next: NextFunction) {
    try {
      let dataCreateCollection = {
        name: req.body.name,
        status: 1,
      };

      CollectionService.create(dataCreateCollection).then((data: any) => {
        let order = {
          body: req.body,
          idCollection: data.idCollection,
        };
        genNftOrder(order)
          .then(() =>
            res.json({
              status : 200,
              code : 1,
              message: "Your order will be ready in a while",
              idCollection : data.idCollection,
              statusCollection : data.status
            })
          )
          .catch(() =>
            res.json({ done: false, message: "Your order could not be placed" })
          );
      });
    } catch (err) {
      return next(err);
    }
  }

  async getDataCollection(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body.idCollection) {
        res.status(202).json({
          status : 200,
          code : 2,
          message : "missing id collection"
        })
      }
      let listNft= [];
      const data = await CollectionService.getById(req.body.idCollection);
      if (data.status == 3) {
        listNft.push(await NftService.getByIdCollection(req.body.idCollection))
      } else {
        res.status(202).json({
          status : 200,
          code : 3,
          message: "Chua hoan thanh",
        })
      }
      res.json({
        status : 200,
        code : 1,
        message: "Successfully",
        data : listNft,
      })
    } catch (err) {
      return next(err);
    }
  }

  async checkStatusCollection(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body.idCollection) {
        res.status(202).json({
          status : 200,
          code : 2,
          message : "missing id collection"
        })
      }
      const data = await CollectionService.getById(req.body.idCollection);
      res.json({
        status : 200,
        code : 1,
        message: "Successfully",
        data : data
      })
    } catch (err) {
      return next(err);
    }
  }
}
export default new Controller();
