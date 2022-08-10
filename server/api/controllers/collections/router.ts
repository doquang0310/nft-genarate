import express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/order-generate-nft-collection", controller.genNftCollection)
  .post("/get-detail",controller.getDataCollection)
  .post("/check-status",controller.checkStatusCollection);

