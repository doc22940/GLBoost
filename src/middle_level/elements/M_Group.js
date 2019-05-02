/* @flow */

import GLBoost from "../../globals";
import M_Element from "./M_Element";
import AABB from "../../low_level/math/AABB";
import Vector3 from "../../low_level/math/Vector3";
import L_AbstractMaterial from "../../low_level/materials/L_AbstractMaterial";
import M_Mesh from "./meshes/M_Mesh";
import M_AABBGizmo from "../elements/gizmos/M_AABBGizmo";
import GLBoostObject from "../../low_level/core/GLBoostObject";
import Logger from "../../low_level/misc/Logger";

type QueryMeta = { type: number, format: number };

export default class M_Group extends M_Element {
  _elements: Array<any>;
  _isVisible: boolean;
  _AABB: Object;
  _isRootJointGroup: boolean;
  _glBoostSystem: glBoostSystem;
  _gizmos: Object;

  constructor(glBoostContext: glBoostContext) {
    super(glBoostContext);
    this._elements = [];
    this._AABB = new AABB();
    this._isRootJointGroup = false;

    this._logger = Logger.getInstance();

    //    this._aabbGizmo = null;
    //    this._aabbGizmo = new M_AABBGizmo(this._glBoostContext);
    //    this._gizmos.push(this._aabbGizmo);
  }

  /**
   * Add the element to this group as a child.
   * @param element - a instance of Element class
   * @param isDuplicateOk - allow duplicating if need
   */
  addChild(element: Element, isDuplicateOk: boolean = false) {
    if (isDuplicateOk) {
      // if forgive duplicated register by copy
      let elem = null;
      if (element._parent) {
        elem = element.clone();
      } else {
        elem = element;
      }
      elem._parent = this;
      this._elements.push(elem);
    } else {
      //// if forbit duplicated register
      this.removeChild(element);
      element._parent = this;
      this._elements.push(element);
    }
  }

  /**
   * remove the element from this group.
   * @param element the element to remove
   */
  removeChild(element: M_Element) {
    this._elements = this._elements.filter(function(elem) {
      if (elem === element) {
        element._parent = null;
      }
      return elem !== element;
    });
  }

  /**
   * remove all elements from this group.
   */
  removeAll() {
    this._elements = this._elements.filter(function(elem) {
      elem._parent = null;
    });
    this._elements.length = 0;
  }

  getChildren(): Array<M_Group> {
    return this._elements;
  }

  getAnyJointAsChild(): M_Joint | null {
    for (let element of this._elements) {
      if (element.className === "M_Joint") {
        return element;
      }
    }
    return null;
  }

  _setDirtyToAnimatedElement(inputName: string): void {
    if (this.hasAnimation(inputName)) {
      this._needUpdate();
    }

    let children = this.getChildren();
    if (children) {
      for (let i = 0; i < children.length; i++) {
        if (children[i]._setDirtyToAnimatedElement != null) {
          children[i]._setDirtyToAnimatedElement(inputName);
        }
      }
    }
  }

  _validateByQuery(object: GLBoostObject, query: string, queryMeta: QueryMeta) {
    let propertyName = "";
    if (queryMeta.type === GLBoost.QUERY_TYPE_INSTANCE_NAME) {
      propertyName = "instanceName";
    } else if (queryMeta.type === GLBoost.QUERY_TYPE_USER_FLAVOR_NAME) {
      propertyName = "userFlavorName";
    } else if (
      queryMeta.type === GLBoost.QUERY_TYPE_INSTANCE_NAME_WITH_USER_FLAVOR
    ) {
      propertyName = "instanceNameWithUserFlavor";
    }

    if (queryMeta.format === GLBoost.QUERY_FORMAT_STRING_PERFECT_MATCHING) {
      if (object[propertyName] === query) {
        return object;
      }
    } else if (
      queryMeta.format === GLBoost.QUERY_FORMAT_STRING_PARTIAL_MATCHING
    ) {
      if (object[propertyName].indexOf(query) !== -1) {
        return object;
      }
    } else if (queryMeta.format === GLBoost.QUERY_FORMAT_REGEXP) {
      if (object[propertyName].match(query)) {
        return object;
      }
    }
  }

