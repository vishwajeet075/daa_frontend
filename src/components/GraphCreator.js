import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Button, AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const StyledContainer = styled(Container)`
  padding: 20px;
  max-width: 100% !important;
`;

const CanvasContainer = styled(Box)`
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
`;

const StyledCanvas = styled.canvas`
  background: #f8f8f8;
  width: 100%;
  height: auto;
`;

const GraphCreator = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [edgeStart, setEdgeStart] = useState(null);
  const [hamiltonCycle, setHamiltonCycle] = useState([]);
  const canvasRef = useRef(null);

  const NODE_RADIUS = 25;
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const NODE_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#82E0AA', '#F1948A', '#85C1E9'
  ];

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
      const start = nodes[edge[0]];
      const end = nodes[edge[1]];

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      const isInHamiltonCycle = isEdgeInCycle(edge);
      ctx.strokeStyle = isInHamiltonCycle ? '#4CAF50' : '#999';
      ctx.lineWidth = isInHamiltonCycle ? 3 : 2;
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach((node, index) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);

      ctx.fillStyle = NODE_COLORS[index % NODE_COLORS.length];
      ctx.fill();

      ctx.strokeStyle = hamiltonCycle.includes(index) ? '#4CAF50' : '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ALPHABET[index], node.x, node.y);
    });
  }, [nodes, edges, hamiltonCycle]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  const isEdgeInCycle = (edge) => {
    if (hamiltonCycle.length < 2) return false;
    for (let i = 0; i < hamiltonCycle.length - 1; i++) {
      if (
        (hamiltonCycle[i] === edge[0] && hamiltonCycle[i + 1] === edge[1]) ||
        (hamiltonCycle[i] === edge[1] && hamiltonCycle[i + 1] === edge[0])
      ) {
        return true;
      }
    }
    if (
      (hamiltonCycle[hamiltonCycle.length - 1] === edge[0] && hamiltonCycle[0] === edge[1]) ||
      (hamiltonCycle[hamiltonCycle.length - 1] === edge[1] && hamiltonCycle[0] === edge[0])
    ) {
      return true;
    }
    return false;
  };

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    const clickedNodeIndex = nodes.findIndex(node =>
      Math.hypot(node.x - x, node.y - y) < NODE_RADIUS
    );

    if (selectedTool === 'node' && clickedNodeIndex === -1) {
      setNodes([...nodes, { x, y }]);
    } else if (selectedTool === 'edge') {
      if (clickedNodeIndex !== -1) {
        if (edgeStart === null) {
          setEdgeStart(clickedNodeIndex);
        } else if (edgeStart !== clickedNodeIndex) {
          setEdges([...edges, [edgeStart, clickedNodeIndex]]);
          setEdgeStart(null);
        }
      }
    }
  };

  const findHamiltonianCycle = async () => {
    try {
      const response = await fetch('https://daa-backend.onrender.com/find-hamilton', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: nodes.map((_, index) => ALPHABET[index]),
          links: edges.map(edge => ({
            from: ALPHABET[edge[0]],
            to: ALPHABET[edge[1]]
          }))
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
  
      if (data.cycle) {
        const cycleIndices = data.cycle.map(node => ALPHABET.indexOf(node));
        setHamiltonCycle(cycleIndices);
        alert('Hamiltonian cycle found!');
      } else {
        alert(data.message || 'No Hamiltonian cycle found in this graph');
        setHamiltonCycle([]);
      }
    } catch (error) {
      console.error('Error finding Hamiltonian cycle:', error);
      alert('Error communicating with the server');
    }
  };

  const clearGraph = () => {
    setNodes([]);
    setEdges([]);
    setEdgeStart(null);
    setHamiltonCycle([]);
    setSelectedTool(null);
  };

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawGraph();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawGraph]);

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            Graph Creator
          </Typography>
        </Toolbar>
      </AppBar>
      <StyledContainer>
        <Box display="flex" flexWrap="wrap" justifyContent="space-between" mb={2}>
          <Button
            variant={selectedTool === 'node' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => {
              setSelectedTool('node');
              setEdgeStart(null);
            }}
          >
            Add Node
          </Button>
          <Button
            variant={selectedTool === 'edge' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => {
              setSelectedTool('edge');
              setEdgeStart(null);
            }}
          >
            Add Edge
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={findHamiltonianCycle}
          >
            Find Hamiltonian Cycle
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={clearGraph}
          >
            Clear Graph
          </Button>
        </Box>

        <CanvasContainer>
          <StyledCanvas
            ref={canvasRef}
            onClick={handleCanvasClick}
          />
        </CanvasContainer>
      </StyledContainer>
    </ThemeProvider>
  );
};

export default GraphCreator;