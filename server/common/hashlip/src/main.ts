import sha1 from "sha1";
import fs from "fs";
import { createCanvas, loadImage } from "canvas";
import { create } from "ipfs-http-client";
import NftCollectionService from "../../../api/services/nft.service";

import {
  background,
  uniqueDnaTorrance,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
} from "./config";

const DNA_DELIMITER = "-";
const auth =
  "Basic " +
  Buffer.from(
    "2DC8ena3tD5OwEQd8lhce7rqqEF" + ":" + "e75aa2b9e48ece376b841ba107875678",
    "utf8"
  ).toString("base64");
const client = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  apiPath: "/api/v0",
  headers: { authorization: auth },
});

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const cleanDna = (_str) => {
  const withoutOptions = removeQueryStrings(_str);
  var dna = Number(withoutOptions.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      if (i.includes("-")) {
        throw new Error(`layer name can not contain dashes, please fix: ${i}`);
      }
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder, layersDir) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    elements: getElements(`${layersDir}/${layerObj.name}/`),
    name:
      layerObj.options?.["displayName"] != undefined
        ? layerObj.options?.["displayName"]
        : layerObj.name,
    blend:
      layerObj.options?.["blend"] != undefined
        ? layerObj.options?.["blend"]
        : "source-over",
    opacity:
      layerObj.options?.["opacity"] != undefined
        ? layerObj.options?.["opacity"]
        : 1,
    bypassDNA:
      layerObj.options?.["bypassDNA"] !== undefined
        ? layerObj.options?.["bypassDNA"]
        : false,
  }));
  return layers;
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const addMetadata = (
  _dna,
  _edition,
  attributesList,
  metadataDir,
  data,
  imageUrl,
  idCollection
) => {
  let dateTime = Date.now();
  let tempMetadata = {
    name: `${data.name} #${_edition}`,
    description: data.description,
    image: imageUrl,
    dna: sha1(_dna),
    edition: _edition,
    date: dateTime,
    ...extraMetadata,
    attributes: attributesList,
  };
  let dataToSave = {
    idCollections: idCollection,
    idNft: _edition,
    data: JSON.stringify(tempMetadata),
  };
  NftCollectionService.create(dataToSave);
};

const addAttributes = (_element, attributesList) => {
  let selectedElement = _element.layer.selectedElement;
  attributesList.push({
    trait_type: _element.layer.name,
    value: selectedElement.name,
  });
};

const loadLayerImg = async (_layer) => {
  try {
    return new Promise(async (resolve) => {
      const image = await loadImage(`${_layer.selectedElement.path}`);
      resolve({ layer: _layer, loadedImage: image });
    });
  } catch (error) {
    console.error("Error loading image:", error);
  }
};

const constructLayerToDna = (_dna = "", _layers = []) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement = layer.elements.find(
      (e) => e.id == cleanDna(_dna.split(DNA_DELIMITER)[index])
    );
    return {
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToLayers;
};

/**
 * In some cases a DNA string may contain optional query parameters for options
 * such as bypassing the DNA isUnique check, this function filters out those
 * items without modifying the stored DNA.
 *
 * @param {String} _dna New DNA string
 * @returns new DNA string with any items that should be filtered, removed.
 */
const filterDNAOptions = (_dna) => {
  const dnaItems = _dna.split(DNA_DELIMITER);
  const filteredDNA = dnaItems.filter((element) => {
    const query = /(\?.*$)/;
    const querystring = query.exec(element);
    if (!querystring) {
      return true;
    }
    const options: any = querystring[1].split("&").reduce((r, setting) => {
      const keyPairs = setting.split("=");
      return { ...r, [keyPairs[0]]: keyPairs[1] };
    }, []);

    return options.bypassDNA;
  });

  return filteredDNA.join(DNA_DELIMITER);
};

/**
 * Cleaning function for DNA strings. When DNA strings include an option, it
 * is added to the filename with a ?setting=value query string. It needs to be
 * removed to properly access the file name before Drawing.
 *
 * @param {String} _dna The entire newDNA string
 * @returns Cleaned DNA string without querystring parameters.
 */
const removeQueryStrings = (_dna) => {
  const query = /(\?.*$)/;
  if (_dna == undefined) {
    _dna = "";
  }
  return _dna.replace(query, "");
};

const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
  const _filteredDNA = filterDNAOptions(_dna);
  return !_DnaList.has(_filteredDNA);
};

