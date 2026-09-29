import { useEffect, useRef } from 'react';
import { getDefaultSeason } from '../utils/weatherUtils';
import './WeatherBackground.css';

/**
 * Determine the dynamic atmospheric type based on live weather data
 */
function getAtmosphereType(condition, isNight, clouds = 0, temp = null, unit = 'metric', description = '') {
  if (!condition) return getDefaultSeason();
  const c = condition.toLowerCase();
  const desc = description?.toLowerCase() || '';

  // 1. Thunderstorm
  if (c.includes('thunder') || c.includes('storm')) {
    return 'thunderstorm';
  }

  // 2. Snow / Ice
  if (c.includes('snow') || c.includes('sleet') || c.includes('ice') || c.includes('blizzard')) {
    return isNight ? 'snow-night' : 'snow';
  }

  // 3. Rain / Drizzle
  if (c.includes('rain') || c.includes('drizzle')) {
    return isNight ? 'rain-night' : 'rain';
  }

  // 4. Mist / Fog / Haze
  if (c.includes('mist') || c.includes('fog') || c.includes('haze') || c.includes('smoke') || c.includes('dust') || c.includes('sand')) {
    return isNight ? 'fog-night' : 'fog';
  }

  // Temperature in Celsius
  const tempC = temp != null ? (unit === 'imperial' ? (temp - 32) * (5 / 9) : temp) : 25;

  // 5. Clouds
  if (c.includes('cloud')) {
    if (isNight) return 'cloudy-night';
    // Broken clouds, scattered, few clouds -> partly cloudy with glowing sun and fluffy clouds
    if (clouds < 80 || desc.includes('few') || desc.includes('scattered') || desc.includes('broken')) {
      return 'partly-cloudy';
    }
    return 'overcast';
  }

  // 6. Clear skies
  if (isNight) {
    return 'clear-night';
  }

  if (tempC <= 0) {
    return 'winter-clear';
  }

  return 'sunny';
}

/**
 * 3D-styled animated seasonal weather background
 * Features:
 * - Radiant sun with rotating rays & solar motes (Sunny & Partly Cloudy)
 * - Volumetric layered drifting cumulus clouds (Partly Cloudy, Overcast, Night Clouds)
 * - 3D angled rain with ground splash ripples (Rain & Storm)
 * - Branching lightning strikes & atmospheric flash (Thunderstorm)
 * - Drifting, wobbling snowflakes with radial glow (Snow)
 * - Luminous moon, twinkling stars & shooting meteors (Clear Night & Moonlit Clouds)
 */