  searchElement(
    query: string,
    queryMeta: QueryMeta = {
      type: GLBoost.QUERY_TYPE_USER_FLAVOR_NAME,
      format: GLBoost.QUERY_FORMAT_STRING_PARTIAL_MATCHING
    },
    element: M_Group = this
  ) {
    /*
    if (element.userFlavorName === userFlavorNameOrRegExp || element.userFlavorName.match(userFlavorNameOrRegExp)) {
      return element;
    }*/

    if (this._validateByQuery(element, query, queryMeta)) {
      return element;
    }

    if (element instanceof M_Group) {
      let children = element.getChildren();
      for (let i = 0; i < children.length; i++) {
        let hitChild = this.searchElement(query, queryMeta, children[i]);
        if (hitChild) {
          return hitChild;
        }
      }
    }
    return null;
  }

  searchElementByNameAndType(
    query: string,
    type: GLBoostObject,
    queryMeta: QueryMeta = {
      type: GLBoost.QUERY_TYPE_USER_FLAVOR_NAME,
      format: GLBoost.QUERY_FORMAT_STRING_PARTIAL_MATCHING
    },
    element: M_Group = this
  ) {
    if (
      this._validateByQuery(element, query, queryMeta) &&
      element instanceof type
    ) {
      return element;
    }

    if (element instanceof M_Group) {
      let children = element.getChildren();
      for (let i = 0; i < children.length; i++) {
        let hitChild = this.searchElementByNameAndType(
          query,
          type,
          queryMeta,
          children[i]
        );
        if (hitChild) {
          return hitChild;
        }
      }
    }
    return null;
  }

  searchElementsByNameAndType(
    query: string,
    type: GLBoostObject,
    queryMeta: QueryMeta = {
      type: GLBoost.QUERY_TYPE_USER_FLAVOR_NAME,
      format: GLBoost.QUERY_FORMAT_STRING_PARTIAL_MATCHING
    },
    element: M_Group = this
  ) {
    let resultElements = [];

    if (element instanceof M_Group) {
      let children = element.getChildren();
      for (let i = 0; i < children.length; i++) {
        let hitChildren = this.searchElementsByNameAndType(
          query,
          type,
          queryMeta,
          children[i]
        );
        if (hitChildren) {
          resultElements = resultElements.concat(hitChildren);
        }
      }
    }
    /*
    if ((element.userFlavorName === userFlavorNameOrRegExp || element.userFlavorName.match(userFlavorNameOrRegExp)) && element instanceof type) {
        resultElements.push(element);
    }*/
    if (
      this._validateByQuery(element, query, queryMeta) &&
      element instanceof type
    ) {
      resultElements.push(element);
    }

    return resultElements;
  }

  searchElementsByType(type: any, element: M_Element = this) {
    if (type["name"].indexOf("Gizmo") !== -1 && element instanceof M_Element) {
      let gizmos = element._gizmos;
      for (let gizmo of gizmos) {
        if (gizmo instanceof type) {
          return gizmo;
        }
      }
    }

    if (element instanceof M_Group) {
      let children = element.getChildren();
      let results = [];
      for (let i = 0; i < children.length; i++) {
        let hitChildOrChildren = this.searchElementsByType(type, children[i]);
        if (Array.isArray(hitChildOrChildren)) {
          Array.prototype.push.apply(results, hitChildOrChildren); // concat
        } else if (hitChildOrChildren != null) {
          results.push(hitChildOrChildren);
        }
      }

      if (type === M_Group) {
        results.push(element);
      }
      return results;
    }

    if (element instanceof type) {
      return element;
    }

    return null;
  }

