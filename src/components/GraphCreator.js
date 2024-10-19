import React, { useState, useRef, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  Button,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import TimelineIcon from "@mui/icons-material/Timeline";
import ClearIcon from "@mui/icons-material/Clear";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { jsPDF } from "jspdf";
import axios from "axios";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2196f3",
    },
    secondary: {
      main: "#ff4081",
    },
    background: {
      default: "#f5f5f5",
    },
  },
});

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${theme.palette.background.default};
`;

const StyledAppBar = styled(AppBar)`
  background-color: ${theme.palette.primary.main};
`;

const Content = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
`;

const CanvasContainer = styled.div`
  flex-grow: 1;
  position: relative;
  border: 2px solid ${theme.palette.primary.main};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
  margin-bottom: 20px;
`;

const StyledCanvas = styled.canvas`
  width: 100%;
  height: 100%;
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
`;

const CyclePathText = styled(Typography)`
  margin-top: 10px;
  font-weight: bold;
  text-align: center;
`;

const GraphCreator = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [edgeStart, setEdgeStart] = useState(null);
  const [hamiltonCycle, setHamiltonCycle] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [cyclePathText, setCyclePathText] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const canvasRef = useRef(null);

  const NODE_RADIUS = 20;
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const NODE_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
    "#F7DC6F", "#BB8FCE", "#82E0AA", "#F1948A", "#85C1E9",
  ];


    // Send graph data to the backend
    const checkHamiltonianCycle = async () => {
      try {

        // Log nodes and edges for inspection
    console.log("Nodes:", nodes);
    console.log("Edges:", edges);
    
        const response = await axios.post("https://daa-backend.onrender.com/find-hamilton", {
          nodes,
          edges,
        });
        const { cycle, cycleText } = response.data;

          // Log cycle to console for debugging
    console.log("Hamiltonian Cycle Path received from backend:", cycle);
  
        if (cycle.length > 0) {
          setHamiltonCycle(cycle);
          setCyclePathText(cycleText);
        } else {
          setHamiltonCycle([]);
          setCyclePathText("No Hamiltonian Cycle found.");
        }
      } catch (error) {
        console.error("Error checking Hamiltonian Cycle:", error);
      }
    };

  const isEdgeInCycle = useCallback(
    (edge) => {
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
        (hamiltonCycle[hamiltonCycle.length - 1] === edge[0] &&
          hamiltonCycle[0] === edge[1]) ||
        (hamiltonCycle[hamiltonCycle.length - 1] === edge[1] &&
          hamiltonCycle[0] === edge[0])
      ) {
        return true;
      }
      return false;
    },
    [hamiltonCycle]
  );

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach((edge, index) => {
      const start = nodes[edge[0]];
      const end = nodes[edge[1]];

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      const isInHamiltonCycle = isEdgeInCycle(edge);
      ctx.strokeStyle = isInHamiltonCycle ? "#4CAF50" : "#999";
      ctx.lineWidth = isInHamiltonCycle ? 3 : 2;
      ctx.stroke();

      // Draw arrow for direction
      if (isInHamiltonCycle) {
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        ctx.save();
        ctx.translate(end.x, end.y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-10, 5);
        ctx.fillStyle = "#4CAF50";
        ctx.fill();
        ctx.restore();
      }

      // Draw edge label
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      ctx.fillStyle =
        selectedElement &&
        selectedElement.type === "edge" &&
        selectedElement.index === index
          ? "red"
          : "#666";
      ctx.font = "12px Arial";
      ctx.fillText(`${ALPHABET[edge[0]]}${ALPHABET[edge[1]]}`, midX, midY);
    });

    // Draw nodes
    nodes.forEach((node, index) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);

      ctx.fillStyle = NODE_COLORS[index % NODE_COLORS.length];
      ctx.fill();

      ctx.strokeStyle = hamiltonCycle.includes(index) ? "#4CAF50" : "#333";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ALPHABET[index], node.x, node.y);

      // Highlight selected node
      if (
        selectedElement &&
        selectedElement.type === "node" &&
        selectedElement.index === index
      ) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    // eslint-disable-next-line
  }, [nodes, edges, hamiltonCycle, selectedElement, isEdgeInCycle]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    const clickedNodeIndex = nodes.findIndex(
      (node) => Math.hypot(node.x - x, node.y - y) < NODE_RADIUS
    );

    if (selectedTool === "node" && clickedNodeIndex === -1) {
      setNodes([...nodes, { x, y }]);
    } else if (selectedTool === "edge") {
      if (clickedNodeIndex !== -1) {
        if (edgeStart === null) {
          setEdgeStart(clickedNodeIndex);
        } else if (edgeStart !== clickedNodeIndex) {
          setEdges([...edges, [edgeStart, clickedNodeIndex]]);
          setEdgeStart(null);
        }
      }
    } else {
      if (clickedNodeIndex !== -1) {
        setSelectedElement({ type: "node", index: clickedNodeIndex });
      } else {
        const clickedEdgeIndex = edges.findIndex((edge) => {
          const start = nodes[edge[0]];
          const end = nodes[edge[1]];
          const d = distToSegment({ x, y }, start, end);
          return d < 10; // Adjust this value to change edge selection sensitivity
        });
        if (clickedEdgeIndex !== -1) {
          setSelectedElement({ type: "edge", index: clickedEdgeIndex });
        } else {
          setSelectedElement(null);
        }
      }
    }
  };

  const distToSegment = (p, v, w) => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(
      p.x - (v.x + t * (w.x - v.x)),
      p.y - (v.y + t * (w.y - v.y))
    );
  };

  const deleteElement = () => {
    if (!selectedElement) return;

    if (selectedElement.type === "node") {
      const nodeIndex = selectedElement.index;
      setNodes(nodes.filter((_, index) => index !== nodeIndex));
      setEdges(
        edges
          .filter((edge) => edge[0] !== nodeIndex && edge[1] !== nodeIndex)
          .map((edge) =>
            edge.map((i) => (i > nodeIndex ? i - 1 : i)) // Adjust remaining edges
          )
      );
      setSelectedElement(null);
    } else if (selectedElement.type === "edge") {
      const edgeIndex = selectedElement.index;
      setEdges(edges.filter((_, index) => index !== edgeIndex));
      setSelectedElement(null);
    }
  };

  const handleMenuOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const canvas = canvasRef.current;
    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    doc.addImage(imgData, "JPEG", 10, 10, 180, 160);
    doc.save("graph.pdf");
  };

  return (
    <ThemeProvider theme={theme}>
      <AppContainer>
        <StyledAppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Graph Creator
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={handleMenuOpen}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleDownloadPDF}>Download as PDF</MenuItem>
            </Menu>
          </Toolbar>
        </StyledAppBar>
        <Content>
          <ControlsContainer>
            <Button
              variant="contained"
              color={selectedTool === "node" ? "secondary" : "primary"}
              startIcon={<AddCircleOutlineIcon />}
              onClick={() =>
                setSelectedTool(selectedTool === "node" ? null : "node")
              }
            >
              Add Node
            </Button>
            <Button
              variant="contained"
              color={selectedTool === "edge" ? "secondary" : "primary"}
              startIcon={<TimelineIcon />}
              onClick={() =>
                setSelectedTool(selectedTool === "edge" ? null : "edge")
              }
            >
              Add Edge
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={checkHamiltonianCycle}
            >
              Check Hamiltonian Cycle
            </Button>

            <Button
              variant="contained"
              color="secondary"
              startIcon={<DeleteIcon />}
              onClick={deleteElement}
            >
              Delete
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ClearIcon />}
              onClick={() => {
                setNodes([]);
                setEdges([]);
                setHamiltonCycle([]);
                setCyclePathText("");
              }}
            >
              Clear
            </Button>
          </ControlsContainer>
          <CanvasContainer>
            <StyledCanvas
              ref={canvasRef}
              width={800}
              height={600}
              onClick={handleCanvasClick}
            />
          </CanvasContainer>
          {cyclePathText && (
            <CyclePathText variant="body1">{cyclePathText}</CyclePathText>
          )}
        </Content>
      </AppContainer>
    </ThemeProvider>
  );
};

export default GraphCreator;
