import { Box, Button, Stack } from '@mui/material';
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { CubeTextureLoader } from 'three/src/loaders/CubeTextureLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import WebGL from "three/examples/jsm/capabilities/WebGL.js";
import { vertexShader, fragmentShader } from '../ModelViewer/shaders';
import { useLocation, useParams } from 'react-router-dom';
import nipplejs from 'nipplejs';
import { createNetworkWeightTexture, createViewDependenceFunctions, } from '../ModelViewer/shaderFunctions';
import { inherits } from 'util';
import PropagateLoader from 'react-spinners/PropagateLoader';
import { modelData, modelDir } from '../HomePage/modelData';
import { ResourceTracker } from './ResourceTracker';
import { useMediaQuery } from 'react-responsive';

const resTracker = new ResourceTracker();
const track = resTracker.track.bind(resTracker);

let renderer: any;
let renderTarget: any;
let renderTargetScene: any;

let camera: THREE.PerspectiveCamera;
let scene: any;
let control: OrbitControls;
let mainLight: any;


let currentWidth = 0;
let currentHeight = 0;

let trackItem = [];

function ProductPage() {
    const location = useLocation(); 
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const loadingBoxRef = useRef<HTMLDivElement>(null);
    const [chosenImage, setChosenImage] = useState(0);
    
    const ssLoc = modelDir + '/' + location.state.modelName + '/screenshots';
    const modelName = location.state.modelName;

    const defaultParagraph = {
        margin: 0,
    }

    function initialize() {
        scene = new THREE.Scene();
    
        camera = new THREE.PerspectiveCamera(39, currentWidth / currentHeight, 0.1, 1000);
        camera.position.y = 1;
        camera.position.z = 5;

        control = new OrbitControls(camera, canvasRef.current!);
    
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current!,
          powerPreference: "default",
          precision: "mediump",
          alpha: true,
        });
        renderer.setPixelRatio(1);
        renderer.setSize(currentWidth, currentHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x000000, 0);
        renderer.setClearAlpha(0);
    
        renderTarget = new THREE.WebGLRenderTarget(currentWidth, currentHeight);
        
        renderTargetScene = new THREE.WebGLRenderTarget(currentWidth, currentHeight);
    
        var ambientLight = new THREE.AmbientLight( 0xffffff, 1 ); // Add an ambient light to better see the model
        
        var keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
        keyLight.position.set(-100, 50, 100);
    
        var fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
        fillLight.position.set(100, 50, 100);
    
        var backLight = new THREE.DirectionalLight(0xffffff, 1.0);
        backLight.position.set(100, 50, -100).normalize();
    
        mainLight = new THREE.DirectionalLight(0xffffff, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 1000;
    
        scene.add(ambientLight);
        scene.add(mainLight);
        scene.add(keyLight);
        scene.add(fillLight);
        scene.add(backLight);
    
        // Add axes
        var axes = new THREE.AxesHelper(50);
        // scene.add(axes);
    
        // Add grid
        const size = 500;
        const divisions = 50;
    
        const gridHelper = new THREE.GridHelper(size, divisions);
        // scene.add(gridHelper);
    }

    function renderViewer() {
        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(scene, camera);
    }

    function onWindowResize() {
        const newWidth = boxRef.current!.offsetWidth;
        const newHeight = boxRef.current!.offsetHeight;
    
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
    
        renderer.setSize(newWidth, newHeight);
    
        currentWidth = newWidth;
        currentHeight = newHeight;
    }

    var animate = function() {
        requestAnimationFrame( animate );
    
        // controls.update();
        const time = performance.now();
    
        control.update();
        renderViewer();
        
    }

    async function loadObject() {
        let object_rescale = 0.7;
        let obj_name = modelName;
        let meshObj = new THREE.Group();
        await fetch("resources/real_model/" + obj_name + "_phone/mlp.json")
            .then((response) => {
              return response.json();
            })
            .then(async (json) => {
              let network_weights = json;
              // console.log(network_weights);
              let fragmentShaderSource = createViewDependenceFunctions(network_weights, fragmentShader);
              let weightsTexZero = createNetworkWeightTexture(
                network_weights["0_weights"]
              );
              let weightsTexOne = createNetworkWeightTexture(
                network_weights["1_weights"]
              );
              let weightsTexTwo = createNetworkWeightTexture(
                network_weights["2_weights"]
              );
  
              for (let i = 0, il = json["obj_num"]; i < il; i++) {
                let tex0 = track(new THREE.TextureLoader().load(
                  "resources/real_model/" + obj_name + "_phone/shape" + i.toFixed(0) + ".png" + "feat0.png",
                  // function () {
                  //   render();
                  // }
                ));
                tex0.magFilter = THREE.NearestFilter;
                tex0.minFilter = THREE.NearestFilter;
                let tex1 = track(new THREE.TextureLoader().load(
                  "resources/real_model/" + obj_name + "_phone/shape" + i.toFixed(0) + ".png" + "feat1.png",
                  // function () {
                  //   render();
                  // }
                ));
                tex1.magFilter = THREE.NearestFilter;
                tex1.minFilter = THREE.NearestFilter;
                let newmat = new THREE.RawShaderMaterial({
                  side: THREE.DoubleSide,
                  vertexShader: vertexShader,
                  fragmentShader: fragmentShaderSource,
                  uniforms: {
                    tDiffuse0: { value: tex0 },
                    tDiffuse1: { value: tex1 },
                    weightsZero: { value: weightsTexZero },
                    weightsOne: { value: weightsTexOne },
                    weightsTwo: { value: weightsTexTwo },
                  },
                  glslVersion: THREE.GLSL3,
                });
                await new OBJLoader().loadAsync(
                    "resources/real_model/" + modelName + "_phone/shape" + i.toFixed(0) + ".obj")
                    .then((object) => {
                      object.traverse(function (child: any) {
                        if (child.type == "Mesh") {
                          child.material = newmat;
                        }
                      });
                      object.scale.x = object_rescale;
                      object.scale.y = object_rescale;
                      object.scale.z = object_rescale;
                      object.castShadow = true;
                      object.receiveShadow = true;
                      object.name = i.toString();
                      let meshIndex = meshObj.children.findIndex((e) => e.name === object.name);
                      if(meshIndex === -1) 
                        meshObj.add(object);
                    }); 
                meshObj.name = modelName;
                const indexOfMesh = scene.children.findIndex((e: THREE.Group) => e.name == modelName)
                if(indexOfMesh === -1) {
                    scene.add(meshObj);
                }
              } 
              setTimeout(() => {
                if(loadingBoxRef.current)
                    loadingBoxRef.current!.style.display = 'none';
              }, 1000);
            });
    }

    // const [loading, setLoading] = useState(true);
    // let loading = true;
        
    // useEffect(() => {
    //     if(loading) {
    //         window.location.reload();
    //         console.log("mas");
    //         loading = false;
    //     }
    // }, []);

    useEffect(() => {
        currentWidth = boxRef.current!.offsetWidth;//canvasRef.current!.offsetWidth;
        currentHeight = boxRef.current!.offsetHeight; // canvasRef.current!.offsetHeight;

        loadingBoxRef.current!.style.width = `${boxRef.current!.offsetWidth}px`;
        loadingBoxRef.current!.style.height = `${boxRef.current!.offsetHeight}px`;

        initialize();
        animate();

        loadObject();
        
        window.addEventListener('resize', onWindowResize);
        return () => {
            window.removeEventListener("resize", onWindowResize);
            resTracker.dispose();

            scene.traverse((object: any) => {
                if (!object.isMesh) return
                
                console.log('dispose geometry!')
                scene.remove(object);
            
                // if (object.material.isMaterial) {
                //     cleanMaterial(object.material)
                // } else {
                //     // an array of materials
                //     for (const material of object.material) cleanMaterial(material)
                // }
            })
            // renderer.renderLists.dispose();
        };

    }, [canvasRef, boxRef, loadingBoxRef])

    const isMobile = useMediaQuery({ maxWidth: 767 })

    return(
        <Box sx={{p: '50px', }}>
            <Box sx={{
                // backgroundColor: 'gray',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row'
            }}>
                <Box sx={{
                    width: isMobile ? '100%' : '1200px',
                    height: isMobile ? '500px' : '700px',
                    margin: '10px',
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        border:'2px solid #000000',
                    }}>
                        <Box
                            component='div'
                            ref={boxRef} 
                            sx={{
                                // backgroundColor: 'grey', 
                                width: 'auto',
                                height: isMobile ? '400px' :'550px',
                                position: 'relative'
                        }}>
                            <canvas 
                                ref={canvasRef} 
                                style={{
                                    display: chosenImage == 0 ? '' : 'none', 
                                    position: 'absolute'
                                    //border:'1px solid #000000'
                                }} 
                            />
                            {
                                chosenImage > 0 &&
                                <img 
                                    style={{width: '100%', height: '100%', objectFit: 'scale-down', position: 'inherit', justifyContent: 'center'}} 
                                    alt='gongzai' 
                                    src={modelDir + '/' + modelName + '_phone/screenshots/' + modelData[location.state.modelName].imageName[chosenImage]} />
                            }
                            
                            <Box ref={loadingBoxRef} sx={{position: 'absolute', backgroundColor: 'black', opacity: '60%'}} /> 
                            <Box ref={loadingBoxRef} sx={{backgroundColor: 'black', opacity: '60%', position: 'absolute', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                                <h1 style={{width: '100%',position: 'static', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Loading</h1>
                                <PropagateLoader
                                    style={{width: '100%',position: 'static', display: 'flex', justifyContent: 'center', alignItems: 'center'}}
                                    color={"#ffffff"}
                                    loading={true}
                                    cssOverride={{
                                        // display: "block",
                                        margin: "0 auto",
                                        borderColor: "red",
                                    }}
                                    size={30}
                                    aria-label="Loading Spinner"
                                    data-testid="loader" />
                            </Box>
                        </Box>
                        <Box sx={{
                            maxWidth: isMobile ? '100%' : '1200px',
                            overflow: 'auto', 
                            flex: 1,
                            display: 'flex', 
                            flexDirection: 'row',
                            backgroundColor: '#eeeeee'
                        }}>
                            
                            {
                                (modelData[location.state.modelName].imageName).map((key: any, index: any) => (
                                    <Box 
                                        component='div'
                                        key={index} 
                                        onClick={() => {
                                            setChosenImage(index);
                                        }}
                                        sx={{
                                            minWidth: isMobile ? '100px' : '200px', 
                                            maxWidth: isMobile ? '100px' : '200px', 
                                            p: '5px',
                                            cursor: 'pointer'
                                        }}>
                                        {
                                            <img 
                                                style={{width: '90%', height: '90%', objectFit: 'scale-down', border: chosenImage == index ? '3px solid #000000' : 'none'}} 
                                                alt='gongzai' 
                                                src={modelDir + '/' + modelName + '_phone/screenshots/' + key}/>
                                        }
                                    </Box>
                                ))
                            }
                        </Box>
                    </Box>
                </Box>
                <Box sx={{paddingLeft: '20px', paddingTop: '50px', paddingRight: '50px'}}>
                    <h1>
                        {modelData[location.state.modelName].name}
                    </h1>
                    <Box sx={{
                        // backgroundColor: 'blue', 
                        height: isMobile ? 'auto' : '350px'
                    }}>
                        <p>{modelData[location.state.modelName].desc}</p>
                    </Box>
                    <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                        <Stack direction='column' spacing={1}>
                            <p style={{...defaultParagraph, ...{marginRight: 10, marginBottom: 10, color: 'red', fontSize: '50px'}}}>
                                <b>NT$ 999</b>
                            </p>
                            <Button variant='contained' sx={{maxHeight: '50px', minHeight: '50px', backgroundColor: 'black'}}>Add to cart</Button>
                        </Stack>
                        
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default ProductPage;