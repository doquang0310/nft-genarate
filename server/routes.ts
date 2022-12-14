import { Application } from "express";
import routesNft from "./api/controllers/nft/router";
import routesCollection from "./api/controllers/collections/router"
export default function routes(app: Application): void {
  app.use("/nft", routesNft);
  app.use('/collection', routesCollection)
}
