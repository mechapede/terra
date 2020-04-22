import { GameObject, Material, Model, Script, Level, RenderType } from "../../engine/types.js";
import * as input from "../../engine/input.js";
import { PerlinNoise } from "./PerlinNoise.js";
import * as data from "../../engine/data.js";
import { mat4, vec3, vec4, quaternion } from "../../engine/emath.js";

//should match filename... todo: enforce constraints
export class terrain extends Script {
  constructor(parent) {
    super(parent);
    this.perlin_generator = null;
    this.perlin_generator1 = null;
    this.perlin_generator2 = null;

    this.grid_size = 64;
    this.grid_spacing = 1;
    this.verts = [];
    this.indeces = [];
  }

  start() {
    var verts = this.verts;
    var indeces = this.indeces;

    //account for position of mesh when generating mesh
    for(var z=0; z<=this.grid_size; z++) {
      for(var x=0; x<=this.grid_size; x++) {
        verts.push(x*this.grid_spacing); //x
        var random_height = (this.perlin_generator.GetPerlinNoise(this.parent.position[0] + x*this.grid_spacing,
                             this.parent.position[2] + z*this.grid_spacing) + 0.10)*8 +
                            (this.perlin_generator1.GetPerlinNoise(this.parent.position[0] + x*this.grid_spacing,
                                this.parent.position[2] + z*this.grid_spacing) + 0.10)*4 +
                            this.perlin_generator2.GetPerlinNoise(this.parent.position[0] + x*this.grid_spacing,
                                this.parent.position[2] + z*this.grid_spacing)*8;
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
    this.parent.model = model;

    //create the vegetation
    for(var x=1; x<this.grid_size; x += 4) {
      for(var z=1; z<this.grid_size; z += 4) {
        this.place_on_slope(x+(Math.random()-0.5)*3,z+(Math.random()-0.5)*3);
      }
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
      normal = vec3.normalize(vec3.cross([this.verts[l11_index*3] - this.verts[l12_index*3],
                                                                  this.verts[l11_index*3+1] - this.verts[l12_index*3+1],
                                                                  this.verts[l11_index*3+2] - this.verts[l12_index*3+2]],
                                         [this.verts[l21_index*3] - this.verts[l22_index*3],
                                                                  this.verts[l21_index*3+1] - this.verts[l22_index*3+1],
                                                                  this.verts[l21_index*3+2] - this.verts[l22_index*3+2]],
                                         new Float32Array(3)
                                        ),new Float32Array(3)
                             )
    } else { //higher triagnle
      var l11_index = (cell_x+1) + cell_z * (this.grid_size+1);
      var l12_index = (cell_x+1) + (cell_z+1)*(this.grid_size+1);
      var l21_index = cell_x + (cell_z+1) * (this.grid_size+1);
      var l22_index = l12_index;
      normal = vec3.normalize(vec3.cross([this.verts[l11_index*3] - this.verts[l12_index*3],
                                                                  this.verts[l11_index*3+1] - this.verts[l12_index*3+1],
                                                                  this.verts[l11_index*3+2] - this.verts[l12_index*3+2]],
                                         [this.verts[l21_index*3] - this.verts[l22_index*3],
                                                                  this.verts[l21_index*3+1] - this.verts[l22_index*3+1],
                                                                  this.verts[l21_index*3+2] - this.verts[l22_index*3+2]],
                                         new Float32Array(3)
                                        ), new Float32Array(3)
                             )
    }
    //don't place on walls
    if(normal[1] == 0) {
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
    
    var models = ["dead_bush1","dead_bush3","fern1","fern2","big_rock1","big_rock2","big_rock3","flat_rock1","flat_rock2","flat_rock3","flat_rock4","flat_rock5","rock1","rock2","rock3","rock4","rock5"];
    //TODO: fix rotation
    var position = new Float32Array([this.parent.position[0] + xcord,this.parent.position[1] + ycord,this.parent.position[2] + zcord,0]);
    var rotation = quaternion.getRotaionBetweenVectors([0,1,0],normal);
    var id = data.addInstance(position, rotation, this.random_choice(models));
    var instance = data.getInstance(id);

  }
  
  random_choice(choices){
    var ran_index = Math.floor(Math.random()*choices.length);
    return choices[ran_index];
  }

  step() {
    //this.parent.rotation[0] += 0.01;
  }
}
