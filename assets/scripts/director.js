import { GameObject, Material, Model, Script, Level } from "../../engine/types.js";
import { vec3, quaternion } from "../../engine/emath.js"
import * as input from "../../engine/input.js";
import * as data from "../../engine/data.js";
import { PerlinNoise } from "./PerlinNoise.js";
import { ParabolicMovement } from "./ParabolicMovement.js";

var follow_path = true;

//should match filename... TODO: add static check at json pack time
export class director extends Script {
  constructor(parent) {
    super(parent);
    this.grid_size = 64;
    this.grid_spacing = 1;
    this.terrain_squares = [];
    this.water_squares = [];
    this.perlin_generator = null;
    this.movement_location = 0;
    this.movement_calculator = null;
    this.follow_path = true;
    
    this.fps_field = document.getElementById("fps");
    this.tris_field = document.getElementById("tris");
    this.frametime_field = document.getElementById("frame_time");
    this.follow_path_field = document.getElementById("follow_path");
  }

  start() {
    //terrain and water generation
    this.perlin_generator = new PerlinNoise(16); //generators shared by children
    for(var z=0; z<2; z++) {
      for(var x=0; x<2; x++) {
        var position = new Float32Array([x*this.grid_size*this.grid_spacing, 0, z*this.grid_size*this.grid_spacing]);
        var rotation = new Float32Array([0,0,0,1]);
        var instance_id = data.addInstance(position, rotation, "terrain");
        this.terrain_squares.push(instance_id);
        var instance = data.getInstance(instance_id);
        instance.scripts[0].perlin_generator = this.perlin_generator;

        position = new Float32Array([x*this.grid_size*this.grid_spacing, 0, z*this.grid_size*this.grid_spacing]);
        rotation = new Float32Array([0,0,0,1]);
        instance_id = data.addInstance(position, rotation, "water");
        this.water_squares.push(instance_id);
      }
    }
    
    //parabolic path
    var pairs = [[32,32],[96,32],[96,96],[32,96]];
    var sections = 10;
    var locations = new Float32Array(pairs.length*sections*3);
    for(let i=0; i < pairs.length; i++) {
      let start_pair = pairs[i];
      let end_pair = pairs[(i+1) % pairs.length]
      for(let j=0; j < sections; j++){
        let x = ((sections-j)/sections)*start_pair[0] + (j/sections)*end_pair[0];
        let z = ((sections-j)/sections)*start_pair[1] + (j/sections)*end_pair[1];
        locations[i*3*sections+j*3] = x;
        locations[i*3*sections+j*3+1] = Math.max(this.sample_perlin(x, z),0) + 5;
        locations[i*3*sections+j*3+2] = z;
      }
    }
    this.movement_calculator = new ParabolicMovement(locations, 0.5, 20);
    
    //listiners for movement
    data.camera.locked = true;
    this.follow_path_field.addEventListener("click", () => {
      this.follow_path = this.follow_path_field.checked;
      data.camera.locked = this.follow_path;
    });

  }

  step() {
    if(this.follow_path){
      this.movement_location = (this.movement_location + data.timedelta/60) % 1;
      var arc_point = this.movement_calculator.GetArcPoint(this.movement_location);
      data.camera.position = this.movement_calculator.GetPoint(arc_point);
      
      var velocity = this.movement_calculator.GetVelocity(arc_point);
      var acceleration = this.movement_calculator.GetAcceleration(arc_point);
      var base = vec3.normalize(vec3.cross(velocity, acceleration, acceleration), acceleration);
      var tangent = vec3.normalize(velocity, velocity);
      var normal = vec3.normalize(vec3.cross(base, tangent, base), base);
      //data.camera.rotation = 
      
      //TODO: make camera point in direction of movement
      /*
      //Unity source code to port
      Vector3 V = Path.GetVelocity(arc_point);
      Vector3 Q = Path.GetAcceleration(arc_point);
      Vector3 B = Vector3.Normalize(Vector3.Cross(V, Q));
      Vector3 T = Vector3.Normalize(V); //forward direction
      //right vector is not needed
      Vector3 N = Vector3.Normalize(Vector3.Cross(B, T));
      transform.rotation = Quaternion.LookRotation(N, T);
      */
    }
    
    this.fps_field.textContent = data.fps;
    this.tris_field.textContent = data.tris;
    this.frametime_field.textContent = Number.parseFloat(data.frame_time).toFixed(3);
  }
  
  /* Same as terrain but returns 3 coordinates*/
  sample_perlin(x,y){
    var sample = this.perlin_generator.GetPerlinNoise(x/64 ,y/64)+
                  0.5*this.perlin_generator.GetPerlinNoise(x/8 ,y/8)
                  0.25*this.perlin_generator.GetPerlinNoise(x/4 ,y/4);
    return (Math.pow(sample+1,1.5)-1)*4;
  }
}