  searchGLBoostObjectByNameAndType(
    query: string,
    type: GLBoostObject,
    queryMeta: QueryMeta = {
      type: GLBoost.QUERY_TYPE_USER_FLAVOR_NAME,
      format: GLBoost.QUERY_FORMAT_STRING_PARTIAL_MATCHING
    },
    element: M_Group | M_Element | M_Mesh = this
  ) {
    if (element instanceof M_Group) {
      let children = element.getChildren();
      for (let i = 0; i < children.length; i++) {
        let hitChild = this.searchGLBoostObjectByNameAndType(
          query,
          type,
          queryMeta,
          children[i]
        );
        if (hitChild) {
          return hitChild;
        }
      }
    }

    if (type.name.indexOf("Gizmo") !== -1 && element instanceof M_Element) {
      let gizmos = element._gizmos;
      for (let gizmo of gizmos) {
        if (this._validateByQuery(gizmo, query, queryMeta)) {
          return gizmo;
        }
      }
    }

    if (type.name.indexOf("Material") !== -1 && element instanceof M_Mesh) {
      let materials = element.getAppropriateMaterials();
      for (let material of materials) {
        if (material instanceof type) {
          if (this._validateByQuery(material, query, queryMeta)) {
            return material;
          }
        }
      }
      return null;
    }

    if (type.name.indexOf("Texture") !== -1 && element instanceof M_Mesh) {
      let materials = element.getAppropriateMaterials();
      for (let material of materials) {
        const textures = material.getTextures();
        for (let texture of textures) {
          if (texture instanceof type) {
            if (this._validateByQuery(texture, query, queryMeta)) {
              return texture;
            }
          }
        }
      }
      return null;
    }

    if (
      this._validateByQuery(element, query, queryMeta) &&
      element instanceof type
    ) {
      return element;
    }

    return null;
  }

  searchGLBoostObjectsByNameAndType(
    query: any,
    type: GLBoostObject,
    queryMeta: QueryMeta = {
      type: GLBoost.QUERY_TYPE_USER_FLAVOR_NAME,
      format: GLBoost.QUERY_FORMAT_STRING_PARTIAL_MATCHING
    },
    element: M_Group = this
  ) {
    let objects = [];
    if (element instanceof M_Group) {
      let children = element.getChildren();
      for (let i = 0; i < children.length; i++) {
        let hitChildren = this.searchGLBoostObjectsByNameAndType(
          query,
          type,
          queryMeta,
          children[i]
        );
        if (hitChildren.length > 0) {
          objects = objects.concat(hitChildren);
        }
      }
      return objects;
    }

    if (type.name.indexOf("Gizmo") !== -1 && element instanceof M_Element) {
      let gizmos = element._gizmos;
      for (let gizmo of gizmos) {
        if (this._validateByQuery(gizmo, query, queryMeta)) {
          objects.push(gizmo);
        }
      }
      return objects;
    }

    if (type.name.indexOf("Material") !== -1 && element instanceof M_Mesh) {
      let materials = element.getAppropriateMaterials();
      for (let material of materials) {
        if (material instanceof type) {
          if (this._validateByQuery(material, query, queryMeta)) {
            objects.push(material);
          }
        }
      }
      return objects;
    }

    if (type.name.indexOf("Texture") !== -1 && element instanceof M_Mesh) {
      let materials = element.getAppropriateMaterials();
      for (let material of materials) {
        const textures = material.getTextures();
        for (let texture of textures) {
          if (texture instanceof type) {
            if (this._validateByQuery(texture, query, queryMeta)) {
              objects.push(texture);
            }
          }
        }
      }
      return objects;
    }

    if (
      this._validateByQuery(element, query, queryMeta) &&
      element instanceof type
    ) {
      return [element];
    }
    return objects;
  }

  searchGLBoostObjectsByType(type: GLBoostObject, element: M_Group = this) {
    let objects = [];
    if (element instanceof M_Group) {
      let children = element.getChildren();
      for (let i = 0; i < children.length; i++) {
        let hitChildren = this.searchGLBoostObjectsByType(type, children[i]);
        if (hitChildren.length > 0) {
          objects = objects.concat(hitChildren);
        }
      }
      return objects;
    }

    if (type.name.indexOf("Gizmo") !== -1 && element instanceof M_Element) {
      let gizmos = element._gizmos;
      for (let gizmo of gizmos) {
        objects.push(gizmo);
      }
      return objects;
    }

    if (type.name.indexOf("Material") !== -1 && element instanceof M_Mesh) {
      let materials = element.getAppropriateMaterials();
      for (let material of materials) {
        if (material instanceof type) {
          objects.push(material);
        }
      }
      return objects;
    }

    if (type.name.indexOf("Texture") !== -1 && element instanceof M_Mesh) {
      let materials = element.getAppropriateMaterials();
      for (let material of materials) {
        const textures = material.getTextures();
        for (let texture of textures) {
          if (texture instanceof type) {
            objects.push(texture);
          }
        }
      }
      return objects;
    }

    if (element instanceof type) {
      return [element];
    }
    return objects;
  }

