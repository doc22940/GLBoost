let singleton = Symbol();
let singletonEnforcer = Symbol();

/**
 * This is a loader glTF SPV extension data. You can see more detail of glTF format at https://github.com/KhronosGroup/glTF .
 */
export default class SPVGLTFLoaderExtension {

  /**
   * The constructor of GLTFLoader class. But you cannot use this constructor directly because of this class is a singleton class. Use getInstance() static method.
   * @param {Symbol} enforcer a Symbol to forbid calling this constructor directly
   */
  constructor(enforcer) {
    if (enforcer !== singletonEnforcer) {
      throw new Error("This is a Singleton class. get the instance using 'getInstance' static method.");
    }
  }

  /**
   * The static method to get singleton instance of this class.
   * @return {SPVGLTFLoaderExtension} the singleton instance of GLTFLoader class
   */
  static getInstance() {
    if (!this[singleton]) {
      this[singleton] = new SPVGLTFLoaderExtension(singletonEnforcer);
    }
    return this[singleton];
  }

  setAssetPropertiesToRootGroup(routeGroup, asset) {
    // Animation FPS
    if (asset && asset.animationFps) {
      rootGroup.animationFps = asset.animationFps;
    }
  }
}
