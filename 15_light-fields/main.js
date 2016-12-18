/**
 *
 */
'use strict';

var gl = null;

//scene graph nodes
var root = null;
var quad = null;

// global variable containing the control:
var lfcontrol = null;


// full size of light field texture
// dimensions of light field (4D)
var texSize = 8192; // assume quadratic for now!
// //  BUDDHA-LF
// var lfSize = { u : 9, v : 9, s : 768, t : 768};
// var lf_texture_file = 'models/lfpersp_buddha_8192.png';
//  CHESS-LF
var lfSize = { u : 11, v : 13, s : 700, t : 400};
var lf_texture_file = 'models/lfpersp_chess_8192.png';

// aperture and center of light field
var aperture = null;
var lfCenter = [(lfSize.u-1)/2.0, (lfSize.v-1)/2.0];
var lf_disparity = 0.0;
var lf_aperture_pos = [lfCenter[0],lfCenter[1]];
var lf_aperture_radius = 2;


//load the required resources using a utility function
loadResources({
  vs: 'shader/lf.vs.glsl',
  fs: 'shader/lf.fs.glsl',
  lf_texture: lf_texture_file,
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  initLF(resources);
  init(resources);
  render(0);
});

function init(resources) {
  //create a GL context
  gl = createContext(lfSize.s,lfSize.t,true); // create canvas in size of lf and keep the size (don't resize)


  // disable depth test for our use case
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);

  //create scenegraph
  root = createSceneGraph(gl, resources);

  initInteraction(gl.canvas);
}


function updateAperture(){
  if (aperture === null){
    aperture = new Array(lfSize.u*lfSize.v);
  }
  // bound checks
  lf_aperture_pos[0] = Math.max(0,Math.min(lfSize.u-1,lf_aperture_pos[0]));
  lf_aperture_pos[1] = Math.max(0,Math.min(lfSize.v-1,lf_aperture_pos[1]));
  var maxSize = Math.max(lfCenter[0]+1,lfCenter[1]+1);
  lf_aperture_radius = Math.max(0,Math.min(Math.sqrt(2*maxSize*maxSize),lf_aperture_radius));

  var r2 = lf_aperture_radius*lf_aperture_radius;
   for(var u = 0; u < lfSize.u; u ++ ){
     var du = lf_aperture_pos[0]-u;
     du = du*du;
     for(var v = 0; v < lfSize.v; v ++ ){
         var dv = lf_aperture_pos[1]-v;
         dv = dv*dv;
         if( dv+du <= r2 ){
           aperture[u*lfSize.v+v] = 1.0;
         } else {
           aperture[u*lfSize.v+v] = 0.0;
         }
     }
   }

   if (lfcontrol != null){
     lfcontrol.drawAperture();
   }
}

function initLF(resources){
  updateAperture();


  // append shader defines to shader source code!
  // as
  // #define LF_SIZE_U 9
 resources.fs = '#define LF_SIZE_U '+lfSize.u.toString()+'\n'
    + '#define LF_SIZE_V '+lfSize.v.toString()+'\n'
    + resources.fs;


    // create control canvas for light field
    lfcontrol = new LFControl(100,100*lfSize.v/lfSize.u);

}

function createSceneGraph(gl, resources) {



  //create shader
  const root = new ShaderSGNode(createProgram(gl, resources.vs, resources.fs));

  {
    //initialize screen spaced quad

    quad = new LFSGNode( lfSize, [texSize, texSize],
      new TextureSGNode(resources.lf_texture, 0, 'u_diffuseTex',
                      new RenderSGNode(makeScreenQuad())
      ));


    root.append( quad );
  }


  return root;
}

function makeScreenQuad() {
  var width = 1;
  var height = 1;
  var position = [0, 0, 0,  lfSize.s, 0, 0,   lfSize.s, lfSize.t, 0,   0, lfSize.t, 0];
  var normal = [0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1];
  var texturecoordinates = [0, 0,   1, 0,   1, 1,   0, 1];
  //var texturecoordinates = [0, 0,   5, 0,   5, 5,   0, 5];
  var index = [0, 1, 2,   2, 3, 0];
  return {
    position: position,
    normal: normal,
    texture: texturecoordinates,
    index: index
  };
}

class LFSGNode extends SGNode {

