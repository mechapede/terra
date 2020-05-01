import { GameObject, Material, Model, Script, Level, RenderType } from "../../engine/types.js";
import * as input from "../../engine/input.js";
import * as data from "../../engine/data.js";

//should match filename... todo: enforce constraints
export class water extends Script {
  constructor(parent) {
    super(parent);
    
    this.grid_size = 64;
    this.grid_spacing = 1;
  }

  start() {
    var verts = [];
    var indeces = [];
    var uvs = [];

    //account for position of mesh when generating mesh
    for(var z=0; z<=this.grid_size; z++) {
      for(var x=0; x<=this.grid_size; x++) {
        verts.push(x*this.grid_spacing); //x
        verts.push(0.0); //y
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

    for(var z=0; z<=this.grid_size; z++) {   //calculate the uvs for the plane, uniform, prob some better way in future
      for(var x=0; x<=this.grid_size; x++) {
        uvs.push(x % 2);
        uvs.push(z % 2);
      }
    }


    var model = new Model(verts,indeces,null,uvs);
    model.calculateNormals();
    model.loadMemory();
    this.parent.models = [model];
    this.parent.render_type = RenderType.NORMAL;
  }

  step() {

  }
}
