/**
 */

var gl = null;
var root = null;
var fieldOfViewInRadians = convertDegreeToRadians(45);
var rotateLight, rotateLight2, rotateNode;
const camera = {
  rotation: {
    x: 0,
    y: 0
  }
};

//load the shader resources using a utility function
loadResources({
  vs: 'shader/phong.vs.glsl',
  fs: 'shader/phong.fs.glsl', //gouraud
  vs_single: 'shader/single.vs.glsl',
  fs_single: 'shader/single.fs.glsl',
  model: 'models/C-3PO.obj'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  render(0);
});

function init(resources) {
  //create a GL context
  gl = createContext();

  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);

  root = createSceneGraph(gl, resources);
  initInteraction(gl.canvas);
}

function createSceneGraph(gl, resources) {
  //create scenegraph
  const root = new ShaderSGNode(createProgram(gl, resources.vs, resources.fs));

  function createLightSphere() {
    return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [
      new RenderSGNode(makeSphere(.2,10,10))
    ]);
  }

  {
    //TASK 3-6 create white light node at [0, -2, 2]
    let light = new LightNode();
    light.ambient = [0, 0, 0, 1];
    light.diffuse = [1, 1, 1, 1];
    light.specular = [1, 1, 1, 1];
    light.position = [0, 2, 2];
    light.append(createLightSphere());
    //TASK 4-1 animated light using rotateLight transformation node
    rotateLight = new TransformationSGNode(mat4.create(), [
        light
    ]);
    root.append(rotateLight);
  }


  {
    //TASK 5-1 create red light node at [2, 0.2, 0]
    let light2 = new LightNode();
    light2.uniform = 'u_light2';
    light2.diffuse = [1, 0, 0, 1];
    light2.specular = [1, 0, 0, 1];
    light2.position = [2, 0.2, 0];
    light2.append(createLightSphere());
    rotateLight2 = new TransformationSGNode(mat4.create(), [
        light2
    ]);
    root.append(rotateLight2);
  }

  {
    //TASK 2-4 wrap with material node
    let c3po = new MaterialNode([
      new RenderSGNode(resources.model)
    ]);
    //gold
    c3po.ambient = [0.24725, 0.1995, 0.0745, 1];
    c3po.diffuse = [0.75164, 0.60648, 0.22648, 1];
    c3po.specular = [0.628281, 0.555802, 0.366065, 1];
    c3po.shininess = 0.4;

    rotateNode = new TransformationSGNode(mat4.create(), [
      new TransformationSGNode(glm.transform({ translate: [0,0, 0], rotateX : 0, scale: 0.8 }),  [
        c3po
      ])
    ]);
    root.append(rotateNode);
  }

  {
    //TASK 2-5 wrap with material node
    let floor = new MaterialNode([
      new RenderSGNode(makeRect())
    ]);

    //dark
    floor.ambient = [0, 0, 0, 1];
    floor.diffuse = [0.1, 0.1, 0.1, 1];
    floor.specular = [0.5, 0.5, 0.5, 1];

    root.append(new TransformationSGNode(glm.transform({ translate: [0,0,0], rotateX: 90, scale: 2}), [
      floor
    ]));
  }

  return root;
}

function initInteraction(canvas) {
  const mouse = {
    pos: { x : 0, y : 0},
    leftButtonDown: false
  };
  function toPos(event) {
    //convert to local coordinates
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
  canvas.addEventListener('mousedown', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = event.button === 0;
  });
  canvas.addEventListener('mousemove', function(event) {
    const pos = toPos(event);
    const delta = { x : mouse.pos.x - pos.x, y: mouse.pos.y - pos.y };
    //TASK 0-1 add delta mouse to camera.rotation if the left mouse button is pressed
    if (mouse.leftButtonDown) {
      //add the relative movement of the mouse to the rotation variables
  		camera.rotation.x += delta.x;
  		camera.rotation.y += delta.y;
    }
    mouse.pos = pos;
  });
  canvas.addEventListener('mouseup', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = false;
  });
  //register globally
  document.addEventListener('keypress', function(event) {
    //https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
    if (event.code === 'KeyR') {
      camera.rotation.x = 0;
  		camera.rotation.y = 0;
    }
  });
}


