const Queue = require("bee-queue");
const fs = require("fs");
import CollectionService from "../api/services/collection.service";
const basePath = process.cwd();

const { startCreating } = require(`${basePath}/server/common/hashlip/src/main`);

const options = {
  removeOnSuccess: true,
};

const genNft = new Queue("genNft", options);

genNft.process(async (job, done) => {
  const req = job.data;
  const collectionDir = `${basePath}/storage/${req.idCollection}`;
  const buildDir = `${basePath}/storage/${req.idCollection}/build`;
  const layersDir = `${basePath}/storage/${req.idCollection}/layers`;

  let layerOrder = [];
  let flagError = [];

  if (typeof req.body.layoutOrder == "object") {
    await setupFolder(collectionDir, buildDir, layersDir);
    req.body.layoutOrder.map(async (item, index) => {
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
      if (typeof item.listImage == "object" && item.listImage.length > 0) {
        Promise.all(
          item.listImage.map((element, index) => {
            var base64Data = element.replace(/^data:image\/png;base64,/, "");
            const base64regex =
              /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
            if (base64regex.test(base64Data) == true) {
              fs.writeFileSync(
                `${layersDir}/${item.name}/${Math.floor(Math.random() * 1000000)}${index}.png`,
                base64Data,
                "base64",
                (err) => {
                  if (err) flagError.push("errSaveImage", err);
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
      await startCreating(
        [
          {
            growEditionSizeTo: req.body.totalImage,
            layersOrder: layerOrder,
          },
        ],
        `${buildDir}/json`,
        layersDir,
        req.body,
        req.idCollection
      );
      await CollectionService.updateStatus(job.data.idCollection, 2); 
    } else {
      await CollectionService.updateStatus(job.data.idCollection, 4);
    }
  }else {
    await CollectionService.updateStatus(job.data.idCollection, 4);
  }
});

genNft.on("succeeded", (job, result) => {
//   const req = job.data;
//   const collectionDir = `${basePath}/storage/${req.idCollection}`;
//   fs.rmdirSync(collectionDir, { recursive: true })
  CollectionService.updateStatus(job.data.idCollection, 3);
});

genNft.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error ${err.message}`);
});

export const setupFolder = async (collectionDir, buildDir, layersDir) => {
  if (!fs.existsSync(collectionDir)) {
    fs.mkdirSync(collectionDir);
  }
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true }, (error) => {
      //you can handle the error here
    });
    fs.mkdirSync(buildDir);
  } else {
    fs.mkdirSync(buildDir);
  }
  if (fs.existsSync(`${buildDir}/json`)) {
    fs.rmdirSync(`${buildDir}/json`, { recursive: true }, (error) => {
      //you can handle the error here
    });
    fs.mkdirSync(`${buildDir}/json`);
  } else {
    fs.mkdirSync(`${buildDir}/json`);
  }
  if (fs.existsSync(`${buildDir}/images`)) {
    fs.rmdirSync(`${buildDir}/images`, { recursive: true }, (error) => {
      //you can handle the error here
    });
    fs.mkdirSync(`${buildDir}/images`);
  } else {
    fs.mkdirSync(`${buildDir}/images`);
  }

  if (fs.existsSync(`${layersDir}`)) {
    fs.rmdirSync(`${layersDir}`, { recursive: true }, (error) => {
      //you can handle the error here
    });
    fs.mkdirSync(`${layersDir}`);
  } else {
    fs.mkdirSync(`${layersDir}`);
  }

  return true;
};

export const genNftOrder = (order) => {
  return genNft.createJob(order).save();
};
