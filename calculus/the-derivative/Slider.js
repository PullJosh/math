import { html } from 'https://unpkg.com/lit-html/lit-html.js';
import { component, useState, useEffect } from 'https://unpkg.com/haunted/haunted.js';

export const Slider = component(
  (self) => {
    const {
      position,
      setPosition = null,
      delta,
      min,
      max,
      step = null,
      minVisible = min,
      maxVisible = max,
      label = null,
      positionColor = "black",
      deltaColor = "black"
    } = self

    const [dragging, setDragging] = useState(false);
    
    const onMouseDown = e => {
      setDragging(true);
    };
    
    const onMouseMove = e => {
      if (!dragging) return;

      const slider = self.shadowRoot.querySelector('.Slider');
      const { x, width } = slider.getBoundingClientRect();
      
      let percent = (e.clientX - x) / width;
      percent = Math.max(0, percent);
      percent = Math.min(1, percent);
      
      let value = percent * (parseFloat(maxVisible) - parseFloat(minVisible)) + parseFloat(minVisible);
      value = Math.max(parseFloat(min), value);
      value = Math.min(parseFloat(max), value);
      
      if (setPosition !== null) {
        setPosition(value);
      }
    }
    
    const onMouseUp = e => {
      setDragging(false);
    };
    
    useEffect(() => {
      document.body.addEventListener('mousemove', onMouseMove);
      document.body.addEventListener('mouseup', onMouseUp);
      
      return () => {
        document.body.removeEventListener('mousemove', onMouseMove);
        document.body.removeEventListener('mouseup', onMouseUp);
      }
    });
    
    const positionPercent = (position - minVisible) / (maxVisible - minVisible);
    const deltaPercent = delta / (maxVisible - minVisible);
    
    return html`
      <div class="Slider" style="--positionColor: ${positionColor}; --deltaColor: ${deltaColor};">
        ${label && (
          html`
            <span class="Slider__label" style="left: ${positionPercent * 100}%;">
              ${label}
            </span>
          `
        )}
        <div
          class=${
            "Slider__position" +
            (setPosition === null
              ? ""
              : dragging
              ? " Slider__position--dragging"
              : " Slider__position--draggable")
          }
          style="left: ${positionPercent * 100}%;"
          @mousedown=${onMouseDown}
        ></div>
        <div
          class="Slider__delta"
          style="left: ${positionPercent * 100}%; width: ${Math.abs(deltaPercent) * 100}%; transform: ${deltaPercent < 0 ? "scaleX(-1)" : "none"}; transform-origin: 0 0;"
        ></div>
      </div>
      <style>
        .Slider {
          height: 4px;
          margin: 0;
          margin-bottom: 96px;
          background: #ddd;
          position: relative;
          user-select: none;
        }

        .Slider__position {
          position: absolute;
          width: 12px;
          height: 12px;
          top: 50%;
          transform: translate(-50%, -50%);
          background: var(--positionColor);
          border-radius: 999px;
          z-index: 1;
        }
        .Slider__position--draggable {
          cursor: grab;
          box-shadow: 0 0 0 6px rgba(0, 0, 0, 0.2);
        }
        .Slider__position--dragging {
          cursor: grabbing;
          box-shadow: 0 0 0 6px rgba(0, 0, 0, 0.4);
        }
        .Slider__position::before {
          /* Expand mouse hitbox */
          content: " ";
          position: absolute;
          top: -12px;
          left: -12px;
          bottom: -12px;
          right: -12px;
          border-radius: 999px;
        }

        .Slider__delta {
          position: absolute;
          height: 100%;
          top: 0;
          background: var(--deltaColor);
        }
        .Slider__delta::after {
          content: " ";
          position: absolute;
          top: 50%;
          right: 0;
          width: 8px;
          height: 8px;
          border-bottom: 3px solid var(--deltaColor);
          border-right: 3px solid var(--deltaColor);
          transform: translateY(-50%) rotate(-45deg);
        }

        .Slider__label {
          position: absolute;
          top: 100%;
          transform: translate(-50%, 50%);
          text-align: center;
          font-weight: bold;
          pointer-events: none;
          user-select: none;
        }
      </style>
    `;
  },
  { observedAttributes: ['position', 'setPosition', 'delta', 'min', 'max', 'step', 'minVisible', 'maxVisible', 'label', 'positionColor', 'deltaColor'] }
)
