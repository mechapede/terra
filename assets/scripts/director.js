import { GameObject, Material, Model, Script, Level } from "../../engine/types.js";
import * as input from "../../engine/input.js";
import * as data from "../../engine/data.js";
import { PerlinNoise } from "./PerlinNoise.js";
// needs to have all the namespace of the varriabels


//should match filename... todo: enforce constraints
export class director extends Script {
  constructor(parent) {
    super(parent);
    this.grid_size = 64;
    this.grid_spacing = 1;
    this.terrain_squares = [];
    this.water_squares = [];
    //generators shared by children
    this.perlin_generator = new PerlinNoise(16);
  }

  start() {
    
    for(var z=0; z<2; z++ ){
      for(var x=0; x<2; x++){
        var position = new Float32Array([x*this.grid_size*this.grid_spacing, 0, z*this.grid_size*this.grid_spacing]);
        var rotation = new Float32Array([0,0,0,1]);
        var instance_id = data.addInstance(position, rotation, "terrain");
        this.terrain_squares.push(instance_id);
        var instance = data.getInstance(instance_id);
        instance.scripts[0].perlin_generator = this.perlin_generator;
        instance.scripts[0].perlin_generator1 = this.perlin_generator1;
        instance.scripts[0].perlin_generator2 = this.perlin_generator2;
        
        position = new Float32Array([x*this.grid_size*this.grid_spacing, 0, z*this.grid_size*this.grid_spacing]);
        rotation = new Float32Array([0,0,0,1]);
        instance_id = data.addInstance(position, rotation, "water");
        this.water_squares.push(instance_id);
      }
    }
  }

  step() {

  }
}
