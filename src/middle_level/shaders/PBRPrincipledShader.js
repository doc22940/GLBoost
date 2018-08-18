import Shader from '../../low_level/shaders/Shader';
import DecalShader from './DecalShader';
import Vector4 from '../../low_level/math/Vector4';

export class PBRPrincipledShaderSource {

  FSDefine_PBRPrincipledShaderSource(in_, f, lights) {
    
    var sampler2D = this._sampler2DShadow_func();
    var shaderText = '';
    shaderText += 'uniform vec4 Kd;\n';
    shaderText += 'uniform vec4 ambient;\n'; // Ka * amount of ambient lights

    let lightNumExceptAmbient = lights.filter((light)=>{return !light.isTypeAmbient();}).length;
    if (lightNumExceptAmbient > 0) {
      shaderText += `uniform highp ${sampler2D} uDepthTexture[${lightNumExceptAmbient}];\n`;
      shaderText += `uniform int isShadowCasting[${lightNumExceptAmbient}];\n`;
    }

    return shaderText;
  }

  VSMethodDefine_PBRPrincipledShaderSource(f, lights, material, extraData) {
    let shaderText = '';

    shaderText += `
      const float M_PI = 3.141592653589793;
    `;

    shaderText += `
    float angular_n_h(float NH) {
      return acos(NH);
    }
    `;

    shaderText += `
    float sqr(float x) {
      return x*x;
    }
    `;


    shaderText += `
    float d_phong(float NH, float c1) {
      return pow(
        cos(acos(NH))
        , c1
      );
    }
    `;

    shaderText += `
    // GGX NDF
    float d_ggx(float NH, float alphaRoughness) {
      float roughnessSqr = alphaRoughness * alphaRoughness;
      float f = (roughnessSqr - 1) * NH * NH + 1.0;
      return roughnessSq / (M_PI * f * f);
    }
    `;

    shaderText += `
    float d_torrance_reiz(float NH, float c3) {
      float CosSquared = NH*NH;
      float TanSquared = (1.0 - CosSquared)/CosSquared;
      //return (1.0/PI) * sqr(c3/(CosSquared * (c3*c3 + TanSquared)));  // gamma = 2, aka GGX
      return (1.0/sqrt(PI)) * (sqr(c3)/(CosSquared * (c3*c3 + TanSquared))); // gamma = 1, D_Berry
    }
    `;

    shaderText += `
    float d_beckmann(float NH, float m) {
      float co = 1.0 / (4.0 * m * m * NH * NH * NH * NH);
      float expx = exp((NH * NH - 1.0) / (m * m * NH * NH));
      return co * expx; 
    }
    `;

    shaderText += `
    float g_shielding(float NH, float NV, float NL, float VH) {
      float g1 = 2.0 * NH * NV / VH;
      float g2 = 2.0 * NH * NL / VH;
      return max(0.0, min(1.0, min(g1, g2)));
    }
    `;

    shaderText += `
    float fresnel(float n, float VH) {
      float c = VH;
      float g = sqrt(n * n + c * c - 1.0);
      float f = ((g - c)*(g - c))/((g + c)*(g + c)) * (1.0 + 
      ((c * (g + c) - 1.0)*(c * (g + c) - 1.0))
      /
      ((c * (g - c) - 1.0)*(c * (g - c) - 1.0))
      );
      return f;
    }
    `;

    shaderText += `
    float cook_torrance_specular_brdf(float n, float NH, float NV, float NL, float VH, float power) {    
      float D = d_torrance_reiz(NH, power);
      float G = g_shielding(NH, NV, NL, VH);
      float F = fresnel(n, VH);
      return D*G*F/(4*NL*NV);
    }
    `;

    return shaderText;
  }

  FSShade_PBRPrincipledShaderSource(f, gl, lights) {
    var shaderText = '';

    shaderText += '  vec4 surfaceColor = rt0;\n';
    shaderText += '  rt0 = vec4(0.0, 0.0, 0.0, 0.0);\n';
    
    for (let i=0; i<lights.length; i++) {
      let light = lights[i];
      let isShadowEnabledAsTexture = (light.camera && light.camera.texture) ? true:false;
      shaderText += `  {\n`;
      shaderText +=      Shader._generateLightStr(i);
      shaderText +=      Shader._generateShadowingStr(gl, i, isShadowEnabledAsTexture);
      shaderText += `    float diffuse = max(dot(lightDirection, normal), 0.0);\n`;
      shaderText += `    rt0 += spotEffect * vec4(visibility, visibility, visibility, 1.0) * Kd * lightDiffuse[${i}] * vec4(diffuse, diffuse, diffuse, 1.0) * surfaceColor;\n`;
      shaderText += `  }\n`;
    }
    shaderText += '  rt0.xyz += ambient.xyz;\n';
    
    //shaderText += '  rt0.a = 1.0;\n';
    // shaderText += '  rt0 = surfaceColor;\n';
//    shaderText += '  rt0 = vec4(v_shadowCoord[0].xy, 0.0, 1.0);\n';



    return shaderText;
  }

  prepare_PBRPrincipledShaderSource(gl, shaderProgram, expression, vertexAttribs, existCamera_f, lights, material, extraData) {

    var vertexAttribsAsResult = [];

    material.setUniform(shaderProgram, 'uniform_Kd', this._glContext.getUniformLocation(shaderProgram, 'Kd'));
    material.setUniform(shaderProgram, 'uniform_ambient', this._glContext.getUniformLocation(shaderProgram, 'ambient'));
    
    return vertexAttribsAsResult;
  }
}


export default class PBRPrincipledShader extends DecalShader {
  constructor(glBoostContext, basicShader) {

    super(glBoostContext, basicShader);
    LambertShader.mixin(LambertShaderSource);
  }

  setUniforms(gl, glslProgram, scene, material, camera, mesh, lights) {
    super.setUniforms(gl, glslProgram, scene, material, camera, mesh, lights);

  }

}

GLBoost['PBRPrincipledShader'] = PBRPrincipledShader;