  getStartAnimationInputValue(inputLineName: string, element: M_Group = this) {
    if (element instanceof M_Group) {
      let latestInputValue = element.getStartInputValueOfAnimation(
        inputLineName
      );
      let children = element.getChildren();
      for (let i = 0; i < children.length; i++) {
        let hitChildOrInputValue = this.getStartAnimationInputValue(
          inputLineName,
          children[i]
        );

        if (hitChildOrInputValue instanceof M_Element) {
          let startInputValueOfThisElement = hitChildOrInputValue.getStartInputValueOfAnimation(
            inputLineName
          );
          if (startInputValueOfThisElement < latestInputValue) {
            latestInputValue = startInputValueOfThisElement;
          }
        } else {
          let startInputValueOfThisElement = hitChildOrInputValue;
          if (startInputValueOfThisElement < latestInputValue) {
            latestInputValue = startInputValueOfThisElement;
          }
        }
      }

      return latestInputValue;
    }

    return element.getStartInputValueOfAnimation(inputLineName);
  }

  getEndAnimationInputValue(inputLineName: string, element: M_Group = this) {
    if (element instanceof M_Group) {
      let latestInputValue = element.getEndInputValueOfAnimation(inputLineName);
      let children = element.getChildren();
      for (let i = 0; i < children.length; i++) {
        let hitChildOrInputValue = this.getEndAnimationInputValue(
          inputLineName,
          children[i]
        );

        if (hitChildOrInputValue instanceof M_Element) {
          let endInputValueOfThisElement = hitChildOrInputValue.getEndInputValueOfAnimation(
            inputLineName
          );
          if (endInputValueOfThisElement > latestInputValue) {
            latestInputValue = endInputValueOfThisElement;
          }
        } else {
          let endInputValueOfThisElement = hitChildOrInputValue;
          if (endInputValueOfThisElement > latestInputValue) {
            latestInputValue = endInputValueOfThisElement;
          }
        }
      }
      return latestInputValue;
    } else if (!(element.getEndInputValueOfAnimation != null)) {
      return 0;
    }

    return element.getEndInputValueOfAnimation(inputLineName);
  }

  /*
   * Note that it's in world space
   */
  updateAABB() {
    const that = this;
    var aabb = (function mergeAABBRecursively(elem) {
      if (elem instanceof M_Group) {
        var children = elem.getChildren();
        for (let i = 0; i < children.length; i++) {
          var aabb = mergeAABBRecursively(children[i]);
          if (aabb instanceof AABB) {
            elem.AABB.mergeAABB(aabb);
          } else {
            console.assert("calculation of AABB error!");
          }
        }
        if (!elem.AABB.isValid()) {
          that._logger.out(
            GLBoost.LOG_LEVEL_WARN,
            GLBoost.LOG_TYPE_AABB,
            true,
            "This AABB has abnormal values",
            elem.userFlavorName,
            elem.AABB
          );
        }
        return elem.AABB;
        //return AABB.multiplyMatrix(elem.transformMatrix, elem.AABB);
      }
      if (elem instanceof M_Mesh) {
        let aabb = elem.AABBInWorld;
        //console.log(aabb.toString());
        return aabb;
      }

      return null;
    })(this);
    this.AABB.mergeAABB(aabb);

    let newAABB = this.AABB;

    //    this._AABB = aabbInWorld;

    this._updateAABBGizmo();

    return newAABB;
  }

  get AABB() {
    return this._AABB;
  }

  clone(
    clonedOriginalRootElement: any = this,
    clonedRootElement: any = null,
    onCompleteFuncs: any = []
  ) {
    let instance = new M_Group(this._glBoostSystem);
    if (clonedRootElement === null) {
      clonedRootElement = instance;
    }
    this._copy(instance);

    this._elements.forEach(element => {
      if (typeof element.clone !== "undefined") {
        instance._elements.push(
          element.clone(
            clonedOriginalRootElement,
            clonedRootElement,
            onCompleteFuncs
          )
        );
      } else {
        instance._elements.push(element);
      }
    });

    onCompleteFuncs.forEach(func => {
      func();
    });

    return instance;
  }

