import { useEffect, useRef, useState } from 'react';
import DataVisualizationService, {
  DataPoint,
  GpsPoint,
  WindData,
  SensorData,
  ChartOptions,
  DatasetStatistics
} from '../services/DataVisualizationService';

export const useDataVisualization = () => {
  const serviceRef = useRef<DataVisualizationService | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new DataVisualizationService();
      setIsReady(true);
    }

    return () => {
      // Cleanup charts when component unmounts
      if (serviceRef.current) {
        // Cleanup logic here if needed
      }
    };
  }, []);

  const createTimeSeriesChart = (
    data: DataPoint[],
    options: ChartOptions,
    container: HTMLElement
  ) => {
    if (!serviceRef.current) return;
    serviceRef.current.createTimeSeriesChart(data, options, container);
  };

  const createGpsTrackMap = (
    tracks: GpsPoint[],
    options: ChartOptions,
    container: HTMLElement
  ) => {
    if (!serviceRef.current) return;
    serviceRef.current.createGpsTrackMap(tracks, options, container);
  };

  const createWindRose = (
    windData: WindData[],
    options: ChartOptions,
    container: HTMLElement
  ) => {
    if (!serviceRef.current) return;
    serviceRef.current.createWindRose(windData, options, container);
  };

  const analyzeSensorData = (data: SensorData[]): DatasetStatistics | null => {
    if (!serviceRef.current) return null;
    return serviceRef.current.analyzeSensorData(data);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!serviceRef.current) return;
    serviceRef.current.exportToCSV(data, filename);
  };

  const updateChart = (chartId: string, newData: any[]) => {
    if (!serviceRef.current) return;
    serviceRef.current.updateChart(chartId, newData);
  };

  const destroyChart = (chartId: string) => {
    if (!serviceRef.current) return;
    serviceRef.current.destroyChart(chartId);
  };

  const registerChartUpdateHandler = (
    handler: (chartId: string, data: any[]) => void
  ) => {
    if (!serviceRef.current) return;
    serviceRef.current.onChartUpdate(handler);
  };

  const registerExportCompleteHandler = (handler: (filename: string) => void) => {
    if (!serviceRef.current) return;
    serviceRef.current.onExportComplete(handler);
  };

  return {
    isReady,
    createTimeSeriesChart,
    createGpsTrackMap,
    createWindRose,
    analyzeSensorData,
    exportToCSV,
    updateChart,
    destroyChart,
    registerChartUpdateHandler,
    registerExportCompleteHandler
  };
};

export default useDataVisualization;
