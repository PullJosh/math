import { html, svg } from 'https://unpkg.com/lit-html/lit-html.js';
import { virtual } from 'https://unpkg.com/haunted/haunted.js';

export const Graph = virtual(
  ({
    func,
    derivative,
    position,
    delta,
    viewport,
    aspectRatio = null,
    graphicsScale = 1
  }) => {
    const { x1, x2, y1, y2 } = viewport;

    if (aspectRatio === null) {
      aspectRatio = (x2 - x1) / (y2 - y1);
    }
    const [svgW, svgH] = [100 / graphicsScale, 100 / graphicsScale / aspectRatio];

    const scaleX = svgW / (x2 - x1);
    const scaleY = svgH / (y2 - y1);

    const toSvgX = x => ((x - x1) / (x2 - x1)) * svgW;
    const toSvgY = y => (1 - (y - y1) / (y2 - y1)) * svgH;

    const getPath = (func, leftX, rightX) => {
      let points = [];
      for (let x = leftX; x <= rightX; x += 0.1) {
        points.push({ x, y: func(x) });
      }

      let prevX = 0;
      let prevY = 0;
      for (let i = 0; i < points.length; i++) {
        points[i] = {
          ...points[i],
          dx: points[i].x - prevX,
          dy: points[i].y - prevY
        };

        prevX = points[i].x;
        prevY = points[i].y;
      }

      return (
        `m ${toSvgX(0)} ${toSvgY(0)} m` +
        points.map(({ dx, dy }) => `${dx * scaleX} ${dy * -scaleY}`).join(" ")
      );
    };

    const tangentLine = position => x =>
      derivative(position) * x - func(position);
    
    return html`
      <svg class="Graph" version="1.1" viewBox="0 0 ${svgW} ${svgH}">
        <g>
          ${new Array(Math.ceil(y2 - y1)).fill().map((_, i) => svg`
            <line x1=${0} x2=${svgW} y1=${toSvgY(y1 + i)} y2=${toSvgY(y1 + i)} stroke=${(y1 + i === 0) ? "#0007" : "#0002"} stroke-width="0.25" />
          `)}
          ${new Array(Math.ceil(x2 - x1)).fill().map((_, i) => svg`
            <line x1=${toSvgX(x1 + i)} x2=${toSvgX(x1 + i)} y1=${0} y2=${svgH} stroke=${(x1 + i === 0) ? "#0007" : "#0002"} stroke-width="0.25" />
          `)}
        </g>
        <path d=${getPath(func, Math.floor(x1), Math.ceil(x2))} fill="none" stroke="black" />
        <path d=${getPath(tangentLine(position), Math.floor(x1), Math.ceil(x2))} fill="none" stroke="#aaa" />
        <line
          x1=${toSvgX(position)}
          x2=${toSvgX(position + delta)}
          y1=${toSvgY(func(position))}
          y2=${toSvgY(func(position))}
          stroke="red"
          marker-end="url(#ArrowEnd1)"
        />
        <circle
          cx=${toSvgX(position)}
          cy=${toSvgY(func(position))}
          r="2"
          fill="black"
        />
        <line
          x1=${toSvgX(position + delta)}
          x2=${toSvgX(position + delta)}
          y1=${toSvgY(func(position))}
          y2=${toSvgY(tangentLine(position)(position + delta))}
          stroke="blue"
          marker-end="url(#ArrowEnd2)"
        />
        <defs>
          <marker id="ArrowEnd1" overflow="visible" orient="auto">
            <path transform="scale(0.8)" d="m0 0 -2 2 2 -2 -2 -2" stroke="red" />
          </marker>
          <marker id="ArrowEnd2" overflow="visible" orient="auto">
            <path
              transform="scale(${0.8 * Math.min(1, Math.abs(func(position) - tangentLine(position)(position + delta)))})"
              d="m0 0 -2 2 2 -2 -2 -2"
              stroke="blue"
            />
          </marker>
        </defs>
      </svg>
      <style>
        .Graph {
          background: #eee;
          border-radius: 8px;
        }
      </style>
    `
  }
)