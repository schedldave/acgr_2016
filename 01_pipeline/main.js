/**
 * Project for first lab session
 */

//the OpenGL context
var gl = null;
//our shader program
var shaderProgram = null;

var canvasWidth = 800;
var canvasHeight = 800;
var aspectRatio = canvasWidth / canvasHeight;

//rendering context
var context;

// camera parameters
const camera = {
  rotation: {
    x: 0,
    y: 0
  }
};

//camera and projection settings
var animatedAngle = 0;
var fieldOfViewInRadians = convertDegreeToRadians(30);

var robotTransformationNode, robotAnimationNode;
var headTransformationNode, headAnimationNode;

/**
 * returns the model of a new cube of the given scale
 * @param scale
 * @returns {ISGModel}
 */
function makeCube( s ) {
  s = s || 0.3; // size
  var position = new Float32Array([
     -s,-s,-s, s,-s,-s, s, s,-s, -s, s,-s,
     -s,-s, s, s,-s, s, s, s, s, -s, s, s,
     -s,-s,-s, -s, s,-s, -s, s, s, -s,-s, s,
     s,-s,-s, s, s,-s, s, s, s, s,-s, s,
     -s,-s,-s, -s,-s, s, s,-s, s, s,-s,-s,
     -s, s,-s, -s, s, s, s, s, s, s, s,-s,
  ]);
  var normal = [];
  var texture = [];
  var color = new Float32Array([
     0,1,1, 0,1,1, 0,1,1, 0,1,1,
     1,0,1, 1,0,1, 1,0,1, 1,0,1,
     1,0,0, 1,0,0, 1,0,0, 1,0,0,
     0,0,1, 0,0,1, 0,0,1, 0,0,1,
     1,1,0, 1,1,0, 1,1,0, 1,1,0,
     0,1,0, 0,1,0, 0,1,0, 0,1,0
  ]);
  var index =  new Float32Array([
     0,1,2, 0,2,3,
     4,5,6, 4,6,7,
     8,9,10, 8,10,11,
     12,13,14, 12,14,15,
     16,17,18, 16,18,19,
     20,21,22, 20,22,23
  ]);
  return {
    position: position,
    // normal: normal, // no normals!
    // texture: texture, // no textures!
    color: color,
    index: index
  };
}

//load the shader resources using a utility function
loadResources({
  vs: 'shader/simple.vs.glsl',
  fs: 'shader/simple.fs.glsl',
  staticcolorvs: 'shader/static_color.vs.glsl'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  //render one frame
  render();
});

/*
 * initialize user input via mouse and keyboard
 */
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

/**
 * initializes OpenGL context, compile shader, and load buffers
 */
function init(resources) {

  //create a GL context
  gl = createContext(canvasWidth, canvasHeight);

  //in WebGL / OpenGL we have to create and use our own shaders for the programmable pipeline
  //create the shader program
  shaderProgram = createProgram(gl, resources.vs, resources.fs);

  //create scenegraph
  rootNode = new ShaderSGNode(shaderProgram);

  // create cube in origin
  rootNode.append(
    new TransformationSGNode( glm.transform({ translate: [0,.1,0], rotateX: 0, scale: 1}), [
      new RenderSGNode(makeCube(0.1))
    ]));

  // create floor
  rootNode.append(
    new TransformationSGNode(glm.transform({ translate: [0,0,0], rotateX: 90, scale: 2}), [
      new ShaderSGNode(createProgram(gl, resources.staticcolorvs, resources.fs), [
          new RenderSGNode(makeRect())
      ])
    ]));

  // create robot scene
  rootNode.append( createRobot() );

  // interaction (mouse,keyboard inputs,...)
  initInteraction(gl.canvas);
}

function createRobot() {
  //transformations of whole body
  robotTransformationNode = new TransformationSGNode(glm.translate(0.5,0.9,0));

  // node for animation
  robotAnimationNode = new TransformationSGNode(mat4.create());
  robotAnimationNode.append(robotTransformationNode);

  //body
  cubeNode = new RenderSGNode( makeCube() );
  robotTransformationNode.append(cubeNode);

  // transformations of head
  headTransformationNode = new TransformationSGNode(
      mat4.multiply(mat4.create(), glm.translate(0.0,0.4,0), glm.scale(0.4,0.33,0.5)),[
        new RenderSGNode( makeCube() )
      ] );

  // animate head rotation
  headAnimationNode = new TransformationSGNode( mat4.create(), [headTransformationNode] );
  robotTransformationNode.append(headAnimationNode);

  //transformation of left leg
  var leftLegTransformationNode = new TransformationSGNode(
      mat4.multiply(mat4.create(), glm.translate(0.16,-0.6,0), glm.scale(0.2,1,1)),[
        new RenderSGNode( makeCube() )
      ]);
  robotTransformationNode.append(leftLegTransformationNode);

  //transformation of right leg and right leg
  var rightLegtTransformationNode = new TransformationSGNode(
      mat4.multiply(mat4.create(), glm.translate(-0.16,-0.6,0), glm.scale(0.2,1,1)),[
        new RenderSGNode( makeCube() )
      ]);
  robotTransformationNode.append(rightLegtTransformationNode);

  return robotAnimationNode;
}

/**
 * render one frame
 */
function render(timeInMilliseconds) {

  //set background color to light gray
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // ANIMATIONS
  // animate based on elapsed time
  animatedAngle = timeInMilliseconds/10.0;
  if( !isNaN(animatedAngle) ) {
    robotAnimationNode.matrix = glm.rotateY(animatedAngle/2);
    headAnimationNode.matrix = glm.rotateY(animatedAngle);
  }

  context = createSGContext(gl);

  context.projectionMatrix = mat4.perspective(mat4.create(), fieldOfViewInRadians, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);


  context.viewMatrix = calculateViewMatrix();

  //rotate whole scene according to the mouse rotation stored in
  //camera.rotation.x and camera.rotation.y
  context.sceneMatrix = mat4.multiply(mat4.create(),
                            glm.rotateY(camera.rotation.x),
                            glm.rotateX(camera.rotation.y));


  // render scene graph
  rootNode.render(context);

  //request another render call as soon as possible
  requestAnimationFrame(render);


}

function calculateViewMatrix() {
  //compute the camera's matrix
  var eye = [0,3,8];
  var center = [0,0,0];
  var up = [0,1,0];
  viewMatrix = mat4.lookAt(mat4.create(), eye, center, up);
  return viewMatrix;
}



function convertDegreeToRadians(degree) {
  return degree * Math.PI / 180
}
