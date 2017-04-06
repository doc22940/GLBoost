import L_AbstractCamera from './L_AbstractCamera';
import Matrix44 from '../../math/Matrix44';

export default class L_FrustumCamera extends L_AbstractCamera {
  constructor(glBoostContext, toRegister, lookat, frustum) {
    super(glBoostContext, toRegister, lookat);

    this._left = frustum.left;
    this._right = frustum.right;
    this._top = frustum.top;
    this._bottom = frustum.bottom;
    this._zNear = frustum.zNear;
    this._zFar = frustum.zFar;

    this._zNearInner = frustum.zNear;
    this._zFarInner = frustum.zFar;

    this._dirtyProjection = true;
    this._updateCountAsCameraProjection = 0;
  }

  _needUpdateProjection() {
    this._dirtyProjection = true;
    this._updateCountAsCameraProjection++;
  }

  get updateCountAsCameraProjection() {
    return this._updateCountAsCameraProjection;
  }

  projectionRHMatrix() {
    if (this._dirtyProjection) {
      this._projectionMatrix = L_FrustumCamera.frustumRHMatrix(this._left, this._right, this._top, this._bottom, this._zNearInner, this._zFarInner);
      this._dirtyProjection = false;
      return this._projectionMatrix.clone();
    } else {
      return this._projectionMatrix.clone();
    }
  }

  static frustumRHMatrix(left, right, top, bottom, zNear, zFar) {
    return new Matrix44(
      2*zNear/(right-left), 0.0, (right+left)/(right-left), 0.0,
      0.0, 2*zNear/(top-bottom), (top+bottom)/(top-bottom), 0.0,
      0.0, 0.0, - (zFar+zNear)/(zFar-zNear), -1*2*zFar*zNear/(zFar-zNear),
      0.0, 0.0, -1.0, 0.0
    );
  }

  set left(value) {
    if (this._left === value) {
      return;
    }
    this._left = value;
    this._needUpdateProjection();
  }

  get left() {
    return this._left;
  }

  set right(value) {
    if (this._right === value) {
      return;
    }
    this._right = value;
    this._needUpdateProjection();
  }

  get right() {
    return this._right;
  }

  set top(value) {
    if (this._top === value) {
      return;
    }
    this._top = value;
    this._needUpdateProjection();
  }

  get top() {
    return this._top;
  }

  set bottom(value) {
    if (this._bottom === value) {
      return;
    }
    this._bottom = value;
    this._needUpdateProjection();
  }

  get bottom() {
    return this._bottom;
  }

  set zNear(value) {
    if (this._zNear === value) {
      return;
    }
    this._zNear = value;
    this._needUpdateProjection();
  }

  get zNear() {
    return this._zNear;
  }

  set zFar(value) {
    if (this._zFar === value) {
      return;
    }
    this._zFar = value;
    this._needUpdateProjection();
  }

  get zFar() {
    return this._zFar;
  }

  get aspect() {
    return (this.right - this.left) / (this.top - this.bottom);
  }
}
