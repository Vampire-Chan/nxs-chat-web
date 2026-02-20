export const debuglog = () => () => {};
export const inspect = (obj: any) => JSON.stringify(obj);
export const inherits = (ctor: any, superCtor: any) => {
  if (superCtor) {
    ctor.super_ = superCtor;
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
  }
};
export const promisify = (fn: Function) => (...args: any[]) => new Promise((resolve, reject) => fn(...args, (err: any, val: any) => err ? reject(err) : resolve(val)));
export const types = {
  isTypedArray: (arr: any) => ArrayBuffer.isView(arr) && !(arr instanceof DataView),
  isUint8Array: (arr: any) => arr instanceof Uint8Array,
};

export default {
  debuglog,
  inspect,
  inherits,
  promisify,
  types,
};