function render(timeInMilliseconds) {
  checkForWindowResize(gl);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  //set background color to light gray
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), fieldOfViewInRadians, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);

  //ReCap: what does this mean?
  context.viewMatrix = mat4.lookAt(mat4.create(), [0,3,-10], [0,0,0], [0,1,0]);

  //TASK 0-2 rotate whole scene according to the mouse rotation stored in
  //camera.rotation.x and camera.rotation.y
  context.sceneMatrix = mat4.multiply(mat4.create(),
                            glm.rotateY(camera.rotation.x),
                            glm.rotateX(camera.rotation.y));

  rotateNode.matrix = glm.rotateY(timeInMilliseconds*-0.01);

  //TASK 4-2 enable light rotation
  rotateLight.matrix = glm.rotateY(timeInMilliseconds*0.05);
  //TASK 5-2 enable light rotation
  rotateLight2.matrix = glm.rotateY(-timeInMilliseconds*0.1);

  root.render(context);

  //animate
  requestAnimationFrame(render);
}

/**
 * a material node contains the material properties for the underlying models
 */
class MaterialNode extends SGNode {

  constructor(children) {
    super(children);
    this.ambient = [0.2, 0.2, 0.2, 1.0];
    this.diffuse = [0.8, 0.8, 0.8, 1.0];
    this.specular = [0, 0, 0, 1];
    this.emission = [0, 0, 0, 1];
    this.shininess = 0.0;
    this.uniform = 'u_material';
  }

  setMaterialUniforms(context) {
    const gl = context.gl,
      shader = context.shader;

    //TASK 2-3 set uniforms
    //hint setting a structure element using the dot notation, e.g. u_material.test
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.ambient'), this.ambient);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.diffuse'), this.diffuse);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.specular'), this.specular);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.emission'), this.emission);
    gl.uniform1f(gl.getUniformLocation(shader, this.uniform+'.shininess'), this.shininess);
  }

  render(context) {
    this.setMaterialUniforms(context);

    //render children
    super.render(context);
  }
}

/**
 * a light node represents a light including light position and light properties (ambient, diffuse, specular)
 * the light position will be transformed according to the current model view matrix
 */
class LightNode extends TransformationSGNode {

  constructor(position, children) {
    super(children);
    this.position = position || [0, 0, 0];
    this.ambient = [0, 0, 0, 1];
    this.diffuse = [1, 1, 1, 1];
    this.specular = [1, 1, 1, 1];
    //uniform name
    this.uniform = 'u_light';
  }

  /**
   * computes the absolute light position in world coordinates
   */
  computeLightPosition(context) {
    //transform with the current model view matrix
    const modelViewMatrix = mat4.multiply(mat4.create(), context.viewMatrix, context.sceneMatrix);
    const pos = [this.position[0], this.position[1],this.position[2], 1];
    return vec4.transformMat4(vec4.create(), pos, modelViewMatrix);
  }

  setLightUniforms(context) {
    const gl = context.gl,
      shader = context.shader,
      position = this.computeLightPosition(context);

    //TASK 3-5 set uniforms
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.ambient'), this.ambient);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.diffuse'), this.diffuse);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.specular'), this.specular);

    gl.uniform3f(gl.getUniformLocation(shader, this.uniform+'Pos'), position[0], position[1], position[2]);
  }

  render(context) {
    this.setLightUniforms(context);

    //since this a transformation node update the matrix according to my position
    this.matrix = glm.translate(this.position[0], this.position[1], this.position[2]);

    //render children
    super.render(context);
  }
}

function convertDegreeToRadians(degree) {
  return degree * Math.PI / 180
}