const createDna = (_layers) => {
  let randNum = [];
  _layers.forEach((layer) => {
    var totalWeight = 0;
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight);
    for (var i = 0; i < layer.elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight;
      if (random < 0) {
        return randNum.push(
          `${layer.elements[i].id}:${layer.elements[i].filename}${
            layer.bypassDNA ? "?bypassDNA=true" : ""
          }`
        );
      }
    }
  });
  return randNum.join(DNA_DELIMITER);
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

const startCreating = async (
  layerConfigParams,
  saveMetadataDir,
  layersDir,
  data,
  idCollection
) => {
  var dnaList = new Set();
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];
  let attributesList = [];

  const canvas = createCanvas(parseInt(data.width), parseInt(data.height));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false; // option

  for (
    let i = 1;
    i <= layerConfigParams[layerConfigParams.length - 1].growEditionSizeTo;
    i++
  ) {
    abstractedIndexes.push(i);
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }
  while (layerConfigIndex < layerConfigParams.length) {
    const layers = layersSetup(
      layerConfigParams[layerConfigIndex].layersOrder,
      layersDir
    );

    while (
      editionCount <= layerConfigParams[layerConfigIndex].growEditionSizeTo
    ) {
      let newDna = createDna(layers);
      if (isDnaUnique(dnaList, newDna)) {
        let results = constructLayerToDna(newDna, layers);
        let loadedElements = [];

        results.forEach((layer) => {
          loadedElements.push(loadLayerImg(layer));
        });

        await Promise.all(loadedElements).then(async (renderObjectArray) => {
          ctx.clearRect(0, 0, data.width, data.height);
          // if (background.generate) {
          //   ctx.fillStyle = background.static ? background.default : genColor();
          //   ctx.fillRect(0, 0, data.width, data.height);
          // }
          renderObjectArray.forEach((renderObject, index) => {
            ctx.globalAlpha = renderObject.layer.opacity;
            ctx.globalCompositeOperation = renderObject.layer.blend;
            ctx.drawImage(
              renderObject.loadedImage,
              0,
              0,
              data.width,
              data.height
            );

            addAttributes(renderObject, attributesList);
          });
          const uploadImageIpfs = await client.add(
            canvas.toBuffer("image/png")
          );
          const imageUrl = `hhttps://nftfairlaunch.infura-ipfs.io/ipfs/${uploadImageIpfs.path}`;

          addMetadata(
            newDna,
            abstractedIndexes[0],
            attributesList,
            saveMetadataDir,
            data,
            imageUrl,
            idCollection
          );
          attributesList = [];
        });

        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        abstractedIndexes.shift();
      } else {
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          break;
        }
      }
    }
    layerConfigIndex++;
  }
};

const startPreview = async (
  layerConfigParams,
  layersDir,
  data,
  collectionDir
) => {
  var dnaList = new Set();
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];
  let attributesList = [];

  let base64Image;

  const canvas = createCanvas(parseInt(data.width), parseInt(data.height));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false; // option

  for (
    let i = 1;
    i <= layerConfigParams[layerConfigParams.length - 1].growEditionSizeTo;
    i++
  ) {
    abstractedIndexes.push(i);
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }
  while (layerConfigIndex < layerConfigParams.length) {
    const layers = layersSetup(
      layerConfigParams[layerConfigIndex].layersOrder,
      layersDir
    );
    while (
      editionCount <= layerConfigParams[layerConfigIndex].growEditionSizeTo
    ) {
      let newDna = createDna(layers);
      if (isDnaUnique(dnaList, newDna)) {
        let results = constructLayerToDna(newDna, layers);
        let loadedElements = [];

        results.forEach((layer) => {
          loadedElements.push(loadLayerImg(layer));
        });

        await Promise.all(loadedElements).then(async (renderObjectArray) => {
          ctx.clearRect(0, 0, data.width, data.height);
          // if (background.generate) {
          //   ctx.fillStyle = background.static ? background.default : genColor();
          //   ctx.fillRect(0, 0, data.width, data.height);
          // }
          renderObjectArray.forEach((renderObject, index) => {
            ctx.globalAlpha = renderObject.layer.opacity;
            ctx.globalCompositeOperation = renderObject.layer.blend;
            ctx.drawImage(
              renderObject.loadedImage,
              0,
              0,
              data.width,
              data.height
            );

            addAttributes(renderObject, attributesList);
          });
          fs.rmdirSync(collectionDir, { recursive: true });
          base64Image =  canvas.toDataURL('image/png');
        });

        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        abstractedIndexes.shift();
      } else {
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          break;
        }
      }
    }
    layerConfigIndex++;
  }
  return base64Image;
};

module.exports = { startCreating, startPreview, getElements };
