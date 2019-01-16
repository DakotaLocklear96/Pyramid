
var canvas;
var gl;
var program;

var points = [];
var indices = [];
var UVs = [];
var normals = [];
var nFaces;

var axis = 0;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var theta = [0, 0, 0];

var displacement_y = 2.;
var velocity_y = 0.;
var trans = true;
var vNum = 0.1;
var dNum =0.03;
var maxAngle = 360;

window.onload = function init()
{
    initGL();

    cylinder();

    initTexture();

    //event listeners for buttons

    document.getElementById("xButton").onclick = function () {
        axis = xAxis;
    };
    document.getElementById("yButton").onclick = function () {
        axis = yAxis;
    };
    document.getElementById("zButton").onclick = function () {
        axis = zAxis;
    };
    document.getElementById("pause").onclick = function () {
        ///Pause
        if(axis != -1)
        {
            axis = -1;
        }
        else
        {
            axis = 0;
        }
    };

    document.onkeydown = OnKeyDown;

    render();
}

function initGL()
{
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
}

var points1 = [];
var normals1 = [];
var UVs1 = [];
var indices1 = [];
var buffers1 = [];
function cylinder() {
    var angRad;

    //Add Center
    points1.push(vec3(0., 0., 0.));
    normals1.push(normalize(vec3(0., 0., 0.)));

    for (i = 0; i < maxAngle; i++) {

        if (i % 3 == 0)
        {
            indices1.push(0);
        }

        //Add To Points
        angRad = (i * Math.PI * 360) / 180;
        points1.push(vec3(Math.cos(angRad), Math.sin(angRad), 0.));
        normals1.push(normalize(vec3(Math.cos(angRad), Math.sin(angRad), 0.)));
        indices1.push(i+1);   
    }

    UVs1.push(
	    vec2(0., 0.),
	    vec2(1., 0.),
	    vec2(1., 1.),
	    vec2(0., 1.),
	    vec2(1., 1.),
	    vec2(0., 1.),
	    vec2(0., 0.),
	    vec2(1., 0.)
        );

    var vBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points1), gl.STATIC_DRAW);
    buffers1.push(vBuffer1);

    var nBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals1), gl.STATIC_DRAW);
    buffers1.push(nBuffer1);

    var tcBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tcBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(UVs1), gl.STATIC_DRAW);
    buffers1.push(tcBuffer1);

    var tBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tBuffer1);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(indices1)), gl.STATIC_DRAW);
    buffers1.push(tBuffer1);
}

var squareTexture;
var squareTexture2;

function initTexture() {
    squareTexture = gl.createTexture();
    var squareImage = new Image();
    squareImage.onload = function () { handleTextureLoaded(squareImage, squareTexture); }
    squareImage.src = "Material/HelloWorld.png";

    squareTexture2 = gl.createTexture();
    var squareImage2 = new Image();
    squareImage2.onload = function () { handleTextureLoaded(squareImage2, squareTexture2); }
    squareImage2.src = "Material/marble10.png";
}

function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}


function render()
{
    velocity_y = 0.9999 * velocity_y - vNum;
    displacement_y = displacement_y + velocity_y * dNum;
    if (displacement_y < -2.) {
        displacement_y = -2.;
        velocity_y = -velocity_y;
    }
    gl.uniform1f(gl.getUniformLocation(program, "displacement_y"), displacement_y);

    theta[axis] += 2.0;
    gl.uniform3fv(gl.getUniformLocation(program, "theta"), theta);

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    ///Torus
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, squareTexture);
    gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);

    ///Triangle
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, squareTexture2);
    gl.uniform1i(gl.getUniformLocation(program, "uSampler2"), 0);


    //Link data to vertex shader input
    var vPosition = gl.getAttribLocation(program, "vPosition");
    var vNormal = gl.getAttribLocation(program, "vNormal");
    var vUV = gl.getAttribLocation(program, "vUV");

    //Draw Cylinder
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers1[0]);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers1[1]);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers1[2]);
    gl.vertexAttribPointer(vUV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vUV);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffers1[3]);

    gl.uniform1i(gl.getUniformLocation(program, "useTexture"), false);
    gl.uniform1i(gl.getUniformLocation(program, "useTexture2"), false);
    gl.drawElements(gl.TRIANGLES, 360, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
}

function OnKeyDown(event)
{
    if (event.keyCode == 37) {
        theta[1] -= 30.0;
    }

    if (event.keyCode == 39) {
        theta[1] += 30.0;
    }

    if (event.keyCode == 38) {
        ///Up
        theta[0] += 30.0;
    }

    if (event.keyCode == 40) {
        ///Down
        theta[0] -= 30.0;
    }

    if (event.keyCode == 80) {

        if (trans == true)
        {
            displacement_y = 0;
            velocity_y = 0;
            vNum = 0;
            dNum = 0;
            trans = false;
        }
        else
        {
            displacment_y = 2;
            velocity_y = 1;
            vNum = 0.1;
            dNum = 0.03;
            trans = true;
        }
    }
}