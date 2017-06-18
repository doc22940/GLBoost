import GLExtensionsManager from '../low_level/core/GLExtensionsManager';
import Geometry from '../low_level/geometries/Geometry';
import GLBoostObject from '../low_level/core/GLBoostObject';

/**
 * en: This class take a role as operator of rendering process. In order to render images to canvas, this Renderer class gathers other elements' data, decides a plan of drawing process, and then just execute it.<br>
 * ja: このクラスはレンダリングプロセスの制御を司ります。Canvasにイメージをレンダリングするために、このRendererクラスは他の要素のデータを集め、描画プロセスの計画を決定し、実行します。
 */
export default class Renderer extends GLBoostObject {
  constructor(glBoostContext, parameters) {
    super(glBoostContext);
    var _clearColor = parameters.clearColor;

    var gl = this._glContext.gl;

    this._glBoostContext.reflectGlobalGLState();

    gl.clearColor( _clearColor.red, _clearColor.green, _clearColor.blue, _clearColor.alpha );
  }

  /**
   * en: draw elements of the scene.<br>
   * ja: sceneが持つオブジェクトを描画します
   * @param {Scene} scene a instance of Scene class
   */
  draw(expression) {
    expression.renderPasses.forEach((renderPass, index)=>{
      if (!renderPass.isEnableToDraw || !renderPass.scene) {
        return;
      }

      var camera = false;
      renderPass.scene.cameras.forEach((elm)=> {
        if (elm.isMainCamera(renderPass.scene)) {
          camera = elm;
        }
      });

      var glContext = this._glContext;
      var gl = glContext.gl;
      var glem = GLExtensionsManager.getInstance(this._glContext);

      let lights = renderPass.scene.lights;

      // set render target buffers for each RenderPass.
      if (renderPass.fbo && renderPass.isRenderTargetTexturesIfSet) {
        gl.bindTexture(gl.TEXTURE_2D, null);
        Geometry.clearMaterialCache();
        gl.bindFramebuffer(gl.FRAMEBUFFER, renderPass.fbo);
      } else {
        glem.drawBuffers(gl, [gl.BACK]);
      }

      if (renderPass.viewport) {
        gl.viewport(renderPass.viewport.x, renderPass.viewport.y, renderPass.viewport.z, renderPass.viewport.w)
      } else {
        if (camera) {
          let deltaWidth = glContext.canvasHeight*camera.aspect - glContext.canvasWidth;
          gl.viewport(-deltaWidth/2, 0, glContext.canvasHeight*camera.aspect, glContext.canvasHeight);
        } else {
          gl.viewport(0, 0, glContext.canvasWidth, glContext.canvasHeight);
        }
      }

      this._clearBuffer(gl, renderPass);

      // draw opacity meshes.
      var opacityMeshes = renderPass.opacityMeshes;
      opacityMeshes.forEach((mesh)=> {
        if (mesh.isVisible) {
          mesh.draw(expression, lights, camera, renderPass.scene, index);
        }
      });

      if (camera) {
        renderPass.sortTransparentMeshes(camera);
      }
      // draw transparent meshes.
      var transparentMeshes = renderPass.transparentMeshes;
      transparentMeshes.forEach((mesh)=> {
        if (mesh.isVisible) {
          mesh.draw(expression, lights, camera, renderPass.scene, index);
        }
      });

      let gizmos = renderPass.gizmos;
      for (let gizmo of gizmos) {
        if (gizmo.isVisible) {
          gizmo.draw(expression, lights, camera, renderPass.scene, index);
        }
      }


      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
//      glem.drawBuffers(gl, [gl.BACK]);

    });
  }

  _clearBuffer(gl, renderPass) {
    var clearColor = renderPass.clearColor;
    var clearDepth = renderPass.clearDepth;
    if (clearColor) {
      gl.clearColor(clearColor.x, clearColor.y, clearColor.z, clearColor.w);
    }
    if (clearDepth) {
      gl.clearDepth(clearDepth);
    }
    if (clearColor || clearDepth) {
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    } else if (clearColor) {
      gl.clear( gl.COLOR_BUFFER_BIT );
    } else {
      gl.clear( gl.DEPTH_BUFFER_BIT );
    }
  }

  /**
   * en: clear color/depth/stencil of canvas.<br>
   * ja: canvasのカラー、デプス、ステンシルのいずれか又は全てをクリアします。
   * @param {boolean} color_flg true: clear color, false: don't clear color
   * @param {boolean} depth_flg true: clear depth, false: don't clear depth
   * @param {boolean} stencil_flg  true: clear stencil, false: don't clear stencil
   */
  clearCanvas( color_flg, depth_flg, stencil_flg ) {

    var gl = this._glContext.gl;

    var bufferBits = 0;

    if ( color_flg === void 0 || color_flg ) bufferBits |= gl.COLOR_BUFFER_BIT;
    if ( depth_flg === void 0 || depth_flg ) bufferBits |= gl.DEPTH_BUFFER_BIT;
    if ( stencil_flg === void 0 || stencil_flg ) bufferBits |= gl.STENCIL_BUFFER_BIT;

    gl.clear( bufferBits );

  }

  /**
   * en: Get WebGL context.<br>
   * ja: WebGLコンテキストを取得します。
   * @returns {webglcontext} a context of WebGL
   */
  get glContext() {
    return this._glContext.gl;
  }


  /**
   * en: resize canvas and viewport.<br>
   * ja: canvasとビューポートをリサイズします。
   * @param {number} width en: width to resize, ja: リサイズする幅
   * @param {number} height en: height to resize, ja:リサイズする高さ
   */
  resize(width, height) {
    this._glContext.canvasWidth = width;
    this._glContext.canvasHeight = height;
  }

}
