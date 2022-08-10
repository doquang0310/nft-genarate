import { Application } from "express";
import routesNft from "./api/controllers/nft/router";
export default function routes(app: Application): void {
  app.use("/nft", routesNft);
}
