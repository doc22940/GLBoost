// @flow

import GLBoost from '../../globals';
import glBoostSystem from '../core/GLBoostSystem';
import L_AbstractMaterial from './L_AbstractMaterial';
import Vector2 from '../math/Vector2';
import Vector3 from '../math/Vector3';
import PBRPrincipledShader from '../../middle_level/shaders/PBRPrincipledShader';

export default class PBRMetallicRoughnessMaterial extends L_AbstractMaterial {
  _wireframeWidthRelativeScale: number;
  _baseColorFactor: Vector3;
  _metallicRoughnessFactors: Vector2;
  _emissiveFactor: Vector3;
  _shaderClass: PBRPrincipledShader;

  constructor(glBoostSystem: glBoostSystem) {
    super(glBoostSystem);

    this._wireframeWidthRelativeScale = 1.0;

    this._baseColorFactor = new Vector3(1.0, 1.0, 1.0);
    this._metallicRoughnessFactors = new Vector2(1.0, 1.0);
    this._emissiveFactor = new Vector3(0.0, 0.0, 0.0);

    this._shaderClass = PBRPrincipledShader;
  }

  get wireframeWidthRelativeScale() {
    return this._wireframeWidthRelativeScale;
  }

  set baseColor(val: Vector3) {
    this._baseColorFactor = val.clone();
  }

  get baseColor() {
    return this._baseColorFactor.clone();
  }

  set metallic(val: number) {
    this._metallicRoughnessFactors.x = val;
  }

  get metallic() {
    return this._metallicRoughnessFactors.x;
  }

  set roughness(val: number) {
    this._metallicRoughnessFactors.y = val;
  }

  get roughness() {
    return this._metallicRoughnessFactors.y;
  }

  set emissive(val: Vector3) {
    this._emissiveFactor = val;
  }

  get emissive() {
    return this._emissiveFactor;
  }
}

GLBoost['PBRMetallicRoughnessMaterial'] = PBRMetallicRoughnessMaterial;
