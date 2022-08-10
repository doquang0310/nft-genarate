import ExamplesService from "../../services/nft.service";
import { Request, Response, NextFunction } from "express";
import { genNftOrder } from "../../../queue/nftGen";
export class Controller {
  async genNftCollection(req: Request, res: Response, next: NextFunction) {
    try {
      let order = {
        body: req.body,
        uid: req.body.uid,
      };
      genNftOrder(order)
        .then(() =>
          res.json({
            done: true,
            message: "Your order will be ready in a while",
          })
        )
        .catch(() =>
          res.json({ done: false, message: "Your order could not be placed" })
        );
    } catch (err) {
      return next(err);
    }
  }
}
export default new Controller();