function WeatherBackground({ condition, isNight, clouds = 0, temp = null, unit = 'metric', description = '' }) {
  const canvasRef = useRef(null);

  const activeType = getAtmosphereType(condition, isNight, clouds, temp, unit, description);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // ==========================================
    // PARTICLE & OBJECT SYSTEMS
    // ==========================================

    // 1. Rain Drops & Splashes
    const isRain = activeType === 'rain' || activeType === 'rain-night' || activeType === 'thunderstorm';
    const rainCount = activeType === 'thunderstorm' ? 220 : 160;
    const raindrops = Array.from({ length: rainCount }, () => ({
      x: Math.random() * (width + 200) - 100,
      y: Math.random() * height,
      z: Math.random() * 0.8 + 0.2,
      length: Math.random() * 22 + 16,
      speed: Math.random() * 12 + 18,
      wind: activeType === 'thunderstorm' ? -4.5 : -2,
      opacity: Math.random() * 0.4 + 0.35,
    }));

    const splashes = [];
    const createSplash = (x, y, z) => {
      if (splashes.length > 50) return;
      splashes.push({
        x,
        y: y + Math.random() * 10 - 5,
        radius: 1,
        maxRadius: Math.random() * 16 * z + 8,
        opacity: 0.65 * z,
      });
    };

    // 2. Snowflakes
    const isSnow = activeType === 'snow' || activeType === 'snow-night';
    const snowCount = 120;
    const snowflakes = Array.from({ length: snowCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 0.8 + 0.2,
      radius: Math.random() * 3.5 + 1.2,
      speed: Math.random() * 1.5 + 0.8,
      wobbleSpeed: Math.random() * 0.03 + 0.01,
      wobbleOffset: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.6 + 0.35,
    }));

    // 3. Stars & Meteors (Night & Moonlit Clouds)
    const isNightAtmosphere = activeType === 'clear-night' || activeType === 'cloudy-night' || activeType === 'snow-night' || activeType === 'rain-night';
    const starCount = activeType === 'clear-night' ? 160 : 80;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.5,
      alpha: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.025 + 0.008,
    }));

    let meteor = null;
    let nextMeteorTime = Date.now() + Math.random() * 4000 + 2000;

    // 4. Sun & Solar Motes
    const hasSun = activeType === 'sunny' || activeType === 'partly-cloudy' || activeType === 'winter-clear';
    const moteCount = 50;
    const motes = Array.from({ length: moteCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3.2 + 1,
      speedY: -(Math.random() * 0.5 + 0.2),
      speedX: Math.random() * 0.4 - 0.2,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    // 5. Volumetric Cumulus Clouds (Multi-puff realistic clusters)
    const hasClouds = activeType === 'partly-cloudy' || activeType === 'overcast' || activeType === 'cloudy-night';
    const numClouds = activeType === 'overcast' ? 10 : (activeType === 'partly-cloudy' ? 7 : 5);
    const cloudsList = Array.from({ length: numClouds }, (_, idx) => {
      const scale = Math.random() * 0.6 + 0.7; // size multiplier
      // Cloud cluster composed of 5 overlapping puffs
      const puffs = [
        { dx: -45 * scale, dy: 10 * scale, r: 42 * scale },
        { dx: -18 * scale, dy: -12 * scale, r: 52 * scale },
        { dx: 22 * scale, dy: -8 * scale, r: 48 * scale },
        { dx: 52 * scale, dy: 12 * scale, r: 38 * scale },
        { dx: 0, dy: 8 * scale, r: 46 * scale },
      ];
      return {
        x: (width / numClouds) * idx + (Math.random() * 120 - 60),
        y: Math.random() * (height * 0.45) + 30,
        speed: (Math.random() * 0.25 + 0.15) * (scale > 1 ? 1.2 : 0.8),
        scale,
        puffs,
        opacity: activeType === 'partly-cloudy' ? (Math.random() * 0.2 + 0.5) : (activeType === 'overcast' ? 0.75 : 0.35),
      };
    });

    // 6. Thunderstorm State
    let lightningOpacity = 0;
    let nextLightning = Date.now() + Math.random() * 4500 + 2000;
    let lightningPath = null;

    let tick = 0;

    // ==========================================
    // RENDER LOOP
    // ==========================================
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      tick++;

      // ---------- 1. STARS & METEORS (NIGHT) ----------
      if (isNightAtmosphere) {
        for (let i = 0; i < stars.length; i++) {
          const st = stars[i];
          st.alpha += st.twinkleSpeed;
          const currentAlpha = 0.25 + 0.75 * Math.abs(Math.sin(st.alpha));
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
          ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Shooting Star / Meteor
        if (activeType === 'clear-night') {
          if (!meteor && Date.now() > nextMeteorTime) {
            meteor = {
              x: Math.random() * (width * 0.7) + width * 0.1,
              y: Math.random() * (height * 0.25) + 20,
              dx: -(Math.random() * 14 + 10),
              dy: Math.random() * 8 + 6,
              length: Math.random() * 90 + 70,
              opacity: 1,
            };
            nextMeteorTime = Date.now() + Math.random() * 6000 + 3500;
          }

          if (meteor) {
            meteor.x += meteor.dx;
            meteor.y += meteor.dy;
            meteor.opacity -= 0.022;

            ctx.beginPath();
            const meteorGrad = ctx.createLinearGradient(
              meteor.x,
              meteor.y,
              meteor.x - meteor.dx * (meteor.length / 15),
              meteor.y - meteor.dy * (meteor.length / 15)
            );
            meteorGrad.addColorStop(0, `rgba(255, 255, 255, ${meteor.opacity})`);
            meteorGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');
            ctx.strokeStyle = meteorGrad;
            ctx.lineWidth = 2.5;
            ctx.moveTo(meteor.x, meteor.y);
            ctx.lineTo(
              meteor.x - meteor.dx * (meteor.length / 15),
              meteor.y - meteor.dy * (meteor.length / 15)
            );
            ctx.stroke();

            if (meteor.opacity <= 0 || meteor.x < -100 || meteor.y > height + 100) {
              meteor = null;
            }
          }
        }
      }

      // ---------- 2. SUN (SUNNY & PARTLY CLOUDY) ----------
      if (hasSun) {
        const sunX = width * 0.84;
        const sunY = Math.min(130, height * 0.16);

        // Radiant Outer Glow
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 340);
        sunGrad.addColorStop(0, 'rgba(255, 245, 160, 0.7)');
        sunGrad.addColorStop(0.2, 'rgba(253, 224, 71, 0.35)');
        sunGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
        sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 340, 0, Math.PI * 2);
        ctx.fill();

        // Inner Brilliant Core
        const coreGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 46);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        coreGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.9)');
        coreGrad.addColorStop(1, 'rgba(251, 191, 36, 0.6)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 46, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Sunbeams
        ctx.save();
        ctx.translate(sunX, sunY);
        ctx.rotate(tick * 0.0008);
        for (let b = 0; b < 8; b++) {
          ctx.rotate(Math.PI / 4);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-45, 520);
          ctx.lineTo(45, 520);
          ctx.closePath();
          ctx.fillStyle = 'rgba(254, 249, 195, 0.04)';
          ctx.fill();
        }
        ctx.restore();

        // Solar Motes
        for (let i = 0; i < motes.length; i++) {
          const m = motes[i];
          m.y += m.speedY;
          m.x += m.speedX + Math.sin(tick * 0.02 + i) * 0.35;
          if (m.y < -10) {
            m.y = height + 10;
            m.x = Math.random() * width;
          }
          ctx.beginPath();
          ctx.fillStyle = `rgba(254, 243, 199, ${m.alpha * (0.6 + 0.4 * Math.sin(tick * 0.03 + i))})`;
          ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ---------- 3. MOON (CLEAR NIGHT & CLOUDY NIGHT) ----------
      if (activeType === 'clear-night' || activeType === 'cloudy-night') {
        const moonX = width * 0.82;
        const moonY = Math.min(130, height * 0.16);

        // Luminous Moon Corona
        const moonGrad = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 200);
        moonGrad.addColorStop(0, 'rgba(224, 231, 255, 0.45)');
        moonGrad.addColorStop(0.4, 'rgba(199, 210, 254, 0.15)');
        moonGrad.addColorStop(1, 'rgba(165, 180, 252, 0)');
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 200, 0, Math.PI * 2);
        ctx.fill();

        // Moon Disc
        const discGrad = ctx.createRadialGradient(moonX - 8, moonY - 8, 2, moonX, moonY, 36);
        discGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        discGrad.addColorStop(0.7, 'rgba(235, 240, 255, 0.9)');
        discGrad.addColorStop(1, 'rgba(200, 215, 245, 0.85)');
        ctx.fillStyle = discGrad;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 36, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---------- 4. DRIFTING VOLUMETRIC CUMULUS CLOUDS ----------
      if (hasClouds) {
        for (let i = 0; i < cloudsList.length; i++) {
          const c = cloudsList[i];
          c.x += c.speed;
          if (c.x - 200 > width) {
            c.x = -200;
            c.y = Math.random() * (height * 0.45) + 30;
          }

          // Render each puff with soft radial gradient
          for (let p = 0; p < c.puffs.length; p++) {
            const puff = c.puffs[p];
            const px = c.x + puff.dx;
            const py = c.y + puff.dy;
            const pr = puff.r;

            const puffGrad = ctx.createRadialGradient(px, py - pr * 0.2, pr * 0.1, px, py, pr);
            if (activeType === 'cloudy-night') {
              puffGrad.addColorStop(0, `rgba(180, 195, 220, ${c.opacity * 0.7})`);
              puffGrad.addColorStop(0.7, `rgba(140, 155, 180, ${c.opacity * 0.35})`);
              puffGrad.addColorStop(1, 'rgba(100, 115, 140, 0)');
            } else if (activeType === 'overcast') {
              puffGrad.addColorStop(0, `rgba(230, 235, 245, ${c.opacity * 0.8})`);
              puffGrad.addColorStop(0.65, `rgba(195, 205, 220, ${c.opacity * 0.5})`);
              puffGrad.addColorStop(1, 'rgba(160, 175, 195, 0)');
            } else {
              // Vibrant white daytime cumulus puff with sunlight
              puffGrad.addColorStop(0, `rgba(255, 255, 255, ${c.opacity * 0.85})`);
              puffGrad.addColorStop(0.6, `rgba(240, 245, 255, ${c.opacity * 0.6})`);
              puffGrad.addColorStop(1, 'rgba(215, 230, 255, 0)');
            }

            ctx.beginPath();
            ctx.fillStyle = puffGrad;
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ---------- 5. RAIN & THUNDERSTORM ----------
      if (isRain) {
        // Lightning trigger & branching paths
        if (activeType === 'thunderstorm') {
          if (Date.now() > nextLightning) {
            lightningOpacity = 0.9;
            nextLightning = Date.now() + Math.random() * 5000 + 2500;
            // Generate branching lightning bolt
            lightningPath = [];
            let lx = Math.random() * (width * 0.6) + width * 0.2;
            let ly = 0;
            lightningPath.push({ x: lx, y: ly });
            while (ly < height * 0.75) {
              lx += (Math.random() - 0.5) * 60;
              ly += Math.random() * 40 + 20;
              lightningPath.push({ x: lx, y: ly });
            }
          }

          if (lightningOpacity > 0.01) {
            // Screen flash
            ctx.fillStyle = `rgba(225, 235, 255, ${lightningOpacity * 0.8})`;
            ctx.fillRect(0, 0, width, height);

            // Draw bolt
            if (lightningPath && lightningPath.length > 1) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(255, 255, 255, ${lightningOpacity})`;
              ctx.lineWidth = 3;
              ctx.shadowColor = '#93c5fd';
              ctx.shadowBlur = 15;
              ctx.moveTo(lightningPath[0].x, lightningPath[0].y);
              for (let pt = 1; pt < lightningPath.length; pt++) {
                ctx.lineTo(lightningPath[pt].x, lightningPath[pt].y);
              }
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
            lightningOpacity *= 0.84;
          }
        }

        // Draw Raindrops
        for (let i = 0; i < raindrops.length; i++) {
          const d = raindrops[i];
          d.y += d.speed * d.z;
          d.x += d.wind * d.z;

          if (d.y > height - 20) {
            if (Math.random() < 0.35) {
              createSplash(d.x, height - 15, d.z);
            }
            d.y = -d.length;
            d.x = Math.random() * (width + 200) - 100;
          }
          if (d.x < -100) d.x = width + 50;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(200, 225, 255, ${d.opacity * d.z})`;
          ctx.lineWidth = Math.max(1.2, 2 * d.z);
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + d.wind * (d.length / 5), d.y + d.length * d.z);
          ctx.stroke();
        }

        // Draw Splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.radius += 0.9;
          s.opacity *= 0.91;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(215, 235, 255, ${s.opacity})`;
          ctx.lineWidth = 1.2;
          ctx.ellipse(s.x, s.y, s.radius * 2, s.radius * 0.7, 0, 0, Math.PI * 2);
          ctx.stroke();

          if (s.opacity <= 0.04 || s.radius >= s.maxRadius) {
            splashes.splice(i, 1);
          }
        }
      }

      // ---------- 6. SNOW ----------
      if (isSnow) {
        for (let i = 0; i < snowflakes.length; i++) {
          const f = snowflakes[i];
          f.y += f.speed * f.z;
          f.x += Math.sin(tick * f.wobbleSpeed + f.wobbleOffset) * 0.9;

          if (f.y > height + 10) {
            f.y = -10;
            f.x = Math.random() * width;
          }

          ctx.beginPath();
          const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * f.z);
          grad.addColorStop(0, `rgba(255, 255, 255, ${f.opacity * f.z})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = grad;
          ctx.arc(f.x, f.y, f.radius * f.z * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeType]);

  return (
    <div className={`weather-bg-container ${activeType}`}>
      <canvas ref={canvasRef} className="weather-bg-canvas" />
      <div className="weather-bg-overlay" />
    </div>
  );
}

export default WeatherBackground;
