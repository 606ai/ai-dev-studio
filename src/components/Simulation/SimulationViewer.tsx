import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Refresh,
  Save,
  Settings
} from '@mui/icons-material';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import usePhysicsSimulation from '../../hooks/usePhysicsSimulation';
import { Equipment, WindConditions, WaterConditions } from '../../services/PhysicsSimulationService';

interface SimulationViewerProps {
  initialEquipment?: Equipment;
  initialWind?: WindConditions;
  initialWater?: WaterConditions;
}

export const SimulationViewer: React.FC<SimulationViewerProps> = ({
  initialEquipment,
  initialWind,
  initialWater
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();

  const {
    isRunning,
    simulationState,
    setEquipment,
    setEnvironment,
    startSimulation,
    pauseSimulation,
    resetSimulation
  } = usePhysicsSimulation();

  const [equipment, setEquipmentState] = useState<Equipment>(initialEquipment || {
    board: {
      length: 2.5,
      width: 0.6,
      volume: 135,
      weight: 8,
      dragCoefficient: 0.1
    },
    sail: {
      size: 7.5,
      mastLength: 4.6,
      boomLength: 2,
      weight: 5,
      liftCoefficient: 1.5,
      dragCoefficient: 0.2
    },
    fin: {
      length: 40,
      area: 500,
      angle: 8,
      liftCoefficient: 1.2,
      dragCoefficient: 0.1
    }
  });

  const [windConditions, setWindConditions] = useState<WindConditions>(initialWind || {
    speed: 15,
    direction: 90,
    turbulence: 0.2,
    gustiness: 0.3
  });

  const [waterConditions, setWaterConditions] = useState<WaterConditions>(initialWater || {
    waveHeight: 0.5,
    waveDirection: 90,
    wavePeriod: 4,
    current: {
      speed: 0.5,
      direction: 45
    }
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Add camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Add renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x87ceeb); // Sky blue
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Add water plane
    const waterGeometry = new THREE.PlaneGeometry(100, 100);
    const waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x0077be,
      transparent: true,
      opacity: 0.8
    });
    const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2;
    scene.add(waterMesh);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update 3D objects based on simulation state
  useEffect(() => {
    if (!simulationState || !sceneRef.current) return;

    // Update board position and rotation
    const boardMesh = sceneRef.current.getObjectByName('board');
    if (boardMesh) {
      boardMesh.position.copy(simulationState.position as any);
      boardMesh.quaternion.copy(simulationState.rotation as any);
    }

    // Update sail position and rotation
    const sailMesh = sceneRef.current.getObjectByName('sail');
    if (sailMesh) {
      sailMesh.position.copy(simulationState.position as any);
      sailMesh.quaternion.copy(simulationState.rotation as any);
    }
  }, [simulationState]);

  const handleEquipmentChange = (newEquipment: Equipment) => {
    setEquipmentState(newEquipment);
    setEquipment(newEquipment);
  };

  const handleEnvironmentChange = (wind: WindConditions, water: WaterConditions) => {
    setWindConditions(wind);
    setWaterConditions(water);
    setEnvironment(wind, water);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Control Panel */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button
              variant="contained"
              startIcon={isRunning ? <Pause /> : <PlayArrow />}
              onClick={isRunning ? pauseSimulation : startSimulation}
            >
              {isRunning ? 'Pause' : 'Start'}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={resetSimulation}
            >
              Reset
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<Save />}
            >
              Save State
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<Settings />}
            >
              Settings
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Simulation View */}
      <Box ref={containerRef} sx={{ flex: 1, bgcolor: 'background.paper' }} />

      {/* Status Panel */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="subtitle2">Speed</Typography>
            <Typography variant="h6">
              {simulationState?.performance.speed.toFixed(1)} knots
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle2">Apparent Wind</Typography>
            <Typography variant="h6">
              {simulationState?.performance.apparentWind.speed.toFixed(1)} knots @{' '}
              {simulationState?.performance.apparentWind.angle.toFixed(0)}°
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle2">Status</Typography>
            <Typography variant="h6">
              {simulationState?.performance.planing ? 'Planing' : 'Displacement'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default SimulationViewer;
