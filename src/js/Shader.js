import GLContext from './GLContext'

export default class Shader {
  constructor(canvas) {
    if (typeof canvas === 'string') {
      var canvas = window.document.querySelector(canvas);
    }

    this._gl = GLContext.getInstance(canvas).gl;

  }

  static initMixinMethodArray() {
    this.prototype._classNamesOfVSDefine = this.prototype._classNamesOfVSDefine ? this.prototype._classNamesOfVSDefine : [];
    this.prototype._classNamesOfVSTransform = this.prototype._classNamesOfVSTransform ? this.prototype._classNamesOfVSTransform : [];
    this.prototype._classNamesOfVSShade = this.prototype._classNamesOfVSShade ? this.prototype._classNamesOfVSShade : [];

    this.prototype._classNamesOfFSDefine = this.prototype._classNamesOfFSDefine ? this.prototype._classNamesOfFSDefine : [];
    this.prototype._classNamesOfFSShade = this.prototype._classNamesOfFSShade ? this.prototype._classNamesOfFSShade : [];

    this.prototype._classNamesOfPrepare = this.prototype._classNamesOfPrepare ? this.prototype._classNamesOfPrepare : [];
  }

  static mixin(source) {

    // create mixin method Array
    this.initMixinMethodArray();

    // register mixin methods to Array
    if(this.prototype._classNamesOfVSDefine.indexOf(source.name) === -1){
      this.prototype._classNamesOfVSDefine.push(source.name);
    }
    if(this.prototype._classNamesOfVSTransform.indexOf(source.name) === -1){
      this.prototype._classNamesOfVSTransform.push(source.name);
    }
    if(this.prototype._classNamesOfVSShade.indexOf(source.name) === -1){
      this.prototype._classNamesOfVSShade.push(source.name);
    }
    if(this.prototype._classNamesOfFSDefine.indexOf(source.name) === -1){
      this.prototype._classNamesOfFSDefine.push(source.name);
    }
    if(this.prototype._classNamesOfFSShade.indexOf(source.name) === -1){
      this.prototype._classNamesOfFSShade.push(source.name);
    }
    if(this.prototype._classNamesOfPrepare.indexOf(source.name) === -1){
      this.prototype._classNamesOfPrepare.push(source.name);
    }

    // mixin
    var target = this.prototype; source = source.prototype;
    Object.getOwnPropertyNames(source).forEach(function (name) {
      if (name !== "constructor") Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(source, name));
    });
  }

  static swapMixin(current, newone) {
    // register mixin methods to Array
    let matchIdx = this.prototype._classNamesOfVSDefine.indexOf(current.name);
    if(matchIdx !== -1){
      this.prototype._classNamesOfVSDefine[matchIdx] = newone.name;
    }
    matchIdx = this.prototype._classNamesOfVSTransform.indexOf(current.name);
    if(matchIdx !== -1){
      this.prototype._classNamesOfVSTransform[matchIdx] = newone.name;
    }
    matchIdx = this.prototype._classNamesOfVSShade.indexOf(current.name);
    if(matchIdx !== -1){
      this.prototype._classNamesOfVSShade[matchIdx] = newone.name;
    }
    matchIdx = this.prototype._classNamesOfFSDefine.indexOf(current.name);
    if(matchIdx !== -1){
      this.prototype._classNamesOfFSDefine[matchIdx] = newone.name;
    }
    matchIdx = this.prototype._classNamesOfFSShade.indexOf(current.name);
    if(matchIdx !== -1){
      this.prototype._classNamesOfFSShade[matchIdx] = newone.name;
    }
    matchIdx = this.prototype._classNamesOfPrepare.indexOf(current.name);
    if(matchIdx !== -1){
      this.prototype._classNamesOfPrepare[matchIdx] = newone.name;
    }

    // mixin
    var target = this.prototype; newone = newone.prototype;
    Object.getOwnPropertyNames(newone).forEach(function (name) {
      if (name !== "constructor") Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(newone, name));
    });
  }

  static removeMixin(source) {
    let matchIdx = this.prototype._classNamesOfVSDefine.indexOf(source.name);
    if(matchIdx !== -1){
      this.prototype._classNamesOfVSDefine.splice(matchIdx, 1);
    }
    matchIdx = this.prototype._classNamesOfVSTransform.indexOf(source.name);
    if(matchIdx !== -1){
      this.prototype._classNamesOfVSTransform.splice(matchIdx, 1);
    }
    matchIdx = this.prototype._classNamesOfVSShade.indexOf(source.name);
    if(matchIdx !== -1){
      this.prototype._classNamesOfVSShade.splice(matchIdx, 1);
    }
    matchIdx = this.prototype._classNamesOfFSDefine.indexOf(source.name);
    if(matchIdx !== -1){
      this.prototype._classNamesOfFSDefine.splice(matchIdx, 1);
    }
    matchIdx = this.prototype._classNamesOfFSShade.indexOf(source.name);
    if(matchIdx !== -1){
      this.prototype._classNamesOfFSShade.splice(matchIdx, 1);
    }
    matchIdx = this.prototype._classNamesOfPrepare.indexOf(source.name);
    if(matchIdx !== -1){
      this.prototype._classNamesOfPrepare.splice(matchIdx, 1);
    }
  }

  _getVertexShaderString(gl, functions, existCamera_f) {
    var f = functions;
    var shaderText = '';

    var in_ = Shader._in_onVert(gl);
    var out_ = Shader._out_onVert(gl);

    shaderText +=   Shader._glslVer(gl);
    shaderText +=   'precision mediump float;\n';


    var foundExclusive = false;

    /// define variables
    // start defining variables. first, BasicShader, then, sub class Shader, ...
    shaderText += this.VSDefine(in_, out_, f);
    // and define variables as mixin shaders
    this._classNamesOfVSDefine.forEach((className)=> {
      var method = this['VSDefine_' + className];
      if (method) {
        shaderText += method.bind(this, in_, out_, f)();
      }
    });


    // Uniform projectionAndViewMatrix
    if (existCamera_f) {
      shaderText += 'uniform mat4 projectionAndViewMatrix;\n';
    }

    // begin of main function
    shaderText +=   'void main(void) {\n';


    /// Transform
    // start transforming. first, BasicShader, then, sub class Shader, ...
    shaderText += this.VSTransform(existCamera_f, f);
    // and transform as mixin Shaders
    this._classNamesOfVSTransform.forEach((className)=> {
      var method = this['VSTransform_' + className];
      if (method) {
        shaderText += method.bind(this, existCamera_f, f)();
      }
    });

    /// Shading
    // start shading. first, BasicShader, then, sub class Shader, ...
    shaderText += this.VSShading(f);
    // and shade as mixin Shaders
    this._classNamesOfVSShade.forEach((className)=> {
      var method = this['VSShade_' + className];
      if (method) {
        shaderText += method.bind(this, existCamera_f, f)();
      }
    });


    // end of main function

    shaderText +=   '}\n';

    return shaderText;
  }


  _getFragmentShaderString(gl, functions) {
    var f = functions;
    var shaderText = '';

    var in_ = Shader._in_onFrag(gl);

    shaderText +=   Shader._glslVer(gl);
    shaderText +=   'precision mediump float;\n';
    shaderText +=   Shader._set_outColor_onFrag(gl);


    var foundExclusive = false;

    /// define variables
    // start defining variables. first, BasicShader, then, sub class Shader, ...
    shaderText += this.FSDefine(in_, f);
    // and define variables as mixin shaders
    this._classNamesOfFSDefine.forEach((className)=> {
      var method = this['FSDefine_' + className];
      if (method) {
        shaderText += method.bind(this, in_, f)();
      }
    });


    // begin of main function
    shaderText +=   'void main(void) {\n';


    /// Shading
    // start shading. first, BasicShader, then, sub class Shader, ...
    shaderText += this.FSShading(f, gl);
    // and shade as mixin Shaders
    this._classNamesOfFSShade.forEach((className)=> {
      var method = this['FSShade_' + className];
      if (method) {
        shaderText += method.bind(this, f, gl)();
      }
    });

    // end of main function
    shaderText +=   Shader._set_glFragColor_inGLVer1(gl);
    shaderText +=   '}\n';

    return shaderText;
  }

  VSDefine(in_, out_, f) {
    var shaderText =   `${in_} vec3 aVertex_position;\n`;
    return shaderText;
  }
  VSTransform(existCamera_f, f) {
    var shaderText = '';
    if (existCamera_f) {
      shaderText +=   '  gl_Position = projectionAndViewMatrix * vec4(aVertex_position, 1.0);\n';
    } else {
      shaderText +=   '  gl_Position = vec4(aVertex_position, 1.0);\n';
    }
    return shaderText;
  }
  VSShading() {
    return '';
  }

  FSDefine(in_, f) {
    var shaderText =   `${in_} vec3 aVertex_position;\n`;
    return shaderText;
  }

  FSShading(f, gl) {
    var shaderText =   `rt1 = vec4(1.0, 0.0, 0.0, 1.0);\n`;
    return shaderText;
  }


  _prepareAssetsForShaders(gl, shaderProgram, vertexAttribs, existCamera_f, pointLight) {
    var vertexAttribsAsResult = [];
    var position = this.prepare(gl, shaderProgram, vertexAttribs, existCamera_f, pointLight);
    vertexAttribsAsResult.push(position);
    // and shade as mixin Prepare Functions
    this._classNamesOfPrepare.forEach((className)=> {
      var method = this['prepare_' + className];
      if (method) {
        var verAttirbs = method.bind(this, gl, shaderProgram, vertexAttribs, existCamera_f, pointLight)();
        vertexAttribsAsResult = vertexAttribsAsResult.concat(verAttirbs);
      }
    });

    return vertexAttribsAsResult;
  }

  prepare(gl, shaderProgram, vertexAttribs, existCamera_f) {
    shaderProgram['vertexAttribute_position'] = gl.getAttribLocation(shaderProgram, 'aVertex_position');
    gl.enableVertexAttribArray(shaderProgram['vertexAttribute_position']);

    if (existCamera_f) {
      shaderProgram.projectionAndViewMatrix = gl.getUniformLocation(shaderProgram, 'projectionAndViewMatrix');
    }

    return 'position';
  }

  _getShader(gl, theSource, type) {
    var shader;

    if (type == "x-shader/x-fragment") {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "x-shader/x-vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      // Unknown shader type
      return null;
    }

    gl.shaderSource(shader, theSource);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  _initShaders(gl, vertexShaderStr, fragmentShaderStr) {
    console.log("Vertex Shader:");
    console.log(vertexShaderStr);
    console.log("Fragment Shader:");
    console.log(fragmentShaderStr);

    var vertexShader = this._getShader(gl, vertexShaderStr, 'x-shader/x-vertex');
    var fragmentShader = this._getShader(gl, fragmentShaderStr, 'x-shader/x-fragment');

    // Create the shader program
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Unable to initialize the shader program.");
    }

    gl.useProgram(shaderProgram);

    return shaderProgram;
  }

  getShaderProgram(vertexAttribs, existCamera_f, pointLight) {
    var gl = this._gl;
    var shaderProgram = this._initShaders(gl,
      this._getVertexShaderString(gl, vertexAttribs, existCamera_f),
      this._getFragmentShaderString(gl, vertexAttribs)
    );

    shaderProgram.optimizedVertexAttribs = this._prepareAssetsForShaders(gl, shaderProgram, vertexAttribs, existCamera_f, pointLight);

    return shaderProgram;
  }


  static _exist(functions, attribute) {
    return functions.indexOf(attribute) >= 0
  }

  static isThisGLVersion_2(gl) {
    if (typeof WebGL2RenderingContext === "undefined") {
      return false;
    }
    return gl instanceof WebGL2RenderingContext;
  }

  static _glslVer(gl) {
    return GLBoost.isThisGLVersion_2(gl) ? '#version 300 es\n' : '';
  }

  static _in_onVert(gl) {
    return GLBoost.isThisGLVersion_2(gl) ? 'in' : 'attribute';
  }
  static _out_onVert(gl) {
    return GLBoost.isThisGLVersion_2(gl) ? 'out' : 'varying';
  }
  static _in_onFrag(gl) {
    return GLBoost.isThisGLVersion_2(gl) ? 'in' : 'varying';
  }

  static _texture_func(gl) {
    return GLBoost.isThisGLVersion_2(gl) ? 'texture' : 'texture2D';
  }

  static _set_outColor_onFrag(gl) {
    return GLBoost.isThisGLVersion_2(gl) ? 'layout(location = 0) out vec4 rt1;' : 'vec4 rt1;';
  }

  static _set_glFragColor_inGLVer1(gl) {
    return !GLBoost.isThisGLVersion_2(gl) ? '  gl_FragColor = rt1;\n' : '';
  }
}

Shader._instances = new Object();
