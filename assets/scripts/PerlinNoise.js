import { vec2 } from "../../engine/emath.js"

/* Perlin Noise generator */
export class PerlinNoise {
  /* Produces a Perlin grid for sampaling
     grid_size: for dividing input before mapping to grid
     factor: factor for interpolating x,y
     TODO: can move to shared math lib?
     TODO: seed: number for random generator? Cannot speciy in js?
  */
  constructor(grid_size) {
    this.grid_size = grid_size;
    this.perlin_vectors = [ 1,1, 1,-1, -1,1, -1,-1 ];

    this.perlin_grid = []; //randomomly selected vectors
    for(var i =0; i < Math.pow(grid_size+1,2); i++) {
      this.perlin_grid.push(Math.floor(Math.random() * this.perlin_vectors.length/2));
    }

    this.buff1 = new Float32Array(2); //shared buffers to reduce allocations
    this.buff2 = new Float32Array(2);
    this.buff3 = new Float32Array(2);
    this.buff4 = new Float32Array(2);
  }

  interpolation(t) {
    return (6 * Math.pow(t, 5) - 15 * Math.pow(t, 4) + 10 * Math.pow(t, 3));
  }

  mix(x, y, a)
  {
    return (1 - a) * x + a * y;
  }

  /* Gets a perlin noise value */
  GetPerlinNoise(x, y)
  {
    var num_perlin_points = this.grid_size + 1;
    //NOTE: all vectors are almost normalized... since it is unit square
    //get P in grid
    var p = [x % this.grid_size, y % this.grid_size];

    if(p[0] < 0) p.x += PerlinGridSize;  //square it is in is one less then number of points
    if(p[1] < 0) p.y += PerlinGridSize;

    //get perlin unit cell
    var cell_x = Math.floor(p[0]);
    var cell_y = Math.floor(p[1]);

    //get vectors from edges
    var a = vec2.sub(p,[cell_x, cell_y],this.buff1);
    var b = vec2.sub(p,[cell_x + 1, cell_y],this.buff2);
    var c = vec2.sub(p,[cell_x, cell_y + 1],this.buff3);
    var d = vec2.sub(p,[cell_x + 1, cell_y + 1],this.buff4);

    //get ramdom vectors for edges
    var ga_index = this.perlin_grid[cell_x + cell_y * num_perlin_points];
    var ga = [this.perlin_vectors[ga_index*2],this.perlin_vectors[ga_index*2 + 1]];
    var gb_index = this.perlin_grid[(cell_x + 1) + cell_y * num_perlin_points];
    var gb = [this.perlin_vectors[gb_index*2],this.perlin_vectors[gb_index*2 + 1]];
    var gc_index = this.perlin_grid[cell_x + (cell_y + 1) * num_perlin_points];
    var gc = [this.perlin_vectors[gc_index*2],this.perlin_vectors[gc_index*2 + 1]];
    var gd_index = this.perlin_grid[(cell_x + 1) + (cell_y + 1) * num_perlin_points];
    var gd = [this.perlin_vectors[gd_index*2],this.perlin_vectors[gd_index*2 + 1]];


    var s = vec2.dot(a, ga);
    var t = vec2.dot(b, gb);
    var u = vec2.dot(c, gc);
    var v = vec2.dot(d, gd);

    var st = this.mix(s, t, this.interpolation(p[0] % 1));
    var vw = this.mix(u, v, this.interpolation(p[0] % 1));
    var noise = this.mix(st, vw, this.interpolation(p[1] % 1));

    return noise;
  }
}
