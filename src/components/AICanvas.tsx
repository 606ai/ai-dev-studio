import { FC, useEffect, useRef } from 'react';
import { Box, styled } from '@mui/material';
import * as d3 from 'd3';

const CanvasContainer = styled(Box)(({ theme }) => ({
  width: '40%',
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderLeft: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
}));

const AICanvas: FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Sample data for neural network visualization
    const nodes = [
      { id: 'input', x: 50, y: height / 2, label: 'Input' },
      { id: 'hidden1', x: width / 3, y: height / 2, label: 'Hidden 1' },
      { id: 'hidden2', x: (2 * width) / 3, y: height / 2, label: 'Hidden 2' },
      { id: 'output', x: width - 50, y: height / 2, label: 'Output' },
    ];

    const links = [
      { source: nodes[0], target: nodes[1] },
      { source: nodes[1], target: nodes[2] },
      { source: nodes[2], target: nodes[3] },
    ];

    // Draw links
    svg
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y)
      .attr('stroke', '#009ffd')
      .attr('stroke-width', 2);

    // Draw nodes
    const nodeGroups = svg
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    nodeGroups
      .append('circle')
      .attr('r', 20)
      .attr('fill', '#2a2a72')
      .attr('stroke', '#009ffd')
      .attr('stroke-width', 2);

    nodeGroups
      .append('text')
      .attr('dy', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .text((d) => d.label);
  }, []);

  return (
    <CanvasContainer>
      <Box sx={{ typography: 'h6', mb: 2 }}>AI Canvas</Box>
      <Box sx={{ flex: 1, position: 'relative' }}>
        <svg
          ref={svgRef}
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        />
      </Box>
    </CanvasContainer>
  );
};

export default AICanvas;
