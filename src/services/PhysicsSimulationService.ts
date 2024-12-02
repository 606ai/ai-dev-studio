import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { EventEmitter } from 'events';

export interface WindConditions {
  speed: number;          // in knots
  direction: number;      // in degrees (0-360)
  turbulence: number;     // 0-1 scale
  gustiness: number;      // 0-1 scale
}

export interface WaterConditions {
  waveHeight: number;     // in meters
  waveDirection: number;  // in degrees
  wavePeriod: number;     // in seconds
  current: {
    speed: number;        // in knots
    direction: number;    // in degrees
  };
}

export interface Equipment {
  board: {
    length: number;       // in meters
    width: number;       // in meters
    volume: number;      // in liters
    weight: number;      // in kg
    dragCoefficient: number;
  };
  sail: {
    size: number;        // in square meters
    mastLength: number;  // in meters
    boomLength: number;  // in meters
    weight: number;      // in kg
    liftCoefficient: number;
    dragCoefficient: number;
  };
  fin: {
    length: number;      // in cm
    area: number;        // in square cm
    angle: number;       // in degrees
    liftCoefficient: number;
    dragCoefficient: number;
  };
}

export interface SimulationState {
  position: CANNON.Vec3;
  velocity: CANNON.Vec3;
  rotation: CANNON.Quaternion;
  angularVelocity: CANNON.Vec3;
  forces: {
    lift: CANNON.Vec3;
    drag: CANNON.Vec3;
    buoyancy: CANNON.Vec3;
    gravity: CANNON.Vec3;
  };
  performance: {
    speed: number;       // in knots
    planing: boolean;
    apparentWind: {
      speed: number;     // in knots
      angle: number;     // in degrees
    };
  };
}

export class PhysicsSimulationService extends EventEmitter {
  private world: CANNON.World;
  private boardBody: CANNON.Body;
  private sailBody: CANNON.Body;
  private finBody: CANNON.Body;
  private timeStep: number = 1/60;
  private equipment: Equipment;
  private windConditions: WindConditions;
  private waterConditions: WaterConditions;

