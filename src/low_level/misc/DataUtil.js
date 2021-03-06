import GLBoost from '../../globals';


export default class DataUtil {

  constructor() {

  }
  static isNode() {
    let isNode = (window === void 0 && typeof process !== "undefined" && typeof require !== "undefined");
    return isNode;
  }

  static btoa(str) {
    let isNode = DataUtil.isNode();
    if (isNode) {
      let buffer;
      if (Buffer.isBuffer(str)) {
        buffer = str;
      }
      else {
        buffer = new Buffer(str.toString(), 'binary');
      }
      return buffer.toString('base64');
    } else {
      return btoa(str)
    }
  }

  static atob(str) {
    let isNode = DataUtil.isNode();
    if (isNode) {
      return new Buffer(str, 'base64').toString('binary');
    } else {
      return atob(str)
    }
  }

  static base64ToArrayBuffer(dataUri) {
    let splittedDataUri = dataUri.split(',');
    let type = splittedDataUri[0].split(':')[1].split(';')[0];
    let byteString = DataUtil.atob(splittedDataUri[1]);
    let byteStringLength = byteString.length;
    let arrayBuffer = new ArrayBuffer(byteStringLength);
    let uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteStringLength; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    return arrayBuffer;
  }

  static arrayBufferToString(arrayBuffer) {
    if (typeof TextDecoder !== 'undefined') {
      let textDecoder = new TextDecoder();
      return textDecoder.decode(arrayBuffer);
    } else {
      let bytes = new Uint8Array(arrayBuffer);
      let result = "";
      let length = bytes.length;
      for (let i = 0; i < length; i++) {
        result += String.fromCharCode(bytes[i]);
      }
      return result;
    }
  }

  static stringToBase64(str) {
    let b64 = null;
    b64 = DataUtil.btoa(str);
    return b64;
  }

  static UInt8ArrayToDataURL(uint8array, width, height) {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    let imageData = ctx.createImageData(width, height);

    for(let i = 0; i < imageData.data.length; i+=4) {
      /*
      imageData.data[i + 0] = uint8array[imageData.data.length - i + 0];
      imageData.data[i + 1] = uint8array[imageData.data.length - i + 1];
      imageData.data[i + 2] = uint8array[imageData.data.length - i + 2];
      imageData.data[i + 3] = uint8array[imageData.data.length - i + 3];
      */
      imageData.data[i + 0] = uint8array[(height - Math.floor(i/(4*width)))*(4*width) + i%(4*width) + 0];
      imageData.data[i + 1] = uint8array[(height - Math.floor(i/(4*width)))*(4*width) + i%(4*width) + 1];
      imageData.data[i + 2] = uint8array[(height - Math.floor(i/(4*width)))*(4*width) + i%(4*width) + 2];
      imageData.data[i + 3] = uint8array[(height - Math.floor(i/(4*width)))*(4*width) + i%(4*width) + 3];
    }

    ctx.putImageData(imageData,0,0);
    canvas.remove();
    return canvas.toDataURL("image/png");
  }

  static loadResourceAsync(resourceUri, isBinary, resolveCallback, rejectCallback) {
    return new Promise((resolve, reject)=> {
      let isNode = DataUtil.isNode();

      if (isNode) {
        let fs = require('fs');
        let args = [resourceUri];
        let func = (err, response) => {
          if (err) {
            if (rejectCallback) {
              rejectCallback(reject, err);
            }
            return;
          }
          if (isBinary) {
            let buffer = new Buffer(response, 'binary');
            let uint8Buffer = new Uint8Array(buffer);
            response = uint8Buffer.buffer;
          }
          resolveCallback(resolve, response);
        };

        if (isBinary) {
          args.push(func);
        } else {
          args.push('utf8');
          args.push(func);
        }
        fs.readFile.apply(fs, args);
      } else {
        let xmlHttp = new XMLHttpRequest();
        if (isBinary) {
          xmlHttp.responseType = "arraybuffer";
          xmlHttp.onload = (oEvent) => {
            let response = null;
            if (isBinary) {
              response = xmlHttp.response;
            } else {
              response = xmlHttp.responseText;
            }
            resolveCallback(resolve, response);
          };
        } else {
          xmlHttp.onreadystatechange = ()=> {
            if (xmlHttp.readyState === 4 && (Math.floor(xmlHttp.status/100) === 2 || xmlHttp.status === 0)) {
              let response = null;
              if (isBinary) {
                response = xmlHttp.response;
              } else {
                response = xmlHttp.responseText;
              }
              resolveCallback(resolve, response);
            } else {
              if (rejectCallback) {
                rejectCallback(reject, xmlHttp.status);
              }
            }
          };
        }

        xmlHttp.open("GET", resourceUri, true);
        xmlHttp.send(null);
      }
    });
  }
}

GLBoost['DataUtil'] = DataUtil;