  _copy(instance) {
    super._copy(instance);
    instance._AABB = this._AABB.clone();
    instance._isRootJointGroup = this._isRootJointGroup;
  }

  set isVisible(flg: boolean) {
    let collectVisibility = function(elem: M_Element) {
      elem._isVisible = flg;
      if (elem instanceof M_Group) {
        let children = elem.getChildren();
        children.forEach(function(child) {
          collectVisibility(child);
        });
      }
    };
    collectVisibility(this);
  }

  get isVisible() {
    return this._isVisible;
  }

  setSpecifiedPropertyRecursively(propertyName: string, value: any) {
    let setValueRecursively = function(elem: M_Element) {
      elem[propertyName] = value;
      if (elem instanceof M_Group) {
        let children = elem.getChildren();
        children.forEach(function(child) {
          setValueRecursively(child);
        });
      }
    };
    setValueRecursively(this);
  }

  executeSpecifiedFunctionRecursively(
    func: Function,
    thisObj: any,
    args: Array<any>,
    childIndexToInsertToArgs = null
  ) {
    let execRecursively = function(elem: M_Element) {
      if (childIndexToInsertToArgs != null) {
        args[childIndexToInsertToArgs] = elem;
      }
      func.apply(thisObj, args);
      if (elem instanceof M_Group) {
        let children = elem.getChildren();
        children.forEach(function(child) {
          execRecursively(child);
        });
      }
    };
    execRecursively(this);
  }

  _updateAABBGizmo() {
    /*
    if (this._aabbGizmo === null) {
      this._aabbGizmo = new M_AABBGizmo(this._glBoostContext);
    }
    */
    let world_m = this.worldMatrix;
    let aabbInWorld = AABB.multiplyMatrix(world_m, this._AABB);

    //    this._aabbGizmo.updateGizmoDisplay(aabbInWorld.minPoint, aabbInWorld.maxPoint);
  }

  readyForDiscard() {
    let collectElements = function(elem) {
      if (elem instanceof M_Group) {
        const children = elem.getChildren();
        for (let i = 0; i < children.length; i++) {
          collectElements(children[i]);
        }
      } else if (elem instanceof M_Element) {
        // Must be M_Element
        elem.readyForDiscard();
      } else {
        if (
          typeof EffekseerElement !== undefined &&
          elem instanceof EffekseerElement
        ) {
          console.log("Nothing to do for discarding at this time.");
        }
        console.error("not M_Group nor M_Element");
      }
    };
    collectElements(this);

    this.removeAll();
  }

  rayCast(
    arg1: number,
    arg2: number,
    camera: any,
    viewport: any,
    ignoreInstanceNameList: Array<any>,
    dotThrethold: number = 0
  ) {
    const meshes = this.searchElementsByType(M_Mesh);
    let currentShortestT = Number.MAX_VALUE;
    let currentShortestIntersectedPosVec3 = null;
    let selectedMesh = null;
    for (let mesh of meshes) {
      if (!mesh.isVisible) {
        continue;
      }
      if (!mesh.isPickable) {
        continue;
      }
      if (
        ignoreInstanceNameList &&
        ignoreInstanceNameList.indexOf(mesh.instanceName) !== -1
      ) {
        continue;
      }
      let result = null;
      if (arg1 instanceof Vector3 && arg2 instanceof Vector3) {
        result = mesh.rayCast(arg1, arg2, camera, dotThrethold);
      } else {
        result = mesh.rayCast(arg1, arg2, camera, viewport, dotThrethold);
      }
      if (result === null) {
        return [null, null];
      }
      const t = result[1];
      if (t < currentShortestT) {
        currentShortestT = t;
        currentShortestIntersectedPosVec3 = result[0];
        selectedMesh = mesh;
      }
    }

    return [currentShortestIntersectedPosVec3, currentShortestT, selectedMesh];
  }

  _needUpdate() {
    super._needUpdate();

    let collectElements = function(elem) {
      if (elem instanceof M_Group) {
        const children = elem.getChildren();
        for (let i = 0; i < children.length; i++) {
          collectElements(children[i]);
        }
      } else if (elem instanceof M_Mesh) {
        if (elem._outlineGizmo) {
          elem._outlineGizmo.updateMatrix(elem);
        }
      }
    };
    collectElements(this);
  }
}

GLBoost["M_Group"] = M_Group;
