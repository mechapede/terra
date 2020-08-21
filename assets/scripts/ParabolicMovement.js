import { vec3 } from "../../engine/emath.js"

/* Class for splines with arc length paramertization */
export class ParabolicMovement {
  /* Creates a parabolic movement using the points
   * Assumes points are not modified during untill this class is destroyyed*/
  constructor(points, tension, resolution) {
    this.points = points; //point speeds multiple of 3 as 3d position data
    this.num_points = points.length/3;
    this.tension = tension;
    this.resolution = resolution; //subsegments used for arc length approximation
    this.speeds = new Float32Array(points.length);
    this.lengths = new Float32Array(this.num_points*resolution);

    //precompute speeds at points
    for(let i = 0; i < this.num_points; i++) {
      let prev = i - 1;
      let next = (i + 1) % this.num_points;
      if(prev < 0) prev += this.num_points;
      let factor = (0.5 * (1 - this.tension));
      this.speeds[i*3] = factor * (this.points[next*3] - this.points[prev*3]);
      this.speeds[i*3+1] = factor * (this.points[next*3+1] - this.points[prev*3+1]);
      this.speeds[i*3+2] = factor * (this.points[next*3+2] - this.points[prev*3+2]);
    }

    for(let i = 0; i < this.num_points; i++) {
      for(let j = 0; j < resolution; j++) {
        let mag = vec3.magnitude(vec3.sub(this.CalcPosition(i, (j + 1) * (1.0 / resolution)), this.CalcPosition(i, j * (1.0 / resolution)), new Float32Array(3)));
        this.lengths[i * resolution + j] = mag;
      }
    }
    
    //make it a sum so it is easier to search through 
    for(let i = 1; i < this.resolution * this.num_points; i++)
    {
      this.lengths[i] += this.lengths[i - 1];
    }
  }

  /* Functions for point finding, velocity and acceleration */
  Pos00(t) {
    return 2 * Math.pow(t, 3) - 3 * Math.pow(t, 2) + 1;
  }

  Pos01(t) {
    return -2 * Math.pow(t, 3) + 3 * Math.pow(t, 2);
  }

  Pos10(t) {
    return Math.pow(t, 3) - 2 * Math.pow(t, 2) + t;
  }

  Pos11(t) {
    return Math.pow(t, 3) - Math.pow(t, 2);
  }

  Vel00(t) { //velocity
    return 6 * Math.pow(t, 2) - 6 * t;
  }

  Vel01(t) {
    return -6 * Math.pow(t, 2) + 6 * t;
  }

  Vel10(t) {
    return 3 * Math.pow(t, 2) - 4 * t + 1;
  }

  Vel11(t) {
    return 3 * Math.pow(t, 2) - 2 * t;
  }

  Acel00(t) { //accelaration
    return 12 * t - 6;
  }

  Acel01(t) {
    return -12 * t + 6;
  }

  Acel10(t) {
    return 6 * t - 4;
  }

  Acel11(t) {
    return 6 * t - 2;
  }
  
  /* Helpers for Calculations */
  SubCalcHelper(c1, c2, c3, c4, seg, index){
    return c1*this.points[(seg*3 + index)] + 
           c2*this.points[((seg + 1)*3 + index) % this.points.length] +
           c3*this.speeds[seg*3 + index] +
           c4*this.speeds[((seg + 1)*3 + index) % this.points.length];
    
  }
  CalcHelper(c1, c2, c3, c4, seg){
    var result = new Float32Array(3);
    result[0] = this.SubCalcHelper(c1,c2,c3,c4,seg,0);
    result[1] = this.SubCalcHelper(c1,c2,c3,c4,seg,1);
    result[2] = this.SubCalcHelper(c1,c2,c3,c4,seg,2);
    return result;
  }

  /* Calc position based on t, not arc lenghth */
  CalcPosition(seg, seg_place) {
    return this.CalcHelper(this.Pos00(seg_place), this.Pos01(seg_place), this.Pos10(seg_place), this.Pos11(seg_place), seg);
  }

  /* Calc velocity based on t, not arc lenghth */
  CalcVelocity(seg, seg_place) {
    return this.CalcHelper(this.Vel00(seg_place), this.Vel01(seg_place), this.Vel10(seg_place), this.Vel11(seg_place), seg);
  }

  /* Calc acceleration based on t, not arc lenghth */
  CalcAcceleration(seg, seg_place) {
    return this.CalcHelper(this.Acel00(seg_place), this.Acel01(seg_place), this.Acel10(seg_place), this.Acel11(seg_place), seg);
  }

  /* Returns total length of path */
  GetPathLength() {
    return this.lengths[this.lengths.length - 1];
  }

  /* Retunrs where point t should be based on length of path */
  GetArcPoint(l) {
    let want_length = (l % 1) * this.lengths[this.lengths.length - 1] //between 0 and 1.. it must be
    //now find which indices it is between
    let real_point = this.GetPointFromLength(want_length) / this.num_points;
    return real_point;
  }

  /* Finds where point should be based on arclength in O(logn) time, with O(n) precomputaion */
  GetPointFromLength(l) {
    let bot = 0;
    let top = this.lengths.length - 1;

    let inter = 0;
    while(bot != top) {
      let mid = bot + Math.floor((top - bot) / 2);

      if(this.lengths[mid] <= l && l <= this.lengths[mid + 1])
      {
        inter = (l - this.lengths[mid]) / (this.lengths[mid + 1] - this.lengths[mid]);
        return (mid + inter) * (1.0 / this.resolution); //value of component
      }
      else if(this.lengths[mid] > l)
      {
        top = mid;
      }
      else //if (Lengths[mid+1] < t)
      {
        bot = mid + 1;
      }
    }

    //must be before first ellement
    inter = l / this.lengths[0];
    return inter * (1.0 / this.resolution);
  }

  /* Gets position on the spline based on t
     Use with Arclength Calc if want placement based on distance*/
  GetPoint(t) {
    let place = t % 1;
    let seg_length = 1.0 / this.num_points;
    let seg = Math.floor(place / seg_length);
    let seg_place = (place % seg_length) / seg_length; //normalize
    return this.CalcPosition(seg, seg_place);
  }

  /* Gets velocity on the spline based on t
     Use with Arclength Calc if want placement based on distance*/
  GetVelocity(t){
    let place = t % 1;
    let seg_length = 1.0 / this.num_points;
    let seg = Math.floor(place / seg_length);
    let seg_place = (place % seg_length) / seg_length; //normalize
    return this.CalcVelocity(seg, seg_place);
  }

  /* Gets acceleration on the spline based on t
     Use with Arclength Calc if want placement based on distance*/
  GetAcceleration(t){
    let place = t % 1;
    let seg_length = 1.0 / this.num_points;
    let seg = Math.floor(place / seg_length);
    let seg_place = (place % seg_length) / seg_length; //normalize
    return this.CalcAcceleration(seg, seg_place);
  }
}
