/**
 * @file background.js
 * @description Animated particle canvas background with connecting lines.
 *              Adapts colours to the current theme (dark/light).
 *
 * Original work Copyright (c) jaylikesbunda
 * Modifications Copyright (c) PBNZ 2026
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

(function () {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particlesArray = [];

    /**
     * Get current theme colours based on the data-theme attribute.
     * @returns {{particleColor: string, backgroundColor: string}}
     */
    function getThemeColors() {
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        return theme === 'dark'
            ? { particleColor: 'rgba(0, 184, 169, 0.6)', backgroundColor: 'rgba(15, 23, 41, 0.85)' }
            : { particleColor: 'rgba(0, 148, 136, 0.4)', backgroundColor: 'rgba(245, 247, 250, 0.85)' };
    }

    // Watch for theme changes via attribute mutation
    const observer = new MutationObserver(() => { /* particles auto-update via getThemeColors() */ });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    /** A single animated particle. */
    class Particle {
        constructor(x, y, dx, dy, size) {
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;
            this.size = size;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = getThemeColors().particleColor;
            ctx.fill();
        }

        update() {
            if (this.x > canvas.width || this.x < 0) this.dx = -this.dx;
            if (this.y > canvas.height || this.y < 0) this.dy = -this.dy;
            this.x += this.dx;
            this.y += this.dy;
            this.draw();
        }
    }

    /** Initialise particle array based on canvas size. */
    function init() {
        particlesArray = [];
        const count = Math.min((canvas.height * canvas.width) / 12000, 80);
        for (let i = 0; i < count; i++) {
            const size = Math.random() * 1.5 + 0.5;
            const x = Math.random() * (canvas.width - size * 4) + size * 2;
            const y = Math.random() * (canvas.height - size * 4) + size * 2;
            const dx = (Math.random() - 0.5) * 0.8;
            const dy = (Math.random() - 0.5) * 0.8;
            particlesArray.push(new Particle(x, y, dx, dy, size));
        }
    }

    /** Draw lines between nearby particles. */
    function connect() {
        const colors = getThemeColors();
        const maxDist = (canvas.width / 8) * (canvas.height / 8);
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a + 1; b < particlesArray.length; b++) {
                const dx = particlesArray[a].x - particlesArray[b].x;
                const dy = particlesArray[a].y - particlesArray[b].y;
                const dist = dx * dx + dy * dy;
                if (dist < maxDist) {
                    const opacity = 1 - (dist / maxDist);
                    ctx.strokeStyle = colors.particleColor.replace(/[\d.]+\)$/, `${opacity * 0.5})`);
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    /** Animation loop. */
    function animate() {
        requestAnimationFrame(animate);
        const colors = getThemeColors();
        ctx.fillStyle = colors.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        particlesArray.forEach(p => p.update());
        connect();
    }

    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        init();
    });

    // Initial setup
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    init();
    animate();
})();
