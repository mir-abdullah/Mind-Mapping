import React, { useState } from "react";
import { Stage, Layer, Line, Circle, Text } from "react-konva";
import { useDispatch, useSelector } from "react-redux";
import { addNode, updateNode, deleteNode, setNodes } from "./slices/nodesSlice";
import {
  addConnection,
  deleteConnection,
  updateConnection,
  setConnections,
} from "./slices/connectionsSlice";
import { useRef } from "react";
import RoundedRectangleNode from "./RoundedRectangleNode";
import { getConnectionPoints } from "./utils";
import CustomModal from "./CustomModal";
import logo from "./assets/mind-mapping.png";

const App = () => {
  const nodes = useSelector((state) => state.nodes);
  const connections = useSelector((state) => state.connections);
  const dispatch = useDispatch();
  const stageRef = useRef(null);

  // Undo/Redo history states
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [selectedId, selectShape] = React.useState(null);
  const [modalIsOpen, setModalIsOpen] = React.useState(false);
  const [nodeData, setNodeData] = React.useState({
    text: "",
    additionalText: "",
  });
  const [editingNodeId, setEditingNodeId] = React.useState(null);
  const [lineType, setLineType] = React.useState("Straight Line");
  const [labelModalIsOpen, setLabelModalIsOpen] = React.useState(false);
  const [selectedConnection, setSelectedConnection] = React.useState(null);
  const [connectionLabel, setConnectionLabel] = React.useState("");
  const [modalType, setModalType] = React.useState("add");
  const [parentNodeId, setParentNodeId] = React.useState(null);
  const [lastUndo, setLastUndo] = useState(null);

  // Save to history function
  const saveToHistory = (
    nodesToSave = nodes,
    connectionsToSave = connections
  ) => {
    const currentState = {
      nodes: [...nodesToSave],
      connections: [...connectionsToSave],
    };

    const newHistory = history.slice(0, historyIndex + 1); // Trim history to current index
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1); // Set index to the last element
  };

  // Handle undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const currentState = {
        nodes: [...nodes],
        connections: [...connections],
      };
      setLastUndo(currentState); // Store current state before undoing

      const previousState = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      dispatch(setNodes(previousState.nodes));
      dispatch(setConnections(previousState.connections));
    }
  };

  // Handle redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      dispatch(setNodes(nextState.nodes));
      dispatch(setConnections(nextState.connections));

      setLastUndo(null); // Clear last undo since redo is performed

      console.log("Redo performed");
      console.log("History Index after redo:", historyIndex);
      console.log("Restored Nodes:", nextState.nodes);
      console.log("Restored Connections:", nextState.connections);
    } else {
      console.log("Redo not possible - history index out of bounds");
    }
  };

  const handleUndoLastUndo = () => {
    if (lastUndo) {
      setHistoryIndex(historyIndex + 1);
      dispatch(setNodes(lastUndo.nodes));
      dispatch(setConnections(lastUndo.connections));
      setLastUndo(null); // Clear last undo after performing the action
    }
  };

  React.useEffect(() => {
    // Save to history on initial load only once, when history is empty
    if (historyIndex === -1) {
      saveToHistory();
    }
  }, []); // Empty dependency array to only run on mount

  React.useEffect(() => {
    if (historyIndex === history.length - 1) return; // Prevent saving to history if undoing/redoing

    saveToHistory(); // Save to history every time nodes or connections change
  }, [nodes, connections]);

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
      setEditingNodeId(null);
      setSelectedConnection(null);
    }
  };

  // Function to get the hierarchy level (0 for parent, 1 for child, 2 for grandchild)
  const getNodeLevel = (nodeId) => {
    if (nodeId === nodes[0]?.id) return 0; // Parent node
    const parentConnections = connections.filter((conn) => conn.to === nodeId);
    if (parentConnections.length > 0) {
      const parentId = parentConnections[0].from;
      if (parentId === nodes[0]?.id) return 1; // Child node
      const grandParentConnections = connections.filter(
        (conn) => conn.to === parentId
      );
      if (grandParentConnections.length > 0) {
        return 2; // Grandchild node
      }
    }
    return null; // No level found (not connected to the main hierarchy)
  };

  const handleZoom = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const scaleBy = 1.05;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.3, Math.min(2, newScale)); // Limit zoom scale between 0.5 and 2

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
    stage.batchDraw();
  };

  const handleAddNode = () => {
    const newNodeId = `node${nodes.length + 1}`;
    let newX, newY, nodeColor;

    // Check if this is the first node
    if (nodes.length === 0) {
      // Position the first node in the center of the screen
      newX = (window.innerWidth - 200) / 2;
      newY = (window.innerHeight - 200) / 2;
      nodeColor = "blue";
    } else if (parentNodeId) {
      const parentNode = nodes.find((n) => n.id === parentNodeId);
      // Position the new node further away from the parent node
      newX = parentNode.x + (Math.random() - 0.5) * 300; // Increased distance
      newY = parentNode.y + parentNode.height + 100 + Math.random() * 50; // Increased distance

      const parentNodeIsRoot = nodes[0] && nodes[0].id === parentNodeId;
      nodeColor = parentNodeIsRoot ? "green" : "#a89b32";
    } else {
      newX = Math.random() * (window.innerWidth - 200) + 100;
      newY = Math.random() * (window.innerHeight - 200) + 100;
      nodeColor = "blue";
    }

    const newNode = {
      x: newX,
      y: newY,
      width: Math.max(100, nodeData.text.length * 10),
      height: 50,
      fill: nodeColor,
      id: newNodeId,
      text: nodeData.text,
      additionalText: nodeData.additionalText,
    };

    dispatch(addNode(newNode));

    // Calculate the control points for the connection line
    if (parentNodeId || selectedId) {
      const fromNode = nodes.find((n) => n.id === (parentNodeId || selectedId));
      const initialX1 = fromNode.x + fromNode.width / 2;
      const initialY1 = fromNode.y + fromNode.height / 2;
      const initialX2 = newNode.x + newNode.width / 2;
      const initialY2 = newNode.y + newNode.height / 2;

      // Adjust the control points to avoid line passing through the node
      const controlPointOffsetX = (initialX2 - initialX1) / 2;
      const controlPointOffsetY = (initialY2 - initialY1) / 2;

      dispatch(
        addConnection({
          from: parentNodeId || selectedId,
          to: newNode.id,
          type: lineType,
          label: "",
          controlPoint1: {
            x: initialX1 + controlPointOffsetX,
            y: initialY1 - controlPointOffsetY,
          },
          controlPoint2: {
            x: initialX2 - controlPointOffsetX,
            y: initialY2 + controlPointOffsetY,
          },
        })
      );
    }

    saveToHistory();

    selectShape(newNodeId);
    setModalIsOpen(false);
    setNodeData({ text: "", additionalText: "" });
    setParentNodeId(null);
  };

  const handleEditNode = (nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    setNodeData({ text: node.text, additionalText: node.additionalText || "" });
    setEditingNodeId(nodeId);
    setModalType("edit");
    setModalIsOpen(true);
  };

  const handleUpdateNode = () => {
    dispatch(updateNode({ ...nodeData, id: editingNodeId }));
    saveToHistory();
    setModalIsOpen(false);
    setNodeData({ text: "", additionalText: "" });
    setEditingNodeId(null);
  };

  const handleDeleteNode = () => {
    if (editingNodeId) {
      dispatch(deleteNode(editingNodeId));
      dispatch(deleteConnection(editingNodeId));
      saveToHistory();
      setModalIsOpen(false);
      selectShape(null);
    }
  };

  const handleSaveLabel = () => {
    dispatch(
      updateConnection({
        ...selectedConnection,
        label: connectionLabel,
        type: lineType, // Update the connection type
      })
    );
    saveToHistory();
    setLabelModalIsOpen(false);
    setConnectionLabel("");
  };

  const handleSelectNode = (nodeId) => {
    selectShape(nodeId);
  };

  const handleDeleteLabel = () => {
    dispatch(updateConnection({ ...selectedConnection, label: "" }));
    saveToHistory();
    setLabelModalIsOpen(false);
    setConnectionLabel("");
  };

  const handleDragEnd = (draggedNodeId, newX, newY) => {
    const draggedNode = nodes.find((node) => node.id === draggedNodeId);

    const overlappingNode = nodes.find((node) => {
      if (node.id === draggedNodeId) return false;

      const isOverlapping =
        newX + draggedNode.width > node.x &&
        newX < node.x + node.width &&
        newY + draggedNode.height > node.y &&
        newY < node.y + node.height;

      return isOverlapping;
    });

    if (overlappingNode) {
      const offsetX =
        Math.random() > 0.5
          ? draggedNode.width + 20
          : -(draggedNode.width + 20);
      const offsetY =
        Math.random() > 0.5
          ? draggedNode.height + 20
          : -(draggedNode.height + 20);

      const adjustedX = overlappingNode.x + offsetX;
      const adjustedY = overlappingNode.y + offsetY;

      const updatedNode = {
        ...draggedNode,
        x: adjustedX,
        y: adjustedY,
      };

      dispatch(updateNode(updatedNode));

      dispatch(deleteConnection(draggedNode.id));
      dispatch(
        addConnection({
          from: overlappingNode.id,
          to: draggedNode.id,
          type: lineType,
          label: "",
        })
      );
    } else {
      dispatch(updateNode({ ...draggedNode, x: newX, y: newY }));
    }
  };

  const handleDotDragEnd = (connection, newX, newY) => {
    const childNode = nodes.find((node) => node.id === connection.to);

    const overlappingNode = nodes.find((node) => {
      if (node.id === childNode.id) return false;

      const isOverlapping =
        newX > node.x &&
        newX < node.x + node.width &&
        newY > node.y &&
        newY < node.y + node.height;

      return isOverlapping;
    });

    if (overlappingNode) {
      dispatch(deleteConnection(connection.to)); // Remove old connection

      // Update the connection to point to the new parent node
      dispatch(
        addConnection({
          from: overlappingNode.id,
          to: childNode.id,
          type: lineType,
          label: "",
          controlPoint1: connection.controlPoint1, // Persist control points
          controlPoint2: connection.controlPoint2,
        })
      );

      // Update the child node's position relative to the new parent
      const offsetX = Math.random() * 50 - 25;
      const offsetY = overlappingNode.height + 50 + Math.random() * 50;

      const updatedChildNode = {
        ...childNode,
        x: overlappingNode.x + offsetX,
        y: overlappingNode.y + offsetY,
      };
      dispatch(updateNode(updatedChildNode));
    }
  };

  const DraggableLine = ({ connection, fromNode, toNode }) => {
    const [controlPoint1, setControlPoint1] = useState(
      connection.controlPoint1 ||
        calculateInitialControlPoint(fromNode, toNode, true)
    );
    const [controlPoint2, setControlPoint2] = useState(
      connection.controlPoint2 ||
        calculateInitialControlPoint(fromNode, toNode, false)
    );

    // Calculate initial control points
    const calculateInitialControlPoint = (from, to, isFirst) => {
      const fromX = from.x + from.width / 2;
      const fromY = from.y + from.height / 2;
      const toX = to.x + to.width / 2;
      const toY = to.y + to.height / 2;

      const deltaX = toX - fromX;
      const deltaY = toY - fromY;

      if (connection.type === "Angled Line") {
        const midX = fromX + deltaX * 0.5;
        const midY = fromY;
        return { x: midX, y: midY };
      } else {
        return isFirst
          ? { x: fromX + deltaX * 0.25, y: fromY - deltaY * 0.25 }
          : { x: fromX + deltaX * 0.75, y: fromY + deltaY * 0.75 };
      }
    };

    const handleDragEnd1 = (e) => {
      const newControlPoint1 = { x: e.target.x(), y: e.target.y() };
      setControlPoint1(newControlPoint1);

      dispatch(
        updateConnection({
          ...connection,
          controlPoint1: newControlPoint1,
        })
      );
    };

    const handleDragEnd2 = (e) => {
      const newControlPoint2 = { x: e.target.x(), y: e.target.y() };
      setControlPoint2(newControlPoint2);

      dispatch(
        updateConnection({
          ...connection,
          controlPoint2: newControlPoint2,
        })
      );
    };

    const getPointsForLineType = () => {
      const fromX = fromNode.x + fromNode.width / 2;
      const fromY = fromNode.y + fromNode.height / 2;
      const toX = toNode.x + toNode.width / 2;
      const toY = toNode.y + toNode.height / 2;

      const deltaX = toX - fromX;
      const deltaY = toY - fromY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const offsetX = (deltaX / distance) * (fromNode.width / 2);
      const offsetY = (deltaY / distance) * (fromNode.height / 2);

      const adjustedFromX = fromX + offsetX;
      const adjustedFromY = fromY + offsetY;
      const adjustedToX = toX - offsetX;
      const adjustedToY = toY - offsetY;

      switch (connection.type) {
        case "Straight Line":
          return [adjustedFromX, adjustedFromY, adjustedToX, adjustedToY];
        case "Curved Line":
          return [
            adjustedFromX,
            adjustedFromY,
            controlPoint1.x,
            controlPoint1.y,
            controlPoint2.x,
            controlPoint2.y,
            adjustedToX,
            adjustedToY,
          ];
        case "Angled Line":
          return [
            adjustedFromX,
            adjustedFromY,
            controlPoint1.x,
            adjustedFromY, // Ensure control point is on the line
            controlPoint1.x,
            adjustedToY,
            adjustedToX,
            adjustedToY,
          ];
        case "Rounded Line":
          return [
            adjustedFromX,
            adjustedFromY,
            controlPoint1.x,
            controlPoint1.y,
            controlPoint2.x,
            controlPoint2.y,
            adjustedToX,
            adjustedToY,
          ];
        default:
          return [];
      }
    };

    const points = getPointsForLineType();
    const isSelected = selectedConnection === connection;

    return (
      <React.Fragment>
        <Line
          points={points}
          stroke="#4A90E2" // Light blue color for better visibility
          strokeWidth={8} // Adjusted line width
          lineCap="round"
          lineJoin="round"
          shadowBlur={10} // Enhanced shadow for depth
          shadowColor="rgba(0, 0, 0, 0.3)" // Darker shadow
          tension={connection.type === "Curved Line" ? 0.5 : 0}
          onClick={() => setSelectedConnection(connection)}
          onDblClick={() => {
            setSelectedConnection(connection);
            setConnectionLabel(connection.label || "");
            setLineType(connection.type);
            setLabelModalIsOpen(true);
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage().container();
            container.style.cursor = "pointer";
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage().container();
            container.style.cursor = "default";
          }}
        />
        {connection.label && (
          <Text
            text={connection.label}
            x={(points[0] + points[points.length - 2]) / 2}
            y={(points[1] + points[points.length - 1]) / 2 - 10}
            fontSize={20} // Increased font size for better visibility
            fill="#333" // Darker color for better contrast
            align="center"
            fontFamily="Arial"
            fontStyle="bold"
            shadowBlur={3} // Slightly larger shadow for text
          />
        )}
        {isSelected && (
          <Circle
            x={points[0]}
            y={points[1]}
            radius={10} // Larger circle for better visibility
            fill="black"
            draggable
            onDragEnd={(e) =>
              handleDotDragEnd(connection, e.target.x(), e.target.y())
            }
          />
        )}

        {/* Draggable Control Points */}
        {isSelected &&
          ["Curved Line", "Rounded Line", "Angled Line"].includes(
            connection.type
          ) && (
            <React.Fragment>
              <Circle
                x={controlPoint1.x}
                y={controlPoint1.y}
                radius={12} // Slightly larger control point
                fill="white"
                stroke={connection.type === "Angled Line" ? "blue" : "blue"} // Blue for angled lines
                strokeWidth={3}
                draggable
                shadowBlur={7}
                shadowColor="rgba(0, 0, 0, 0.4)"
                onDragEnd={handleDragEnd1}
              />
              {connection.type !== "Angled Line" && (
                <Circle
                  x={controlPoint2.x}
                  y={controlPoint2.y}
                  radius={12}
                  fill="white"
                  stroke="red"
                  strokeWidth={3}
                  draggable
                  shadowBlur={7}
                  shadowColor="rgba(0, 0, 0, 0.4)"
                  onDragEnd={handleDragEnd2}
                />
              )}
            </React.Fragment>
          )}
      </React.Fragment>
    );
  };

  const drawConnections = () => {
    return connections.map((connection, index) => {
      const fromNode = nodes.find((node) => node.id === connection.from);
      const toNode = nodes.find((node) => node.id === connection.to);

      if (!fromNode || !toNode) return null;

      return (
        <DraggableLine
          key={index}
          connection={connection}
          fromNode={fromNode}
          toNode={toNode}
        />
      );
    });
  };

  return (
    <div className="bg-[beige] min-h-screen">
      <nav className="bg-[beige] bg-opacity-70 py-4 flex justify-center items-center w-[90rem] min-w-full">
        <img src={logo} alt="Mind Mapping Logo" className="h-12 mr-4" />
        <h1 className="text-4xl font-bold text-black">Mind Map Application</h1>
      </nav>

      <div className="container mx-auto py-6">
        <div className="flex space-x-4 justify-center my-4">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 shadow hover:cursor-pointer hover:ease-linear "
            onClick={() => {
              setModalType("add");
              setModalIsOpen(true);
            }}
          >
            Create Node
          </button>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4  shadow hover:cursor-pointer hover:ease-linear"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            Undo
          </button>
          <button
            className="bg-[#333] hover:bg-black text-white font-bold py-2 px-4  shadow hover:cursor-pointer hover:ease-linear"
            onClick={handleUndoLastUndo}
          >
            Redo
          </button>
        </div>

        <Stage
          ref={stageRef}
          width={window.innerWidth}
          height={window.innerHeight - 200}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
          onWheel={handleZoom}
        >
          <Layer>
            {nodes.map((node, i) => {
              const level = getNodeLevel(node.id);
              let strokeColor = "black"; // Default stroke color
              let strokeWidth = 2; // Default stroke width

              if (level === 0) {
                strokeColor = "cyan"; // Parent node
              } else if (level === 1) {
                strokeColor = "green"; // Child node
                strokeWidth = 4; // Bold
              } else if (level === 2) {
                strokeColor = "#E0B80AC0"; // Grandchild
                strokeWidth = 3; // Bold
              }

              return (
                <RoundedRectangleNode
                  key={i}
                  shapeProps={{
                    ...node,
                    fill: "transparent", // Transparent fill
                    stroke: strokeColor,
                    strokeWidth: strokeWidth,
                  }}
                  isSelected={node.id === selectedId}
                  onSelect={() => handleSelectNode(node.id)}
                  onChange={(newAttrs) => dispatch(updateNode(newAttrs))}
                  onAddChild={() => {
                    setParentNodeId(node.id);
                    setModalType("add");
                    setModalIsOpen(true);
                  }}
                  onEdit={() => handleEditNode(node.id)}
                  onDelete={() => {
                    dispatch(deleteNode(node.id));
                    dispatch(deleteConnection(node.id));
                    selectShape(null);
                  }}
                  onDragEnd={(newX, newY) => handleDragEnd(node.id, newX, newY)}
                />
              );
            })}
            {drawConnections()}
          </Layer>
        </Stage>
      </div>

      <CustomModal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        title={
          modalType === "add"
            ? "Add Node"
            : modalType === "edit"
            ? "Edit Node"
            : "Delete Node"
        }
        onSubmit={
          modalType === "add"
            ? handleAddNode
            : modalType === "edit"
            ? handleUpdateNode
            : handleDeleteNode
        }
        submitLabel={
          modalType === "add"
            ? "Add"
            : modalType === "edit"
            ? "Update"
            : "Delete"
        }
        showCancel={modalType !== "delete"}
      >
        {modalType !== "delete" && (
          <>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="text"
              >
                Node Text
              </label>
              <input
                id="text"
                type="text"
                value={nodeData.text}
                onChange={(e) =>
                  setNodeData({ ...nodeData, text: e.target.value })
                }
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter node text"
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="additionalText"
              >
                Additional Text
              </label>
              <input
                id="additionalText"
                type="text"
                value={nodeData.additionalText}
                onChange={(e) =>
                  setNodeData({
                    ...nodeData,
                    additionalText: e.target.value,
                  })
                }
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter additional text"
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="lineType"
              >
                Connection Line Type
              </label>
              <select
                id="lineType"
                value={lineType}
                onChange={(e) => setLineType(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option>Straight Line</option>
                <option>Curved Line</option>
                <option>Angled Line</option>
                <option>Rounded Line</option>
              </select>
            </div>
          </>
        )}
        {modalType === "delete" && (
          <p className="text-gray-700 text-center">
            Are you sure you want to delete this node?
          </p>
        )}
      </CustomModal>

      <CustomModal
        isOpen={labelModalIsOpen}
        onRequestClose={() => setLabelModalIsOpen(false)}
        title="Add/Update Label to Connection"
        onSubmit={handleSaveLabel}
        submitLabel="Save"
      >
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="label"
          >
            Connection Label
          </label>
          <input
            id="label"
            type="text"
            value={connectionLabel}
            onChange={(e) => setConnectionLabel(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter connection label"
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="lineType"
          >
            Connection Line Type
          </label>
          <select
            id="lineType"
            value={lineType}
            onChange={(e) => setLineType(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="Straight Line">Straight Line</option>
            <option value="Curved Line">Curved Line</option>
            <option value="Angled Line">Angled Line</option>
            <option value="Rounded Line">Rounded Line</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDeleteLabel}
            className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow"
          >
            Delete Label
          </button>
        </div>
      </CustomModal>
    </div>
  );
};

export default App;
