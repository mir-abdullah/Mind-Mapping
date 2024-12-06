export const getConnectionPoints = (fromNode, toNode, type) => {
  const fromCenterX = fromNode.x + fromNode.width / 2;
  const fromCenterY = fromNode.y + fromNode.height / 2;
  const toCenterX = toNode.x + toNode.width / 2;
  const toCenterY = toNode.y + toNode.height / 2;

  // Calculate the angle between the two nodes
  const angle = Math.atan2(toCenterY - fromCenterY, toCenterX - fromCenterX);

  // Calculate the offset for the connection points to stop at the border of the nodes
  const fromOffsetX = (fromNode.width / 1.7) * Math.cos(angle);
  const fromOffsetY = (fromNode.height / 1.7) * Math.sin(angle);
  const toOffsetX = (toNode.width / 1.7) * Math.cos(angle);
  const toOffsetY = (toNode.height / 1.7) * Math.sin(angle);

  // Calculate the points where the lines should start and end (at the edge of the nodes)
  const fromX = fromCenterX + fromOffsetX;
  const fromY = fromCenterY + fromOffsetY;
  const toX = toCenterX - toOffsetX;
  const toY = toCenterY - toOffsetY;
  switch (type) {
    case "Curved Line":
      // Control points dynamically calculated for a smoother curve
      const controlPointX1 = fromX + (toX - fromX) / 3.5;
      const controlPointY1 = fromY;
      const controlPointX2 = toX - (toX - fromX) / 3.5;
      const controlPointY2 = toY;

      return [
        fromX,
        fromY,
        controlPointX1,
        controlPointY1,
        controlPointX2,
        controlPointY2,
        toX,
        toY,
      ];
    case "Angled Line":
      return [fromX, fromY, fromX, toY, toX, toY];
    case "Rounded Line":
      return [
        fromX,
        fromY,
        fromX + (toX - fromX) / 2,
        fromY,
        toX - (toX - fromX) / 2,
        toY,
        toX,
        toY,
      ];
    default: // 'Straight Line'
      return [fromX, fromY, toX, toY];
  }
};
