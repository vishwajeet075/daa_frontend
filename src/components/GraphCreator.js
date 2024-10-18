import React, { useState, useRef, useEffect } from 'react';

const GraphCreator = () => {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [linkStart, setLinkStart] = useState(null);
  const [hamiltonCycle, setHamiltonCycle] = useState([]);
  const canvasRef = useRef(null);

  const NODE_RADIUS = 25;
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const styles = {
    container: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    },
    toolbox: {
      marginBottom: '20px',
      padding: '10px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    toolButton: {
      padding: '8px 16px',
      margin: '0 10px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      backgroundColor: '#fff',
      border: '1px solid #ddd',
    },
    activeButton: {
      backgroundColor: '#0066cc',
      color: '#fff',
      border: '1px solid #0066cc',
    },
    canvasContainer: {
      border: '2px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden',
    },
    canvas: {
      background: '#fff',
    },
    findButton: {
      padding: '10px 20px',
      backgroundColor: '#28a745',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      marginTop: '20px',
    },
    clearButton: {
      padding: '10px 20px',
      backgroundColor: '#dc3545',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      marginTop: '20px',
      marginLeft: '10px',
    },
  };

  useEffect(() => {
    drawGraph();
  }, [nodes, links, hamiltonCycle]);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw links
    links.forEach(link => {
      const start = nodes[link.from];
      const end = nodes[link.to];
      
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      
      const isInHamiltonCycle = isLinkInCycle(link);
      ctx.strokeStyle = isInHamiltonCycle ? '#28a745' : '#666';
      ctx.lineWidth = isInHamiltonCycle ? 3 : 2;
      ctx.stroke();

      // Draw cost
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      // Draw cost background
      ctx.fillStyle = '#fff';
      const costText = link.cost.toString();
      const textMetrics = ctx.measureText(costText);
      const padding = 4;
      ctx.fillRect(
        midX - textMetrics.width/2 - padding,
        midY - 10 - padding,
        textMetrics.width + padding*2,
        20 + padding*2
      );

      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(costText, midX, midY);
    });

    // Draw nodes
    nodes.forEach((node, index) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
      
      // Fill with white or highlight if part of Hamilton cycle
      ctx.fillStyle = hamiltonCycle.includes(index) ? '#e6ffe6' : '#fff';
      ctx.fill();
      
      ctx.strokeStyle = hamiltonCycle.includes(index) ? '#28a745' : '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ALPHABET[index], node.x, node.y);
    });

    // Draw line preview when creating a link
    if (selectedTool === 'link' && linkStart !== null) {
      const start = nodes[linkStart];
      const rect = canvas.getBoundingClientRect();
      const mouseX = lastMousePos.x - rect.left;
      const mouseY = lastMousePos.y - rect.top;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(mouseX, mouseY);
      ctx.strokeStyle = '#999';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setLastMousePos({ x: e.clientX, y: e.clientY });
    if (selectedTool === 'link' && linkStart !== null) {
      drawGraph();
    }
  };

  const isLinkInCycle = (link) => {
    if (hamiltonCycle.length < 2) return false;
    for (let i = 0; i < hamiltonCycle.length - 1; i++) {
      if (
        (hamiltonCycle[i] === link.from && hamiltonCycle[i + 1] === link.to) ||
        (hamiltonCycle[i] === link.to && hamiltonCycle[i + 1] === link.from)
      ) {
        return true;
      }
    }
    // Check connection between last and first node
    if (
      (hamiltonCycle[hamiltonCycle.length - 1] === link.from && hamiltonCycle[0] === link.to) ||
      (hamiltonCycle[hamiltonCycle.length - 1] === link.to && hamiltonCycle[0] === link.from)
    ) {
      return true;
    }
    return false;
  };

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on existing node
    const clickedNodeIndex = nodes.findIndex(node =>
      Math.hypot(node.x - x, node.y - y) < NODE_RADIUS
    );

    if (selectedTool === 'node' && clickedNodeIndex === -1) {
      // Add new node
      setNodes([...nodes, { x, y }]);
    } else if (selectedTool === 'link') {
      if (clickedNodeIndex !== -1) {
        if (linkStart === null) {
          setLinkStart(clickedNodeIndex);
        } else if (linkStart !== clickedNodeIndex) {
          // Prompt for cost
          const cost = prompt('Enter cost for this link:', '1');
          if (cost !== null) {
            const numericCost = parseInt(cost) || 1;
            setLinks([...links, {
              from: linkStart,
              to: clickedNodeIndex,
              cost: numericCost
            }]);
          }
          setLinkStart(null);
        }
      }
    }
  };

  const findHamiltonianCycle = async () => {
    try {
      const response = await fetch('http://localhost:8000/find-hamilton', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: nodes.map((_, index) => ALPHABET[index]),
          links: links.map(link => ({
            from: ALPHABET[link.from],
            to: ALPHABET[link.to],
            cost: link.cost
          }))
        }),
      });
      
      const data = await response.json();
      if (data.cycle) {
        // Convert letters back to indices
        const cycleIndices = data.cycle.map(node => 
          ALPHABET.indexOf(node)
        );
        setHamiltonCycle(cycleIndices);
      } else {
        alert('No Hamiltonian cycle found in this graph');
        setHamiltonCycle([]);
      }
    } catch (error) {
      console.error('Error finding Hamiltonian cycle:', error);
      alert('Error communicating with the server');
    }
  };

  const clearGraph = () => {
    setNodes([]);
    setLinks([]);
    setLinkStart(null);
    setHamiltonCycle([]);
    setSelectedTool(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.toolbox}>
        <button
          style={{
            ...styles.toolButton,
            ...(selectedTool === 'node' ? styles.activeButton : {})
          }}
          onClick={() => {
            setSelectedTool('node');
            setLinkStart(null);
          }}
        >
          Add Node
        </button>
        <button
          style={{
            ...styles.toolButton,
            ...(selectedTool === 'link' ? styles.activeButton : {})
          }}
          onClick={() => {
            setSelectedTool('link');
            setLinkStart(null);
          }}
        >
          Add Link
        </button>
      </div>

      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          style={styles.canvas}
        />
      </div>

      <button
        style={styles.findButton}
        onClick={findHamiltonianCycle}
      >
        Find Hamiltonian Cycle
      </button>
      <button
        style={styles.clearButton}
        onClick={clearGraph}
      >
        Clear Graph
      </button>
    </div>
  );
};

export default GraphCreator;