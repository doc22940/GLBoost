/* @flow */

import GLBoost from './../../globals';
import Vector4 from './Vector4';
import MathUtil from './MathUtil';

type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array |
Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;

export default class Vector3 {
  v: TypedArray;

  constructor(x:number|TypedArray, y?:number, z?:number) {
    if (ArrayBuffer.isView(x)) {
      this.v = ((x:any):TypedArray);
      return;
    } else {
      this.v = new Float32Array(3)
    }

    this.x = ((x:any):number);
    this.y = ((y:any):number);
    this.z = ((z:any):number);
  }

  isEqual(vec:Vector3) {
    if (this.x === vec.x && this.y === vec.y && this.z === vec.z) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Zero Vector
   */
  static zero() {
    return new Vector3(0, 0, 0);
  }



  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  length() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  }

  /*
   * disabled for now because Safari's Function.prototype.length is not configurable yet.
   */
  /*
  static length(vec3) {
    return Math.sqrt(vec3.x*vec3.x + vec3.y*vec3.y + vec3.z*vec3.z);
  }
  */

  /**
   * 長さの2乗
   */
  lengthSquared() {
    return this.x*this.x + this.y*this.y + this.z*this.z;
  }

  /**
   * 長さの2乗（static版）
   */
  static lengthSquared(vec3:Vector3) {
    return vec3.x*vec3.x + vec3.y*vec3.y + vec3.z*vec3.z;
  }

  lengthTo(vec3:Vector3) {
    var deltaX = vec3.x - this.x;
    var deltaY = vec3.y - this.y;
    var deltaZ = vec3.z - this.z;
    return Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);
  }

  static lengthBtw(lhv:Vector3, rhv:Vector3) {
    var deltaX = rhv.x - lhv.x;
    var deltaY = rhv.y - lhv.y;
    var deltaZ = rhv.z - lhv.z;
    return Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);
  }

  /**
   * 内積
   */
  dotProduct(vec3:Vector3) {
      return this.x * vec3.x + this.y * vec3.y + this.z * vec3.z;
  }

  /**
   * 内積（static版）
   */
  static dotProduct(lv:Vector3, rv:Vector3) {
    return lv.x * rv.x + lv.y * rv.y + lv.z * rv.z;
  }

  /**
   * 外積
   */
  cross(v:Vector3) {
    var x = this.y*v.z - this.z*v.y;
    var y = this.z*v.x - this.x*v.z;
    var z = this.x*v.y - this.y*v.x;

    this.x = x;
    this.y = y;
    this.z = z;

    return this;
  }

  /**
  * 外積(static版)
  */
  static cross(lv:Vector3, rv:Vector3) {
    var x = lv.y*rv.z - lv.z*rv.y;
    var y = lv.z*rv.x - lv.x*rv.z;
    var z = lv.x*rv.y - lv.y*rv.x;

    return new Vector3(x, y, z);
  }

  /**
   * 正規化
   */
  normalize() {
    var length = this.length();
    this.divide(length);

    return this;
  }

  /**
   * 正規化（static版）
   */
  static normalize(vec3:Vector3) {
    var length = vec3.length();
    var newVec = new Vector3(vec3.x, vec3.y, vec3.z);
    newVec.divide(length);

    return newVec;
  }

  /**
   * add value
   */
  add(v:Vector3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
  }

  /**
   * add value（static version）
   */
  static add(lv:Vector3, rv:Vector3) {
    return new Vector3(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z);
  }

  /**
   * 減算
   */
  subtract(v:Vector3) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;

    return this;
  }

  /**
   * 減算（static版）
   */
  static subtract(lv:Vector3, rv:Vector3) {
    return new Vector3(lv.x - rv.x, lv.y - rv.y, lv.z - rv.z);
  }

  /**
   * 除算
   */
  divide(val:number) {
    console.assert(val != 0, "0 division!");
    if (val !== 0) {
      this.x /= val;
      this.y /= val;
      this.z /= val;
    }

    return this;
  }

  /**
   * 除算（static版）
   */
  static divide(vec3:Vector3, val:number) {
    console.assert(val != 0, "0 division!");
    return new Vector3(vec3.x / val, vec3.y / val, vec3.z / val);
  }

  multiply(val:number) {
    this.x *= val;
    this.y *= val;
    this.z *= val;

    return this;
  }

  multiplyVector(vec:Vector3) {
    this.x *= vec.x;
    this.y *= vec.y;
    this.z *= vec.z;

    return this;
  }

  static multiply(vec3:Vector3, val:number) {
    return new Vector3(vec3.x * val, vec3.y * val, vec3.z * val);
  }

  static multiplyVector(vec3:Vector3, vec:Vector3) {
    return new Vector3(vec3.x * vec.x, vec3.y * vec.y, vec3.z * vec.z);
  }

  static angleOfVectors(lhv:Vector3, rhv:Vector3) {
    let cos_sita = Vector3.dotProduct(lhv, rhv) / ( lhv.length() * rhv.length() );

    let sita = Math.acos(cos_sita);

    if (GLBoost["VALUE_ANGLE_UNIT"] === GLBoost.DEGREE) {
      sita = MathUtil.radianToDegree(sita);
    }

    return sita;
  }

  divideVector(vec3:Vector3) {
    this.x /= vec3.x;
    this.y /= vec3.y;
    this.z /= vec3.z;

    return this;
  }

  static divideVector(lvec3:Vector3, rvec3:Vector3) {
    return new Vector3(lvec3.x / rvec3.x, lvec3.y / rvec3.y, lvec3.z / rvec3.z);
  }


  toVector4() {
    return new Vector4(this.x, this.y, this.z, 1.0);
  }

  toString() {
    return '(' + this.x + ', ' + this.y + ', ' + this.z +')';
  }

  get x() {
    return this.v[0];
  }

  set x(x:number) {
    this.v[0] = x;
  }

  get y() {
    return this.v[1];
  }

  set y(y:number) {
    this.v[1] = y;
  }

  get z() {
    return this.v[2];
  }

  set z(z:number) {
    this.v[2] = z;
  }

  get raw() {
    return this.v;
  }
}

GLBoost['Vector3'] = Vector3;
