import React, { useState, useEffect, useRef } from "react";
import { Group, Rect, Text, Transformer, Image } from "react-konva";
import useImage from "use-image";

const RoundedRectangleNode = ({
  shapeProps,
  isSelected,
  onSelect,
  onChange,
  onAddChild,
  onDragEnd,
  onEdit,
  onDelete,
}) => {
  const shapeRef = useRef();
  const trRef = useRef();
  const [addImage] = useImage("/add.png");
  const [deleteImage] = useImage("/delete (1).png");
  const [editImage] = useImage("/write.png");
  const [showIcons, setShowIcons] = useState(false);

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
      setShowIcons(true); // Show icons when selected
    } else {
      setShowIcons(false); // Hide icons when not selected
    }
  }, [isSelected]);

  // Define colors for regular and selected states
  const textColor = "#0E2038"; // Bluish-grey text color
  const regularStrokeColor = shapeProps.stroke || "black"; // Default stroke color
  const selectedStrokeColor = "#1E90FF"; // Highlight color when selected (e.g., DodgerBlue)

  const handleMouseEnter = (e) => {
    const container = e.target.getStage().container();
    container.style.cursor = "pointer";
  };

  const handleMouseLeave = (e) => {
    const container = e.target.getStage().container();
    container.style.cursor = "default";
  };

  return (
    <React.Fragment>
      <Group
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        draggable
        x={shapeProps.x}
        y={shapeProps.y}
        onDragEnd={(e) => {
          const newX = e.target.x();
          const newY = e.target.y();
          onDragEnd(newX, newY); // Call the onDragEnd handler with new coordinates
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          const newWidth = Math.max(60, shapeProps.width * scaleX);
          const newHeight = Math.max(30, shapeProps.height * scaleY);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            width: newWidth,
            height: newHeight,
          });
        }}
      >
        {/* Rounded Rectangle */}
        <Rect
          x={0}
          y={0}
          width={shapeProps.width}
          height={shapeProps.height}
          fill={shapeProps.fill}
          stroke={isSelected ? selectedStrokeColor : regularStrokeColor}
          strokeWidth={isSelected ? 4 : shapeProps.strokeWidth || 2} // Thicker stroke when selected
          cornerRadius={shapeProps.height / 2} // Fully rounded corners
        />

        {/* Main Text */}
        <Text
          text={shapeProps.text}
          x={10}
          y={10}
          fontSize={16}
          fill={textColor}
          width={shapeProps.width - 20}
          align="center"
          verticalAlign="middle"
          fontFamily="Arial"
          fontStyle="bold"
        />

        {/* Additional Text */}
        {shapeProps.additionalText && (
          <Text
            text={shapeProps.additionalText}
            x={10}
            y={30}
            fontSize={14}
            fill={textColor}
            width={shapeProps.width - 20}
            align="center"
            verticalAlign="middle"
            fontFamily="Arial"
            fontStyle="bold"
          />
        )}
      </Group>

      {/* "+" Icon for Adding Child Node - Top-Right Corner */}
      {showIcons && (
        <Image
          image={addImage}
          x={shapeProps.x + shapeProps.width - 28} // Position at the top-right corner
          y={shapeProps.y - 28} // Position above the node
          width={18} // Smaller size
          height={18} // Smaller size
          onClick={onAddChild}
          onMouseEnter={handleMouseEnter} // Set cursor to pointer on hover
          onMouseLeave={handleMouseLeave} // Reset cursor on mouse leave
        />
      )}

      {/* "Edit" Icon - Top-Left Corner */}
      {showIcons && (
        <Image
          image={editImage}
          x={shapeProps.x - 28} // Position at the top-left corner
          y={shapeProps.y - 28} // Position above the node
          width={18} // Smaller size
          height={18} // Smaller size
          onClick={onEdit}
          onMouseEnter={handleMouseEnter} // Set cursor to pointer on hover
          onMouseLeave={handleMouseLeave} // Reset cursor on mouse leave
        />
      )}

      {/* "Delete" Icon - Bottom-Left Corner */}
      {showIcons && (
        <Image
          image={deleteImage}
          x={shapeProps.x - 28} // Position at the bottom-left corner
          y={shapeProps.y + shapeProps.height - 28} // Position below the node
          width={18} // Smaller size
          height={18} // Smaller size
          onClick={onDelete}
          onMouseEnter={handleMouseEnter} // Set cursor to pointer on hover
          onMouseLeave={handleMouseLeave} // Reset cursor on mouse leave
        />
      )}

      {/* Transformer for Resizing */}
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 60 || Math.abs(newBox.height) < 30) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

export default RoundedRectangleNode;
