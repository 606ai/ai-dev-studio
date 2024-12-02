import { useEffect, useRef, useState } from 'react';
import PhysicsSimulationService, {
  Equipment,
  WindConditions,
  WaterConditions,
  SimulationState
} from '../services/PhysicsSimulationService';

export const usePhysicsSimulation = () => {
  const serviceRef = useRef<PhysicsSimulationService | null>(null);
  const animationFrameRef = useRef<number>();
  const [isRunning, setIsRunning] = useState(false);
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);

  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new PhysicsSimulationService();
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const setEquipment = (equipment: Equipment) => {
    if (!serviceRef.current) return;
    serviceRef.current.setEquipment(equipment);
  };

  const setEnvironment = (wind: WindConditions, water: WaterConditions) => {
    if (!serviceRef.current) return;
    serviceRef.current.setEnvironment(wind, water);
  };

  const startSimulation = () => {
    if (!serviceRef.current || isRunning) return;
    setIsRunning(true);

    const animate = () => {
      if (!serviceRef.current) return;

      const state = serviceRef.current.step();
      setSimulationState(state);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const pauseSimulation = () => {
    if (!isRunning) return;
    setIsRunning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const resetSimulation = () => {
    if (!serviceRef.current) return;
    serviceRef.current.reset();
    setSimulationState(null);
  };

  return {
    isRunning,
    simulationState,
    setEquipment,
    setEnvironment,
    startSimulation,
    pauseSimulation,
    resetSimulation
  };
};

export default usePhysicsSimulation;
