import { EventEmitter } from 'events';
import * as d3 from 'd3';
import { ChartConfiguration } from 'chart.js';

export interface DataPoint {
  timestamp: number;
  value: number;
  label?: string;
  category?: string;
}

export interface GpsPoint {
  timestamp: number;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  altitude?: number;
}

export interface WindData {
  timestamp: number;
  speed: number;
  direction: number;
  gusts?: number;
}

export interface SensorData {
  timestamp: number;
  type: string;
  value: number;
  unit: string;
}

export interface ChartOptions {
  type: 'line' | 'scatter' | 'bar' | 'heatmap' | 'map';
  title?: string;
  xAxis?: {
    label: string;
    type?: 'time' | 'linear' | 'category';
  };
  yAxis?: {
    label: string;
    type?: 'linear' | 'log';
  };
  color?: string | string[];
  animate?: boolean;
}

export interface DatasetStatistics {
  count: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  quartiles: [number, number, number];
}

export class DataVisualizationService extends EventEmitter {
  private svgContainer: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private chartInstances: Map<string, any> = new Map();

  constructor() {
    super();
  }

  // Time Series Visualization
  createTimeSeriesChart(
    data: DataPoint[],
    options: ChartOptions,
    container: HTMLElement
  ): void {
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(container).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .range([height, 0]);

    // Create line
    const line = d3.line<DataPoint>()
      .x(d => x(new Date(d.timestamp)))
      .y(d => y(d.value));

    // Add line path
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', options.color || 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y));

    // Add title
    if (options.title) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 0 - margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .text(options.title);
    }

    this.svgContainer = svg;
  }

  // GPS Track Visualization
  createGpsTrackMap(
    tracks: GpsPoint[],
    options: ChartOptions,
    container: HTMLElement
  ): void {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous map
    d3.select(container).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Create projection
    const projection = d3.geoMercator()
      .fitSize([width, height], {
        type: 'LineString',
        coordinates: tracks.map(t => [t.longitude, t.latitude])
      });

    // Create path generator
    const path = d3.geoPath().projection(projection);

    // Create track line
    const lineString = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: tracks.map(t => [t.longitude, t.latitude])
      }
    };

    // Draw track
    svg.append('path')
      .datum(lineString)
      .attr('fill', 'none')
      .attr('stroke', options.color || 'red')
      .attr('stroke-width', 2)
      .attr('d', path);

    this.svgContainer = svg;
  }

  // Wind Data Visualization
  createWindRose(
    windData: WindData[],
    options: ChartOptions,
    container: HTMLElement
  ): void {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = Math.min(width, height) / 2;

    // Clear previous chart
    d3.select(container).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Process data into bins
    const bins = d3.histogram()
      .value(d => d.direction)
      .domain([0, 360])
      .thresholds(16);

    const windBins = bins(windData);

    // Create scales
    const angleScale = d3.scaleLinear()
      .domain([0, 360])
      .range([0, 2 * Math.PI]);

    const radiusScale = d3.scaleLinear()
      .domain([0, d3.max(windBins, d => d.length) || 0])
      .range([0, radius]);

    // Create wind rose segments
    svg.selectAll('path')
      .data(windBins)
      .enter()
      .append('path')
      .attr('d', d3.arc()
        .innerRadius(0)
        .outerRadius(d => radiusScale(d.length))
        .startAngle(d => angleScale(d.x0!))
        .endAngle(d => angleScale(d.x1!))
      )
      .attr('fill', options.color || 'steelblue')
      .attr('opacity', 0.7);

    this.svgContainer = svg;
  }

  // Sensor Data Analysis
  analyzeSensorData(data: SensorData[]): DatasetStatistics {
    const values = data.map(d => d.value);
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      count: values.length,
      mean: d3.mean(values) || 0,
      median: d3.median(values) || 0,
      std: d3.deviation(values) || 0,
      min: d3.min(values) || 0,
      max: d3.max(values) || 0,
      quartiles: [
        d3.quantile(sorted, 0.25) || 0,
        d3.quantile(sorted, 0.5) || 0,
        d3.quantile(sorted, 0.75) || 0
      ]
    };
  }

  // Data Export
  exportToCSV(data: any[], filename: string): void {
    const csvContent = d3.csvFormat(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Chart Management
  updateChart(chartId: string, newData: any[]): void {
    const chart = this.chartInstances.get(chartId);
    if (chart) {
      chart.data.datasets[0].data = newData;
      chart.update();
    }
  }

  destroyChart(chartId: string): void {
    const chart = this.chartInstances.get(chartId);
    if (chart) {
      chart.destroy();
      this.chartInstances.delete(chartId);
    }
  }

  // Event Handling
  onChartUpdate(handler: (chartId: string, data: any[]) => void): void {
    this.on('chartUpdate', handler);
  }

  onExportComplete(handler: (filename: string) => void): void {
    this.on('exportComplete', handler);
  }
}

export default DataVisualizationService;
