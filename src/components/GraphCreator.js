import React, { useState, useRef, useEffect } from 'react';

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

  const styles = {
    container: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
    },
    toolbox: {
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
    },
    button: {
      padding: '10px 15px',
      fontSize: '14px',
      cursor: 'pointer',
      border: 'none',
      borderRadius: '5px',
      transition: 'all 0.3s',
      backgroundColor: '#f0f0f0',
      color: '#333',
    },
    activeButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
    },
    canvasContainer: {
      border: '2px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    canvas: {
      background: '#f8f8f8',
    },
  };

  useEffect(() => {
    drawGraph();
  }, [nodes, edges, hamiltonCycle]);

  const drawGraph = () => {
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
  };

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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
        setHamiltonCycle([]);  // Clear any previously found cycle
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

  return (
    <div style={styles.container}>
      <div style={styles.toolbox}>
        <button
          style={{
            ...styles.button,
            ...(selectedTool === 'node' ? styles.activeButton : {})
          }}
          onClick={() => {
            setSelectedTool('node');
            setEdgeStart(null);
          }}
        >
          Add Node
        </button>
        <button
          style={{
            ...styles.button,
            ...(selectedTool === 'edge' ? styles.activeButton : {})
          }}
          onClick={() => {
            setSelectedTool('edge');
            setEdgeStart(null);
          }}
        >
          Add Edge
        </button>
        <button
          style={styles.button}
          onClick={findHamiltonianCycle}
        >
          Find Hamiltonian Cycle
        </button>
        <button
          style={styles.button}
          onClick={clearGraph}
        >
          Clear Graph
        </button>
      </div>

      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          style={styles.canvas}
        />
      </div>
    </div>
  );
};

export default GraphCreator;