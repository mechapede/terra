import { GameObject, Material, Model, Script, Level, RenderType, InstanceBaker } from "../../engine/types.js";
import * as input from "../../engine/input.js";
import { PerlinNoise } from "./PerlinNoise.js";
import * as data from "../../engine/data.js";
import { mat4, vec3, vec4, quaternion } from "../../engine/emath.js";

//should match filename... todo: enforce constraints
export class terrain extends Script {
  constructor(parent) {
    super(parent);
    this.perlin_generator = null;

    this.grid_size = 64;
    this.grid_spacing = 1;
    this.verts = [];
    this.indeces = [];

    //models with weights
    var beach_models = [["grass3",5],["grass4",5],["grass5",5],
                                    ["rock1",1],["rock2",1],["rock3",1],["rock4",1],["rock5",1]];
    var grass_models = [["grass1",20],["grass2",10],["grass6",20],["grass7",20],["grass8",20],
                                    ["fern1",5],["fern2",5],
                                    ["dead_bush1",5],["dead_bush3",5],
                                    ["big_rock1",1],["big_rock2",1],["big_rock3",1],
                                    ["flat_rock1",1],["flat_rock2",1],["flat_rock3",1],["flat_rock4",1],["flat_rock5",1],
                                    ["rock1",1],["rock2",1],["rock3",1],["rock4",1],["rock5",1]];
    var hill_models = [["flat_rock1",1],["flat_rock2",1],["flat_rock3",1],["flat_rock4",1],["flat_rock5",1],
                                       ["rock1",1],["rock2",1],["rock3",1],["rock4",1],["rock5",1]];

    //generate cumulative probabilities
    this.beach_models = this.generate_cumulative_weights(beach_models);
    this.grass_models = this.generate_cumulative_weights(grass_models);
    this.hill_models = this.generate_cumulative_weights(hill_models);

    //buffers to reduce memory allocations
    this.buff1 = new Float32Array(3);
    this.buff2 = new Float32Array(3);
    this.bakers = {}; //vegetation is static
  }
  
  sample_perlin(x,y){
    var sample = this.perlin_generator.GetPerlinNoise(x/64 ,y/64)+
                  0.5*this.perlin_generator.GetPerlinNoise(x/8 ,y/8)
                  0.25*this.perlin_generator.GetPerlinNoise(x/4 ,y/4);
    return (Math.pow(sample+1,1.5)-1) *4;
  }
  
  start() {
    var verts = this.verts;
    var indeces = this.indeces;

    //account for position of mesh when generating mesh
    for(var z=0; z<=this.grid_size; z++) {
      for(var x=0; x<=this.grid_size; x++) {
        verts.push(x*this.grid_spacing); //x
        var random_height = this.sample_perlin(this.parent.position[0] + x*this.grid_spacing,
                                               this.parent.position[2] + z*this.grid_spacing)
        verts.push(random_height); //y
        verts.push(z*this.grid_spacing); //z
      }
    }
    for(var z=0; z<this.grid_size; z++) {
      for(var x=0; x<this.grid_size; x++) {
        indeces.push((x+1)+z*(this.grid_size+1));
        indeces.push(x+(z+1)*(this.grid_size+1));
        indeces.push(x+z*(this.grid_size+1));
        //two triganles for terrain
        indeces.push((x+1)+z*(this.grid_size+1));
        indeces.push((x+1)+(z+1)*(this.grid_size+1));
        indeces.push(x+(z+1)*(this.grid_size+1));
      }
    }

    var model = new Model(verts,indeces,null);
    model.calculateNormals();
    model.loadMemory();
    this.parent.models = [model];

    //create the vegetation
    for(var x=1; x<this.grid_size; x += 2) {
      for(var z=1; z<this.grid_size; z += 2) {
        this.place_on_slope(x+(Math.random()-0.5)*2,z+(Math.random()-0.5)*2);
      }
    }
    for(var model in this.bakers){
      this.bakers[model].bake();
    } 
  }

