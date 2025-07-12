import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Phaser from 'phaser';

// Game Scene Class
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.gameConfig = {};
    this.onInteraction = null;
    this.onGameEvent = null;
    this.gameObjects = [];
    this.score = 0;
    this.errors = 0;
    this.startTime = null;
    this.isPaused = false;
  }

  init(data) {
    this.gameConfig = data.config || {};
    this.onInteraction = data.onInteraction;
    this.onGameEvent = data.onGameEvent;
  }

  preload() {
    // Create simple geometric shapes programmatically
    this.load.image('background', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    
    // Create colored squares for drag and drop
    this.createColoredShapes();
  }

  createColoredShapes() {
    // Use AI-generated config instead of hardcoded values
    const colors = this.gameConfig.colors || ['red', 'blue', 'green', 'yellow'];
    const shapes = this.gameConfig.shapes || ['circle', 'square', 'triangle'];
    
    colors.forEach(color => {
      shapes.forEach(shape => {
        this.createShape(color, shape);
      });
    });
  }

  createShape(color, shape) {
    const graphics = this.add.graphics();
    const size = 50;
    
    // Set color
    const colorMap = {
      red: 0xff0000,
      blue: 0x0000ff,
      green: 0x00ff00,
      yellow: 0xffff00,
      purple: 0xff00ff,
      orange: 0xffa500,
      pink: 0xffc0cb,
      cyan: 0x00ffff,
      brown: 0x8b4513,
      gray: 0x808080
    };
    
    graphics.fillStyle(colorMap[color] || 0x000000);
    
    // Draw shape
    switch (shape) {
      case 'circle':
        graphics.fillCircle(size/2, size/2, size/2);
        break;
      case 'square':
        graphics.fillRect(0, 0, size, size);
        break;
      case 'triangle':
        graphics.fillTriangle(size/2, 0, 0, size, size, size);
        break;
      case 'star':
        // Create a simple star shape
        const points = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5;
          const radius = i % 2 === 0 ? size/2 : size/4;
          points.push({
            x: size/2 + Math.cos(angle) * radius,
            y: size/2 + Math.sin(angle) * radius
          });
        }
        graphics.fillPoints(points, true, true);
        break;
      case 'diamond':
        graphics.fillTriangle(size/2, 0, 0, size/2, size/2, size);
        graphics.fillTriangle(size/2, 0, size, size/2, size/2, size);
        break;
    }
    
    // Generate texture
    graphics.generateTexture(`${color}_${shape}`, size, size);
    graphics.destroy();
  }

  create() {
    this.startTime = Date.now();
    
    // Create background
    this.add.rectangle(400, 300, 800, 600, 0x87CEEB);
    
    // Create game title with special interests integration
    const interests = this.gameConfig.interests || [];
    const interestText = interests.length > 0 ? ` featuring ${interests[0]}` : '';
    
    this.add.text(400, 50, `Shape Matching Game${interestText}`, {
      fontSize: '32px',
      fill: '#000',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Create score display
    this.scoreText = this.add.text(50, 100, 'Score: 0', {
      fontSize: '24px',
      fill: '#000',
      fontFamily: 'Arial'
    });

    // Create instructions based on difficulty
    const difficulty = this.gameConfig.difficulty || 'easy';
    const instructionText = difficulty === 'easy' 
      ? 'Drag the shapes to the matching targets!' 
      : 'Match the shapes quickly and accurately!';
    
    this.add.text(400, 120, instructionText, {
      fontSize: '18px',
      fill: '#333',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Initialize game
    this.setupLevel();
    
    // Log game start event
    if (this.onGameEvent) {
      this.onGameEvent('game_started', {
        level: this.gameConfig.level || 1,
        difficulty: this.gameConfig.difficulty || 'easy',
        interests: this.gameConfig.interests || [],
        timestamp: Date.now()
      });
    }
  }

  setupLevel() {
    // Clear existing game objects
    this.gameObjects.forEach(obj => obj.destroy());
    this.gameObjects = [];

    const level = this.gameConfig.level || 1;
    const difficulty = this.gameConfig.difficulty || 'easy';
    const numberOfShapes = difficulty === 'easy' ? Math.min(3 + level, 6) : Math.min(4 + level, 8);
    
    // Create draggable shapes using AI config
    this.createDraggableShapes(numberOfShapes);
    
    // Create drop targets
    this.createDropTargets(numberOfShapes);
  }

  createDraggableShapes(count) {
    // Use AI-generated config
    const colors = this.gameConfig.colors || ['red', 'blue', 'green', 'yellow'];
    const shapes = this.gameConfig.shapes || ['circle', 'square', 'triangle'];
    
    for (let i = 0; i < count; i++) {
      const color = Phaser.Utils.Array.GetRandom(colors);
      const shape = Phaser.Utils.Array.GetRandom(shapes);
      
      const x = 100 + (i * 120);
      const y = 200;
      
      const gameShape = this.add.image(x, y, `${color}_${shape}`);
      gameShape.setInteractive({ draggable: true });
      gameShape.setScale(0.8);
      
      // Store shape data
      gameShape.shapeData = { color, shape, originalX: x, originalY: y };
      
      // Add drag events
      this.setupDragEvents(gameShape);
      
      this.gameObjects.push(gameShape);
    }
  }

  createDropTargets(count) {
    // Create matching targets at the bottom
    for (let i = 0; i < count; i++) {
      const sourceShape = this.gameObjects[i];
      if (!sourceShape) continue;
      
      const x = 100 + (i * 120);
      const y = 450;
      
      // Create target outline
      const target = this.add.graphics();
      target.lineStyle(3, 0x000000, 0.5);
      target.strokeRect(x - 25, y - 25, 50, 50);
      
      // Add target data
      target.targetData = {
        color: sourceShape.shapeData.color,
        shape: sourceShape.shapeData.shape,
        x: x,
        y: y,
        filled: false
      };
      
      this.gameObjects.push(target);
    }
  }

  setupDragEvents(shape) {
    let startTime;

    this.input.on('dragstart', (pointer, gameObject) => {
      if (gameObject === shape) {
        startTime = Date.now();
        gameObject.setScale(0.9);
        gameObject.setTint(0xcccccc);
      }
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      if (gameObject === shape) {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }
    });

    this.input.on('dragend', (pointer, gameObject) => {
      if (gameObject === shape) {
        const reactionTime = Date.now() - startTime;
        gameObject.setScale(0.8);
        gameObject.clearTint();
        
        // Check if dropped on valid target
        const target = this.getDropTarget(gameObject.x, gameObject.y, gameObject.shapeData);
        
        if (target && !target.targetData.filled) {
          // Correct match
          gameObject.x = target.targetData.x;
          gameObject.y = target.targetData.y;
          target.targetData.filled = true;
          
          this.score += 10;
          this.updateScore();
          
          // Log successful interaction
          if (this.onInteraction) {
            this.onInteraction({
              type: 'correct_match',
              reactionTime,
              shape: gameObject.shapeData,
              score: this.score,
              isError: false
            });
          }
          
          // Check if level complete
          this.checkLevelComplete();
          
        } else {
          // Incorrect match or no target
          gameObject.x = gameObject.shapeData.originalX;
          gameObject.y = gameObject.shapeData.originalY;
          
          this.errors++;
          
          // Log error
          if (this.onInteraction) {
            this.onInteraction({
              type: 'incorrect_match',
              reactionTime,
              shape: gameObject.shapeData,
              errors: this.errors,
              isError: true
            });
          }
          
          // Show error feedback
          this.showErrorFeedback(gameObject);
        }
      }
    });
  }

  getDropTarget(x, y, shapeData) {
    const targets = this.gameObjects.filter(obj => obj.targetData);
    
    for (let target of targets) {
      const distance = Phaser.Math.Distance.Between(x, y, target.targetData.x, target.targetData.y);
      
      if (distance < 60 && 
          target.targetData.color === shapeData.color && 
          target.targetData.shape === shapeData.shape) {
        return target;
      }
    }
    
    return null;
  }

  showErrorFeedback(shape) {
    // Flash red briefly
    shape.setTint(0xff0000);
    this.time.delayedCall(200, () => {
      shape.clearTint();
    });
    
    // Shake effect
    this.tweens.add({
      targets: shape,
      x: shape.x + 10,
      duration: 50,
      yoyo: true,
      repeat: 3
    });
  }

  updateScore() {
    this.scoreText.setText(`Score: ${this.score}`);
  }

  checkLevelComplete() {
    const targets = this.gameObjects.filter(obj => obj.targetData);
    const filledTargets = targets.filter(target => target.targetData.filled);
    
    if (filledTargets.length === targets.length) {
      // Level complete!
      this.showLevelComplete();
    }
  }

  showLevelComplete() {
    // Add celebration text
    const congratsText = this.add.text(400, 300, 'Level Complete!', {
      fontSize: '48px',
      fill: '#00ff00',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Celebration animation
    this.tweens.add({
      targets: congratsText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: 2
    });
    
    // Log level completion
    if (this.onGameEvent) {
      this.onGameEvent('level_completed', {
        level: this.gameConfig.level || 1,
        score: this.score,
        errors: this.errors,
        completionTime: Date.now() - this.startTime
      });
    }
    
    // Auto advance to next level after delay
    this.time.delayedCall(3000, () => {
      this.gameConfig.level = (this.gameConfig.level || 1) + 1;
      congratsText.destroy();
      this.setupLevel();
    });
  }

  triggerSurprise(surpriseType) {
    switch (surpriseType) {
      case 'color_change':
        this.surpriseColorChange();
        break;
      case 'size_change':
        this.surpriseSizeChange();
        break;
      case 'position_change':
        this.surprisePositionChange();
        break;
      case 'sound_change':
        this.surpriseSoundChange();
        break;
    }
  }

  surpriseColorChange() {
    // Temporarily change all shape colors
    const shapes = this.gameObjects.filter(obj => obj.shapeData);
    shapes.forEach(shape => {
      shape.setTint(Phaser.Math.Between(0x000000, 0xffffff));
    });
    
    // Restore original colors after 2 seconds
    this.time.delayedCall(2000, () => {
      shapes.forEach(shape => {
        shape.clearTint();
      });
    });
  }

  surpriseSizeChange() {
    const shapes = this.gameObjects.filter(obj => obj.shapeData);
    shapes.forEach(shape => {
      this.tweens.add({
        targets: shape,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 1000,
        yoyo: true
      });
    });
  }

  surprisePositionChange() {
    const shapes = this.gameObjects.filter(obj => obj.shapeData);
    shapes.forEach(shape => {
      if (!shape.input.isDragging) {
        this.tweens.add({
          targets: shape,
          x: shape.x + Phaser.Math.Between(-50, 50),
          y: shape.y + Phaser.Math.Between(-30, 30),
          duration: 500,
          ease: 'Back.easeOut'
        });
      }
    });
  }

  surpriseSoundChange() {
    // Visual feedback for sound change (since we might not have audio)
    this.cameras.main.flash(500, 255, 255, 0);
  }

  pauseGame() {
    this.isPaused = true;
    this.physics.pause();
    this.anims.pauseAll();
  }

  resumeGame() {
    this.isPaused = false;
    this.physics.resume();
    this.anims.resumeAll();
  }
}

// GameCanvas Component
const GameCanvas = forwardRef(({ config, gameState, onInteraction, onGameEvent }, ref) => {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);

  useImperativeHandle(ref, () => ({
    triggerSurprise: (surpriseType) => {
      if (phaserGameRef.current && phaserGameRef.current.scene.scenes[0]) {
        phaserGameRef.current.scene.scenes[0].triggerSurprise(surpriseType);
      }
    },
    pauseGame: () => {
      if (phaserGameRef.current && phaserGameRef.current.scene.scenes[0]) {
        phaserGameRef.current.scene.scenes[0].pauseGame();
      }
    },
    resumeGame: () => {
      if (phaserGameRef.current && phaserGameRef.current.scene.scenes[0]) {
        phaserGameRef.current.scene.scenes[0].resumeGame();
      }
    }
  }));

  useEffect(() => {
    if (gameRef.current && !phaserGameRef.current) {
      const gameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: gameRef.current,
        backgroundColor: '#87CEEB',
        scene: GameScene,
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        }
      };

      phaserGameRef.current = new Phaser.Game(gameConfig);
      
      // Start the scene with configuration
      phaserGameRef.current.scene.start('GameScene', {
        config: config,
        onInteraction: onInteraction,
        onGameEvent: onGameEvent
      });
    }

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Handle game state changes
    if (phaserGameRef.current && phaserGameRef.current.scene.scenes[0]) {
      const scene = phaserGameRef.current.scene.scenes[0];
      
      if (gameState === 'paused') {
        scene.pauseGame();
      } else if (gameState === 'playing') {
        scene.resumeGame();
      }
    }
  }, [gameState]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-800">
      <div 
        ref={gameRef} 
        className="game-container border-2 border-gray-600 rounded-lg overflow-hidden"
        style={{ width: '800px', height: '600px' }}
      />
    </div>
  );
});

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;