  constructor( lfsize, texsize, children ) {
    super( children );
    this.lfsize = [lfsize.s,lfsize.t,lfsize.u,lfsize.v];
    this.texsize = texsize;
    this.center = [(lfsize.u-1)/2.0, (lfsize.v-1)/2.0];
    this.disparity = 0.0;

    //set of additional lights to set the uniforms
    this.lights = [];
  }

  setLFUniforms(context) {
    const gl = context.gl;

    gl.uniform4fv(gl.getUniformLocation( context.shader, 'u_lf_size' ), this.lfsize);
    gl.uniform2fv(gl.getUniformLocation( context.shader, 'u_tex_size' ), this.texsize);
    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_lf_disparity'), this.disparity);
    gl.uniform2fv(gl.getUniformLocation(context.shader, 'u_lf_center'), this.center);
    gl.uniform1fv(gl.getUniformLocation(context.shader, 'u_aperture'), this.aperture);

  }

  render(context) {
    this.setLFUniforms(context);

    //render children
    super.render(context);

  }
}


function render(timeInMilliseconds) {
  checkForWindowResize(gl);

  //setup viewport
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //setup context and camera matrices
  const context = createSGContext(gl);
  context.projectionMatrix = mat4.ortho(mat4.create(), 0.0,lfSize.s, lfSize.t,0.0,-1.0,1.0);
  let lookAtMatrix = mat4.create();
  context.viewMatrix = lookAtMatrix;

  //update animations
  context.timeInMilliseconds = timeInMilliseconds;


  // render lf-quad
  quad.disparity = lf_disparity;
  quad.aperture = aperture;
  root.render(context);

  //animate
  requestAnimationFrame(render);
}

//camera control
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
      lf_aperture_pos[0] += delta.x;
      lf_aperture_pos[1] += delta.y;
      updateAperture();
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
    switch(event.code){
      case 'KeyR':
        // reset everything!!!
        lf_disparity = 0.0;
        lf_aperture_pos = [lfCenter[0],lfCenter[1]];
        lf_aperture_radius = 1.0;
        updateAperture();
        break;
      case 'NumpadSubtract':
        // decrease disparity
        lf_disparity -= 0.1;
        //console.log('disparity: '+lf_disparity.toString());
        break;
      case 'NumpadAdd':
        // increase disparity
        lf_disparity += 0.1;
        //console.log('disparity: '+lf_disparity.toString());
        break;
      case "ArrowDown":
      case "KeyS":
        // Do something for "down arrow" key press.
        lf_aperture_pos[1] += 1;
        updateAperture();
        break;
      case "ArrowUp":
      case "KeyW":
        // Do something for "up arrow" key press.
        lf_aperture_pos[1] -= 1;
        updateAperture();
        break;
      case "ArrowLeft":
      case "KeyA":
        // Do something for "left arrow" key press.
        lf_aperture_pos[0] -= 1;
        updateAperture();
        break;
      case "ArrowRight":
      case "KeyD":
        // Do something for "right arrow" key press.
        lf_aperture_pos[0] += 1;
        updateAperture();
        break;

      case "Numpad1":
      case "NumpadDivide":
      case "KeyY":
        lf_aperture_radius -= 0.5;
        updateAperture();
        break;
      case "Numpad2":
      case "NumpadMultiply":
      case "KeyX":
        lf_aperture_radius += 0.5;
        updateAperture();
        break;
    }
    // DEBUG:
    //console.log('event.code: '+event.code);
    //console.log('event.code: '+event.keyCode);

  });
}


// class for generating an aperture view.
class LFControl {

  constructor( width, height ) {
    var canvas = document.createElement('canvas');
    canvas.width = width || 100;
    canvas.height = height || 100;
    this.canvas = canvas;
    document.body.appendChild(canvas);
    this.context = canvas.getContext('2d');

    this.drawAperture( );
  }

  drawAperture(){
    var bw = this.canvas.width / lfSize.u;
    var bh = this.canvas.height / lfSize.v;
    var ctx = this.context;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    var drawRadius = Math.min(bw/2.0,bh/2.0)*.8;

    for (var x = 0; x < lfSize.u; x ++ ){
      for (var y = 0; y < lfSize.v; y++ ){
        if(aperture[x*lfSize.v+y]>0.0){
          ctx.fillStyle = "black";
        } else {
          ctx.fillStyle = "white";
        }
        ctx.beginPath();
        this.context.arc(bw*(.5+x),bh*(.5+y),drawRadius,0,Math.PI*2);
        ctx.stroke();
        this.context.fill();
      }
    }



  }


}
