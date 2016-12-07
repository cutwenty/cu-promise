const Promise = require("../promise.js");

module.exports = {
  resolved: (value) => {
    return new Promise((resolve) => {
      resolve(value);
    });
  },
  rejected: (value) => {
    return new Promise((resolve, reject) => {
      reject(value);
    });
  },
  deferred: () => {
    let resolve = null;
    let reject = null;
    return {
      promise: new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      }),
      resolve: resolve,
      reject: reject
    };
  }
};
