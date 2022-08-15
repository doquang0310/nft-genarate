const basePath = process.cwd();
import { Request, Response, NextFunction } from "express";
import { setupFolder } from "../../../queue/nftGen";

const { startPreview } = require(`${basePath}/server/common/hashlip/src/main`);

const fs = require("fs");

export class Controller {
  async genPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const randomString =
        Date.now().toString() + Math.floor(Math.random() * 10000);
      const collectionDir = `${basePath}/storage/${randomString}`;
      const buildDir = `${basePath}/storage/${randomString}/build`;
      const layersDir = `${basePath}/storage/${randomString}/layers`;

      let layerOrder = [];
      let flagError = [];

      if (typeof req.body.layoutOrder == "object") {
        setupFolder(collectionDir, buildDir, layersDir);
        req.body.layoutOrder.map(async (item, indexLayout) => {
          layerOrder.push({ name: item.name });
          if (fs.existsSync(`${layersDir}/${item.name}`)) {
            fs.rmdirSync(
              `${layersDir}/${item.name}`,
              { recursive: true },
              (error) => {
                //you can handle the error here
              }
            );
            fs.mkdirSync(`${layersDir}/${item.name}`);
          } else {
            fs.mkdirSync(`${layersDir}/${item.name}`);
          }
          if (item.listImage.length > 0) {
            Promise.all(
              item.listImage.map((element, index) => {
                const base64Data = element.replace(
                  /^data:image\/png;base64,/,
                  ""
                );
                const base64regex =
                  /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
                if (base64regex.test(base64Data) == true) {
                  fs.writeFileSync(
                    `${layersDir}/${item.name}/${index}.png`,
                    base64Data,
                    "base64",
                    (err) => {
                      if (err) console.log("errSaveImage", err);
                      console.log("Saved!");
                    }
                  );
                } else {
                  flagError.push(`Not base64 format : ${item.name} - ${index}`);
                }
              })
            );
          } else {
            flagError.push(`List Image Null : ${item.name}`);
          }
        });
        if (flagError.length == 0) {
          const base64Image = await startPreview(
            [
              {
                growEditionSizeTo: 10,
                layersOrder: layerOrder,
              },
            ],
            layersDir,
            req.body,
            collectionDir
          );
          res.status(200).json({
            image: base64Image,
          });
        } else {
          res.status(202).json({
            error: flagError,
          });
        }
      } else {
        res.status(202).json({
          error: "The data is not in the correct format",
        });
      }
    } catch (err) {
      return next(err);
    }
  }
}
export default new Controller();