  constructor() {
    super();
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0)
    });
    this.initializePhysicsWorld();
  }

  private initializePhysicsWorld(): void {
    // Configure world properties
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = false;
    this.world.solver.iterations = 10;

    // Add water plane
    const waterMaterial = new CANNON.Material('water');
    const waterPlane = new CANNON.Plane();
    const waterBody = new CANNON.Body({
      mass: 0,
      material: waterMaterial,
      shape: waterPlane
    });
    waterBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI/2);
    this.world.addBody(waterBody);
  }

  public setEquipment(equipment: Equipment): void {
    this.equipment = equipment;
    this.createBoardBody();
    this.createSailBody();
    this.createFinBody();
  }

  private createBoardBody(): void {
    // Create board shape
    const boardShape = new CANNON.Box(new CANNON.Vec3(
      this.equipment.board.length / 2,
      this.equipment.board.width / 2,
      0.1  // board thickness
    ));

    // Create board body
    this.boardBody = new CANNON.Body({
      mass: this.equipment.board.weight,
      shape: boardShape
    });

    // Add board to world
    this.world.addBody(this.boardBody);
  }

  private createSailBody(): void {
    // Create sail shape (simplified as rectangle)
    const sailShape = new CANNON.Box(new CANNON.Vec3(
      this.equipment.sail.boomLength / 2,
      this.equipment.sail.mastLength / 2,
      0.01  // sail thickness
    ));

    // Create sail body
    this.sailBody = new CANNON.Body({
      mass: this.equipment.sail.weight,
      shape: sailShape
    });

    // Connect sail to board with constraints
    const constraint = new CANNON.LockConstraint(this.boardBody, this.sailBody);
    this.world.addConstraint(constraint);

    // Add sail to world
    this.world.addBody(this.sailBody);
  }

  private createFinBody(): void {
    // Create fin shape
    const finShape = new CANNON.Box(new CANNON.Vec3(
      this.equipment.fin.length / 2,
      this.equipment.fin.area / this.equipment.fin.length / 2,
      0.02  // fin thickness
    ));

    // Create fin body
    this.finBody = new CANNON.Body({
      mass: 0.5,  // approximate fin weight
      shape: finShape
    });

    // Connect fin to board with constraints
    const constraint = new CANNON.LockConstraint(this.boardBody, this.finBody);
    this.world.addConstraint(constraint);

    // Add fin to world
    this.world.addBody(this.finBody);
  }

  public setEnvironment(wind: WindConditions, water: WaterConditions): void {
    this.windConditions = wind;
    this.waterConditions = water;
  }

  private calculateAerodynamicForces(): void {
    if (!this.sailBody || !this.windConditions) return;

    // Calculate apparent wind
    const boardVelocity = this.boardBody.velocity;
    const trueWind = new CANNON.Vec3(
      this.windConditions.speed * Math.cos(this.windConditions.direction * Math.PI/180),
      0,
      this.windConditions.speed * Math.sin(this.windConditions.direction * Math.PI/180)
    );
    const apparentWind = trueWind.vsub(boardVelocity);

    // Calculate sail angle of attack
    const sailNormal = new CANNON.Vec3(0, 0, 1).transformQuat(this.sailBody.quaternion);
    const angleOfAttack = Math.acos(sailNormal.dot(apparentWind.unit()));

    // Calculate lift and drag coefficients
    const liftCoeff = this.equipment.sail.liftCoefficient * Math.sin(2 * angleOfAttack);
    const dragCoeff = this.equipment.sail.dragCoefficient * Math.sin(angleOfAttack);

    // Apply forces
    const airDensity = 1.225;  // kg/m³
    const sailArea = this.equipment.sail.size;
    const dynamicPressure = 0.5 * airDensity * apparentWind.lengthSquared();

    const liftForce = sailNormal.cross(apparentWind).unit().scale(liftCoeff * dynamicPressure * sailArea);
    const dragForce = apparentWind.unit().scale(dragCoeff * dynamicPressure * sailArea);

    this.sailBody.applyForce(liftForce);
    this.sailBody.applyForce(dragForce);
  }

  private calculateHydrodynamicForces(): void {
    if (!this.boardBody || !this.waterConditions) return;

    // Calculate board wetted surface
    const waterline = 0;  // Simplified - assume water at y=0
    const immersionDepth = Math.max(0, waterline - this.boardBody.position.y);
    const wettedArea = this.equipment.board.length * this.equipment.board.width * (immersionDepth / 0.1);

    // Calculate water velocity relative to board
    const waterVelocity = new CANNON.Vec3(
      this.waterConditions.current.speed * Math.cos(this.waterConditions.current.direction * Math.PI/180),
      0,
      this.waterConditions.current.speed * Math.sin(this.waterConditions.current.direction * Math.PI/180)
    );
    const relativeVelocity = this.boardBody.velocity.vsub(waterVelocity);

    // Calculate hydrodynamic forces
    const waterDensity = 1000;  // kg/m³
    const dynamicPressure = 0.5 * waterDensity * relativeVelocity.lengthSquared();
    const dragForce = relativeVelocity.unit().scale(-this.equipment.board.dragCoefficient * dynamicPressure * wettedArea);

    // Apply forces
    this.boardBody.applyForce(dragForce);

    // Calculate buoyancy
    const buoyancyForce = new CANNON.Vec3(0, waterDensity * 9.82 * this.equipment.board.volume * (immersionDepth / 0.1), 0);
    this.boardBody.applyForce(buoyancyForce);
  }

  private calculateFinForces(): void {
    if (!this.finBody || !this.waterConditions) return;

    // Calculate fin angle of attack relative to water flow
    const finNormal = new CANNON.Vec3(0, 1, 0).transformQuat(this.finBody.quaternion);
    const waterVelocity = this.boardBody.velocity.negate();
    const angleOfAttack = Math.acos(finNormal.dot(waterVelocity.unit()));

    // Calculate lift and drag coefficients
    const liftCoeff = this.equipment.fin.liftCoefficient * Math.sin(2 * angleOfAttack);
    const dragCoeff = this.equipment.fin.dragCoefficient * Math.sin(angleOfAttack);

    // Apply forces
    const waterDensity = 1000;  // kg/m³
    const finArea = this.equipment.fin.area / 10000;  // convert from cm² to m²
    const dynamicPressure = 0.5 * waterDensity * waterVelocity.lengthSquared();

    const liftForce = finNormal.cross(waterVelocity).unit().scale(liftCoeff * dynamicPressure * finArea);
    const dragForce = waterVelocity.unit().scale(dragCoeff * dynamicPressure * finArea);

    this.finBody.applyForce(liftForce);
    this.finBody.applyForce(dragForce);
  }

  public step(): SimulationState {
    // Calculate and apply forces
    this.calculateAerodynamicForces();
    this.calculateHydrodynamicForces();
    this.calculateFinForces();

    // Step the physics world
    this.world.step(this.timeStep);

    // Calculate performance metrics
    const speed = this.boardBody.velocity.length() * 1.944;  // convert m/s to knots
    const planing = speed > 8;  // simplified planing threshold

    // Calculate apparent wind
    const trueWind = new CANNON.Vec3(
      this.windConditions.speed * Math.cos(this.windConditions.direction * Math.PI/180),
      0,
      this.windConditions.speed * Math.sin(this.windConditions.direction * Math.PI/180)
    );
    const apparentWind = trueWind.vsub(this.boardBody.velocity);
    const apparentWindSpeed = apparentWind.length() * 1.944;  // convert to knots
    const apparentWindAngle = Math.atan2(apparentWind.z, apparentWind.x) * 180/Math.PI;

    // Return current simulation state
    return {
      position: this.boardBody.position,
      velocity: this.boardBody.velocity,
      rotation: this.boardBody.quaternion,
      angularVelocity: this.boardBody.angularVelocity,
      forces: {
        lift: new CANNON.Vec3(),  // TODO: Add force vectors
        drag: new CANNON.Vec3(),
        buoyancy: new CANNON.Vec3(),
        gravity: new CANNON.Vec3(0, -9.82 * this.boardBody.mass, 0)
      },
      performance: {
        speed,
        planing,
        apparentWind: {
          speed: apparentWindSpeed,
          angle: apparentWindAngle
        }
      }
    };
  }

  public reset(): void {
    // Reset board position and velocity
    this.boardBody.position.set(0, 0, 0);
    this.boardBody.velocity.set(0, 0, 0);
    this.boardBody.angularVelocity.set(0, 0, 0);
    this.boardBody.quaternion.set(0, 0, 0, 1);

    // Reset sail position and velocity
    this.sailBody.position.set(0, 0, 0);
    this.sailBody.velocity.set(0, 0, 0);
    this.sailBody.angularVelocity.set(0, 0, 0);
    this.sailBody.quaternion.set(0, 0, 0, 1);

    // Reset fin position and velocity
    this.finBody.position.set(0, 0, 0);
    this.finBody.velocity.set(0, 0, 0);
    this.finBody.angularVelocity.set(0, 0, 0);
    this.finBody.quaternion.set(0, 0, 0, 1);
  }

  public dispose(): void {
    this.world.removeBody(this.boardBody);
    this.world.removeBody(this.sailBody);
    this.world.removeBody(this.finBody);
    this.removeAllListeners();
  }
}

export default PhysicsSimulationService;