  /* Places Object on slope facing upwards  */
  place_on_slope(xcord,zcord) {
    var px = xcord % this.grid_spacing;
    var pz = zcord % this.grid_spacing;
    var cell_x = Math.trunc(xcord / this.grid_spacing) % this.grid_size;
    var cell_z = Math.trunc(zcord / this.grid_spacing) % this.grid_size;
    var normal;
    if(px + pz < this.grid_spacing) { //lower triangle
      var l11_index = cell_x + (cell_z+1) * (this.grid_size+1);
      var l12_index = cell_x + cell_z*(this.grid_size+1);
      var l21_index = (cell_x + 1) + cell_z * (this.grid_size+1);
      var l22_index = l12_index;
      normal = vec3.normalize(vec3.cross([this.verts[l21_index*3] - this.verts[l22_index*3],
                                                                  this.verts[l21_index*3+1] - this.verts[l22_index*3+1],
                                                                  this.verts[l21_index*3+2] - this.verts[l22_index*3+2]],
                                         [this.verts[l11_index*3] - this.verts[l12_index*3],
                                                                  this.verts[l11_index*3+1] - this.verts[l12_index*3+1],
                                                                  this.verts[l11_index*3+2] - this.verts[l12_index*3+2]],

                                         new Float32Array(3)
                                        ), new Float32Array(3)
                             )
    } else { //higher triagnle
      var l11_index = (cell_x+1) + cell_z * (this.grid_size+1);
      var l12_index = (cell_x+1) + (cell_z+1)*(this.grid_size+1);
      var l21_index = cell_x + (cell_z+1) * (this.grid_size+1);
      var l22_index = l12_index;
      normal = vec3.normalize(vec3.cross([this.verts[l21_index*3] - this.verts[l22_index*3],
                                                                  this.verts[l21_index*3+1] - this.verts[l22_index*3+1],
                                                                  this.verts[l21_index*3+2] - this.verts[l22_index*3+2]],
                                         [this.verts[l11_index*3] - this.verts[l12_index*3],
                                                                  this.verts[l11_index*3+1] - this.verts[l12_index*3+1],
                                                                  this.verts[l11_index*3+2] - this.verts[l12_index*3+2]],

                                         new Float32Array(3)
                                        ), new Float32Array(3)
                             )
    }
    //don't place on walls
    if(normal[1] <= 0.5) {
      return;
    }
    //find elevation of terrain
    var index = (cell_x + 1) + cell_z * (this.grid_size + 1);
    var ycord = -(((xcord - this.verts[index*3]) * normal[0] +
                   (zcord- this.verts[index*3+2]) * normal[2])
                  / normal[1]) + this.verts[index*3+1];
    //do not place under water
    if(ycord < 0) {
      return;
    }

    //var position = new Float32Array([this.parent.position[0] + xcord,this.parent.position[1] + ycord,this.parent.position[2] + zcord,0]);
    var position = new Float32Array([xcord,ycord,zcord,0]);
    var rotation = quaternion.getRotaionBetweenVectors([0,1,0],normal,new Float32Array(4));
    var model = null;
    if(ycord < 0.5) { //TODO: move measurements to shared place
      model = this.weighted_choice(this.beach_models)
    } else if(ycord < 3.0) {
      model = this.weighted_choice(this.grass_models);
    } else {
      //place less things on hills
      if( Math.random() < 0.75 ) return;
      model = this.weighted_choice(this.hill_models);
    }
    if(model in this.bakers){
      this.bakers[model].addInstance(position, rotation);
    }else{
      var baker = new InstanceBaker(new Float32Array(this.parent.position), new Float32Array(this.parent.rotation),model);
      baker.addInstance(position, rotation);
      this.bakers[model] = baker;
    }
  }

  choice(choices) { //TODO: move to math lib
    var ran_index = Math.floor(Math.random()*choices.length);
    return choices[ran_index];
  }

  weighted_choice(cumulative_choices) {
    if(cumulative_choices.length == 1) {
      return cumulative_choices[0][0];
    }
    var rand = Math.random()*cumulative_choices[cumulative_choices.length-1][1];
    
    var start_index = 0;
    var end_index = cumulative_choices.length;
    while(start_index < end_index-1) {
      var mid_index = start_index + Math.floor((end_index - start_index)/2);
      if(cumulative_choices[mid_index][1] <= rand) {
        start_index = mid_index;
      } else {
        end_index = mid_index;
      }
    }
    
    if(cumulative_choices[start_index][1] < rand) {
      return cumulative_choices[start_index][0];
    } else {
      return cumulative_choices[start_index+1][0];
    }
  }

  generate_cumulative_weights(weighted_choices) {
    var result = [];
    var sum = 0;
    for(var c of weighted_choices) {
      sum += c[1];
      result.push([c[0],sum]);
    }
    return result;
  }



  step() {
  }
}
