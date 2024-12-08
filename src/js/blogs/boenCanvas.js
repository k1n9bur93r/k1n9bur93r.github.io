export class RhombusGrid {
    constructor(options = {}) {
        const {
          canvasSize = 1024,
          canvasHeight,
          canvasWidth,
          cellSize = 15,
          numOfGroups = 120,
          topBottomPadding = 5,
          colors = ['#fbd4a1', '#4eace1', '#df4c97', '#5ec0ad', '#f5686b', '#c9a3e2'],
          backgroundColor = '#000000',
          monitorWindowResizing = false
        } = options;
    
        // Initialize canvas
        this.sourceCanvas = document.createElement('canvas');
        this.sourceContext = this.sourceCanvas.getContext('2d', {
          alpha: false,
          willReadFrequently: false
        });
    
        // Set canvas dimensions
        this.canvasWidth = canvasWidth || canvasSize;
        this.canvasHeight = canvasHeight || canvasSize;
        this.sourceCanvas.width = this.canvasWidth;
        this.sourceCanvas.height = this.canvasHeight;
    
        // Grid properties
        this.cellSize = cellSize;
        this.cols = Math.ceil(this.canvasWidth / cellSize) + 1;
        this.rows = Math.ceil(this.canvasHeight / cellSize) + 1;
        this.backgroundColor = backgroundColor;
        this.colors = colors;
        this.topBottomPadding = topBottomPadding;
        this.numOfGroups = numOfGroups;
    
        // Animation properties
        this.isAnimating = false;
        this.animationInterval = null;
    
        // Resize monitoring properties
        this.monitorWindowResizing = monitorWindowResizing;
        this.resizeHandler = null;
        this.resizeDebounceTimeout = null;
        
        // Initialize color groups
        this.colorGroups = this.initializeColorGroups();
    
        // Start monitoring window resizing if enabled
        if (this.monitorWindowResizing) {
          this.startResizeMonitoring();
        }
      }
    
      // New resize monitoring methods
      startResizeMonitoring() {
        if (!this.resizeHandler) {
          this.resizeHandler = this.handleResize.bind(this);
          window.addEventListener('resize', this.resizeHandler);
        }
      }
    
      stopResizeMonitoring() {
        if (this.resizeHandler) {
          window.removeEventListener('resize', this.resizeHandler);
          this.resizeHandler = null;
        }
        if (this.resizeDebounceTimeout) {
          clearTimeout(this.resizeDebounceTimeout);
          this.resizeDebounceTimeout = null;
        }
      }
    
      handleResize() {
        // Debounce the resize event
        if (this.resizeDebounceTimeout) {
          clearTimeout(this.resizeDebounceTimeout);
        }
    
        this.resizeDebounceTimeout = setTimeout(() => {
          // Get the new parent element dimensions
          const parent = this.sourceCanvas.parentElement;
          if (!parent) return;
    
          const newWidth = parent.clientWidth;
          const newHeight = parent.clientHeight;
    
          // Only update if dimensions have changed
          if (newWidth !== this.canvasWidth || newHeight !== this.canvasHeight) {
            const wasAnimating = this.isAnimating;
            
            // Stop animation temporarily if it's running
            if (wasAnimating) {
              this.stopAnimation();
            }
    
            // Update canvas dimensions
            this.canvasWidth = newWidth;
            this.canvasHeight = newHeight;
            this.sourceCanvas.width = newWidth;
            this.sourceCanvas.height = newHeight;
    
            // Update grid properties
            this.cols = Math.ceil(this.canvasWidth / this.cellSize) + 1;
            this.rows = Math.ceil(this.canvasHeight / this.cellSize) + 1;
    
            // Reinitialize color groups and grid
            this.colorGroups = this.initializeColorGroups();
            this.initializeGrid();
    
            // Restart animation if it was running
            if (wasAnimating) {
              this.startAnimation();
            }
          }
        }, 250); // 250ms debounce delay
      }
  
    initializeColorGroups() {
      const groups = Array(this.numOfGroups).fill().map(() => []);
  
      // Use the full column count to ensure coverage
      const visibleCols = this.cols;
      const visibleRows = this.rows;
  
      // Assign cells to random groups, excluding padding rows
      for (let x = 0; x < visibleCols; x++) {
        for (let y = this.topBottomPadding; y < visibleRows - this.topBottomPadding; y++) {
          const groupIndex = Math.floor(Math.random() * this.numOfGroups);
          groups[groupIndex].push({ x, y });
        }
      }
  
      return groups;
    }
  
    drawRhombus(x, y, color) {
      if (y < this.topBottomPadding || y >= this.rows - this.topBottomPadding) return;
  
      const overlap = 0.5;
      const cx = x * this.cellSize + this.cellSize / 2;
      const cy = y * this.cellSize + this.cellSize / 2;
  
      // Removed the canvas boundary check to allow partial rhombuses at edges
      this.sourceContext.fillStyle = color;
      this.sourceContext.beginPath();
      this.sourceContext.moveTo(cx, cy - this.cellSize / 2 - overlap);     // Top
      this.sourceContext.lineTo(cx + this.cellSize / 2 + overlap, cy);     // Right
      this.sourceContext.lineTo(cx, cy + this.cellSize / 2 + overlap);     // Bottom
      this.sourceContext.lineTo(cx - this.cellSize / 2 - overlap, cy);     // Left
      this.sourceContext.closePath();
      this.sourceContext.fill();
    }
  
    initializeGrid() {
      // Fill the entire canvas with background color first
      this.sourceContext.fillStyle = this.backgroundColor;
      this.sourceContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  
      // Draw the rhombus grid using the full column count
      for (let x = 0; x < this.cols; x++) {
        for (let y = 0; y < this.rows; y++) {
          this.drawRhombus(x, y, this.backgroundColor);
        }
      }
      
      this.updateAllGroups();
    }
  
    updateSingleGroupColor(group) {
      const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
  
      for (const cell of group) {
        this.drawRhombus(
          cell.x,
          cell.y,
          Math.random() > 0.3 ? randomColor : this.backgroundColor
        );
      }
    }
  
    getCanvas() {
      return this.sourceCanvas;
    }
  
    updateGroupColor() {
      const groupIndex = Math.floor(Math.random() * this.colorGroups.length);
      this.updateSingleGroupColor(this.colorGroups[groupIndex]);
    }
  
    updateAllGroups() {
      this.colorGroups.forEach(group => this.updateSingleGroupColor(group));
    }
  
    startAnimation(intervalMs = 100) {
      if (this.isAnimating) return;
      
      this.isAnimating = true;
      this.animationInterval = setInterval(() => {
        this.updateGroupColor();
      }, intervalMs);
    }
  
    stopAnimation() {
      if (!this.isAnimating) return;
      
      clearInterval(this.animationInterval);
      this.isAnimating = false;
      this.animationInterval = null;
    }
  
    destroy() {
      this.stopAnimation();
    }
  }