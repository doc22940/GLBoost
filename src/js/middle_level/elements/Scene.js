import Element from '../../low_level/elements/Element';
import Camera from '../../low_level/elements/cameras/PerspectiveCamera';
import AbstractLight from '../../low_level/lights/AbstractLight';
import Mesh from './meshes/Mesh';
import Group from './Group';
import AABB from '../../low_level/math/AABB';


/**
 * [en] This Scene class is the top level element of scene graph hierarchy.
 *       To render scene, pass this scene element to Renderer.draw method.<br>
 * [ja] このSceneクラスはシーングラフ階層のトップレベルに位置する要素です。
 *       シーンをレンダリングするには、このscene要素をRenderer.drawメソッドに渡します。
 */
export default class Scene extends Group {

  /**
   * [en] constructor
   * [ja] コンストラクタ
   * @param {HTMLCanvas|string} canvas [en] canvas or canvas' id string. [ja] canvasまたはcanvasのid文字列
   */
  constructor(glBoostContext) {
    super(glBoostContext);
    this._gl = this._glContext.gl;
    this._currentAnimationInputValues = {};
    this._reset();
  }

  _reset() {
    this._meshes = [];
    this._lights = [];
    this._cameras = [];
  }

  _setDirtyToAnimatedElement(inputName, element = this) {
    if (element.hasAnimation(inputName)) {
      element._needUpdate();
    }

    if (element instanceof Group || element instanceof Scene) {
      let children = element.getChildren();
      for (let i = 0; i < children.length; i++) {
        this._setDirtyToAnimatedElement(inputName, children[i]);
      }
    }
  }

  _getCurrentAnimationInputValue(inputName) {
    return this._currentAnimationInputValues[inputName];
  }

  /**
   * [en] Set animation input value (for instance frame value), This value affect all child elements in this scene graph (recursively).<br>
   * [ja] アニメーションのための入力値（例えばフレーム値）をセットします。この値はシーングラフに属する全ての子孫に影響します。
   * @param {string} inputName [en] inputName name of input value. [ja] 入力値の名前
   * @param {number|Vector2|Vector3|Vector4|*} inputValue [en] input value of animation. [ja] アニメーションの入力値
   */
  setCurrentAnimationValue(inputName, inputValue) {
    this._setDirtyToAnimatedElement(inputName);
    this._currentAnimationInputValues[inputName] = inputValue;
  }

  /**
   * [en] Prepare for Rendering. You have to call this method before Renderer.draw method.
   * [ja] レンダリングのための前処理を行います。Renderer.drawメソッドの前にこのメソッドを呼ぶ必要があります。
   */
  prepareToRender() {
    this._reset();

    var aabb = (function setParentAndMergeAABBRecursively(elem) {
      if (elem instanceof Group) {
        var children = elem.getChildren();
        for(let i=0; i<children.length; i++) {
          children[i]._parent = elem;
          var aabb = setParentAndMergeAABBRecursively(children[i]);
          if (aabb instanceof AABB) {
            elem.AABB.mergeAABB(aabb);
          } else {
            console.assert('calculation of AABB error!');
          }
        }
        return elem.AABB;
      }
      if (elem instanceof Mesh) {
        return elem.AABB;
      }

      return null;
    })(this);
    this.AABB.mergeAABB(aabb);

    let collectMeshes = function(elem) {
      if (elem instanceof Group) {
        var children = elem.getChildren();
        var meshes = [];
        children.forEach(function(child) {
          var childMeshes = collectMeshes(child);
          meshes = meshes.concat(childMeshes);
        });
        return meshes;
      } else if (elem instanceof Mesh) {
        return [elem];
      } else {
        return [];
      }
    };

    this._meshes = [];
    this._elements.forEach((elm)=> {
      this._meshes = this._meshes.concat(collectMeshes(elm));
    });

    let collectLights = function(elem) {
      if (elem instanceof Group) {
        var children = elem.getChildren();
        var lights = [];
        children.forEach(function(child) {
          var childLights = collectLights(child);
          lights = lights.concat(childLights);
        });
        return lights;
      } else if (elem instanceof AbstractLight) {
        return [elem];
      } else {
        return [];
      }
    };

    this._lights = [];
    this._elements.forEach((elm)=> {
      this._lights = this._lights.concat(collectLights(elm));
    });

    let existCamera_f = false;
    let collectCameras = function(elem) {
      if (elem instanceof Group) {
        var children = elem.getChildren();
        var cameras = [];
        children.forEach(function(child) {
          var childCameras = collectCameras(child);
          cameras = cameras.concat(childCameras);
        });
        return cameras;
      } else if (elem instanceof Camera) {
        existCamera_f = true;
        return [elem];
      } else {
        return [];
      }
    };

    this._cameras = [];
    this._elements.forEach((elm)=> {
      this._cameras = this._cameras.concat(collectCameras(elm));
    });
    if (this._cameras.length !== 0) {
      this._cameras[0].setAsMainCamera(this);
    }

    this._meshes.forEach((mesh)=> {
      mesh.prepareToRender(existCamera_f, this._lights);
    });


  }

  /**
   * [en] Get child elements which belong to this scene.<br>
   * [ja] このシーンに属していた子供の要素の配列を返します。
   * @return {Array<Element>} [en] child elements of this scene. [ja] このシーンの子供の要素
   */
  getChildren() {
    return this._elements;
  }

  /**
   * [en] Get child elements which belong to this scene.<br>
   * [ja] このシーンに属していた子供の要素の配列を返します。
   * @return {Array<Element>} [en] child elements of this scene. [ja] このシーンの子供の要素
   */
  get elements() {
    return this._elements;
  }

  /**
   * [en] Get child meshes which belong to this scene.<br>
   * [ja] このシーンに属していた子供のMesh要素の配列を返します。
   * @return {Array<Mesh>} [en] child meshes of this scene. [ja] このシーンの子供のMesh要素
   */
  get meshes() {
    return this._meshes;
  }

  /**
   * [en] Get child lights which belong to this scene.<br>
   * [ja] このシーンに属していた子供のLight要素の配列を返します。
   * @return {Array<AbstractLight>} [en] child lights of this scene. [ja] このシーンの子供のLight要素
   */
  get lights() {
    return this._lights;
  }

  /**
   * [en] Get child cameras which belong to this scene.<br>
   * [ja] このシーンに属していた子供のCamera要素の配列を返します。
   * @return {Array<PerspectiveCamera>} [en] child cameras of this scene. [ja] このシーンの子供のCamera要素
   */
  get cameras() {
    return this._cameras;
  }

}