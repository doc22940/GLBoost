import GLBoost from '../../globals';
import Shader from '../../low_level/shaders/Shader';
import WireframeShader from './WireframeShader';

export class DecalShaderSource {
  VSDefine_DecalShaderSource(in_, out_, f) {
    var shaderText = '';
    if (Shader._exist(f, GLBoost.COLOR)) {
      shaderText += `${in_} vec4 aVertex_color;\n`;
      shaderText += `${out_} vec4 color;\n`;
    }
    if (Shader._exist(f, GLBoost.TEXCOORD)) {
      shaderText += `${in_} vec2 aVertex_texcoord;\n`;
      shaderText += `${out_} vec2 texcoord;\n`;
    }
    return shaderText;
  }

  VSTransform_DecalShaderSource(existCamera_f, f) {
    var shaderText = '';
    if (Shader._exist(f, GLBoost.COLOR)) {
      shaderText += '  color = aVertex_color;\n';
    }
    if (Shader._exist(f, GLBoost.TEXCOORD)) {
      shaderText += '  texcoord = aVertex_texcoord;\n';
    }
    return shaderText;
  }

  FSDefine_DecalShaderSource(in_, f, lights, material, extraData) {
    var shaderText = '';
    if (Shader._exist(f, GLBoost.COLOR)) {
      shaderText += `${in_} vec4 color;\n`;
    }
    if (Shader._exist(f, GLBoost.TEXCOORD)) {
      shaderText += `${in_} vec2 texcoord;\n\n`;
    }
    if (material.hasAnyTextures()) {
      shaderText += 'uniform sampler2D uTexture;\n';
    }
    shaderText += 'uniform vec4 materialBaseColor;\n';

    return shaderText;
  }

  FSShade_DecalShaderSource(f, gl, lights, material, extraData) {
    var shaderText = '';
    var textureFunc = Shader._texture_func(gl);
    if (Shader._exist(f, GLBoost.COLOR)) {
      shaderText += '  rt0 *= color;\n';
    }
    shaderText += '    rt0 *= materialBaseColor;\n';
    if (Shader._exist(f, GLBoost.TEXCOORD) && material.hasAnyTextures()) {
      shaderText += `  rt0 *= ${textureFunc}(uTexture, texcoord);\n`;
    }
    shaderText += '    if (rt0.a < 0.05) {\n';
    shaderText += '      discard;\n';
    shaderText += '    }\n';

    //shaderText += '    float shadowRatio = 0.0;\n';

    //shaderText += '    rt0 = vec4(1.0, 0.0, 0.0, 1.0);\n';

    return shaderText;
  }

  prepare_DecalShaderSource(gl, shaderProgram, expression, vertexAttribs, existCamera_f, lights, material, extraData) {

    var vertexAttribsAsResult = [];
    vertexAttribs.forEach((attribName)=>{
      if (attribName === GLBoost.COLOR || attribName === GLBoost.TEXCOORD) {
        shaderProgram['vertexAttribute_' + attribName] = gl.getAttribLocation(shaderProgram, 'aVertex_' + attribName);
        gl.enableVertexAttribArray(shaderProgram['vertexAttribute_' + attribName]);
        vertexAttribsAsResult.push(attribName);
      }
    });

    material.setUniform(shaderProgram.hashId, 'uniform_materialBaseColor', gl.getUniformLocation(shaderProgram, 'materialBaseColor'));

    if (Shader._exist(vertexAttribs, GLBoost.TEXCOORD)) {
      let diffuseTexture = material.getTextureFromPurpose(GLBoost.TEXTURE_PURPOSE_DIFFUSE);
      if (diffuseTexture) {
        material.uniformTextureSamplerDic['uTexture'] = {};
        let uTexture = gl.getUniformLocation(shaderProgram, 'uTexture');
        material.setUniform(shaderProgram.hashId, 'uTexture', uTexture);
        material.uniformTextureSamplerDic['uTexture'].textureUnitIndex = 0;

        material.uniformTextureSamplerDic['uTexture'].textureName = diffuseTexture.userFlavorName;

        // set texture unit 0 to the sampler
        gl.uniform1i( uTexture, 0);
        material._semanticsDic['TEXTURE'] = 'uTexture';
      }
    }

    return vertexAttribsAsResult;
  }
}

export default class DecalShader extends WireframeShader {
  constructor(glBoostContext) {

    super(glBoostContext);

    DecalShader.mixin(DecalShaderSource);

    this._lut = null;
  }

  setUniforms(gl, glslProgram, expression, material) {

    let baseColor = material.baseColor;
    gl.uniform4f(material.getUniform(glslProgram.hashId, 'uniform_materialBaseColor'), baseColor.x, baseColor.y, baseColor.z, baseColor.w);

    let diffuseTexture = material.getTextureFromPurpose(GLBoost.TEXTURE_PURPOSE_DIFFUSE);
    if (diffuseTexture) {
      material.uniformTextureSamplerDic['uTexture'].textureName = diffuseTexture.userFlavorName;
    }
  }

  set lut(lut) {
    this._lut = lut;
  }

  get lut() {
    return this._lut;
  }
}

GLBoost['DecalShader'] = DecalShader;
