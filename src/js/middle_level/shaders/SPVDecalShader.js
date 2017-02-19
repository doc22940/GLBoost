import Shader from '../../low_level/shaders/Shader';
import VertexWorldShaderSource from './VertexWorldShader';
import VertexWorldShadowShaderSource from './VertexWorldShadowShader';
import {FragmentSimpleShaderSource} from './FragmentSimpleShader';

export class SPVDecalShaderSource {
  VSDefine_SPVDecalShaderSource(in_, out_, f) {
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

  VSTransform_SPVDecalShaderSource(existCamera_f, f) {
    var shaderText = '';
    if (Shader._exist(f, GLBoost.COLOR)) {
      shaderText += '  color = aVertex_color;\n';
    }
    if (Shader._exist(f, GLBoost.TEXCOORD)) {
      shaderText += '  texcoord = aVertex_texcoord;\n';
    }
    return shaderText;
  }

  FSDefine_SPVDecalShaderSource(in_, f, lights, material, extraData) {
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

  FSShade_SPVDecalShaderSource(f, gl, lights, material, extraData) {
    var shaderText = '';
    var textureFunc = Shader._texture_func(gl);
    if (Shader._exist(f, GLBoost.COLOR)) {
      shaderText += '  rt0 *= color;\n';
    }
    shaderText += '    rt0 *= materialBaseColor;\n';
    if (Shader._exist(f, GLBoost.TEXCOORD) && material.hasAnyTextures()) {
      shaderText += `  rt0 *= ${textureFunc}(uTexture, texcoord);\n`;
    }
    //shaderText += '    float shadowRatio = 0.0;\n';

    //shaderText += '    rt0 = vec4(1.0, 0.0, 0.0, 1.0);\n';
    return shaderText;
  }

  prepare_SPVDecalShaderSource(gl, shaderProgram, expression, vertexAttribs, existCamera_f, lights, material, extraData) {

    var vertexAttribsAsResult = [];
    vertexAttribs.forEach((attribName)=>{
      if (attribName === GLBoost.COLOR || attribName === GLBoost.TEXCOORD) {
        shaderProgram['vertexAttribute_' + attribName] = gl.getAttribLocation(shaderProgram, 'aVertex_' + attribName);
        gl.enableVertexAttribArray(shaderProgram['vertexAttribute_' + attribName]);
        vertexAttribsAsResult.push(attribName);
      }
    });

    material.setUniform(expression.toString(), 'uniform_materialBaseColor', gl.getUniformLocation(shaderProgram, 'materialBaseColor'));

    if (Shader._exist(vertexAttribs, GLBoost.TEXCOORD)) {
      if (material.getOneTexture()) {
        material.uniformTextureSamplerDic['uTexture'] = {};
        let uTexture = gl.getUniformLocation(shaderProgram, 'uTexture');
        material.setUniform(expression.toString(), 'uTexture', uTexture);
        material.uniformTextureSamplerDic['uTexture'].textureUnitIndex = 0;

        material.uniformTextureSamplerDic['uTexture'].textureName = material.getOneTexture().userFlavorName;

        // set texture unit 0 to the sampler
        gl.uniform1i( uTexture, 0);
        material._semanticsDic['TEXTURE'] = 'uTexture';
      }
    }

    return vertexAttribsAsResult;
  }
}

export default class SPVDecalShader extends Shader {
  constructor(glBoostContext, basicShader = VertexWorldShaderSource) {

    super(glBoostContext);

    SPVDecalShader.mixin(basicShader);
    if (basicShader === VertexWorldShaderSource) {
      SPVDecalShader.mixin(VertexWorldShadowShaderSource);
    }
    SPVDecalShader.mixin(FragmentSimpleShaderSource);
    SPVDecalShader.mixin(SPVDecalShaderSource);
  }

  setUniforms(gl, glslProgram, expression, material) {

    let baseColor = material.baseColor;
    gl.uniform4f(material.getUniform(expression.toString(), 'uniform_materialBaseColor'), baseColor.x, baseColor.y, baseColor.z, baseColor.w);
  }
}

GLBoost['SPVDecalShader'] = SPVDecalShader;
