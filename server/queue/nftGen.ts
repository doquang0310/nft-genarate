const Queue = require("bee-queue");
const fs = require("fs");
import CollectionService from "../api/services/collection.service";
const basePath = process.cwd();

const { startCreating } = require(`${basePath}/server/common/hashlip/src/main`);


const options = {
  removeOnSuccess: false,
};

const genNft = new Queue("genNft", options);

genNft.process(async (job, done) => {
  const req = job.data;
  const collectionDir = `${basePath}/storage/${req.idCollection}`;
  const buildDir = `${basePath}/storage/${req.idCollection}/build`;
  const layersDir = `${basePath}/storage/${req.idCollection}/layers`;
  let layerOrder = [];

  setupFolder(collectionDir, buildDir, layersDir);
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
    Promise.all(
      item.listImage.map((element, index) => {
        var base64Data = element.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync(
          `${layersDir}/${item.name}/${index}.png`,
          base64Data,
          "base64",
          (err) => {
            if (err) console.log("errSaveImage", err);
            console.log("Saved!");
          }
        );
      })
    );
  });
  startCreating(
    [
      {
        growEditionSizeTo: 20,
        layersOrder: layerOrder,
      },
    ],
    `${buildDir}/images`,
    `${buildDir}/json`,
    layersDir,
    req.body,
    buildDir
  );

  await CollectionService.updateStatus(job.data.idCollection, 2);
});

genNft.on("succeeded", (job, result) => {
  CollectionService.updateStatus(job.data.idCollection, 3);
});

export const setupFolder = (collectionDir, buildDir, layersDir) => {
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
