// render-food.js — every ingredient drawn as vector art on the canvas.
// No images, no emoji, no fonts needed: circles, arcs and curves only, so the
// food reads the same in any browser. drawIngredient(ctx, id, x, y, r) draws
// one item centred at (x, y) inside a circle of radius r.

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color, rot = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

function rr(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

export function drawIngredient(ctx, id, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  const s = r / 30; // shapes are authored in a 30-unit box
  ctx.scale(s, s);
  switch (id) {
    case 'bun': {
      // golden dome with sesame seeds
      ctx.fillStyle = '#e8b25c';
      ctx.beginPath();
      ctx.arc(0, 4, 26, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      rr(ctx, -26, 4, 52, 9, 4, '#d99a3f');
      ctx.fillStyle = '#fff3cf';
      for (const [sx, sy] of [[-14, -12], [0, -18], [14, -12], [-7, -6], [8, -6]]) {
        ellipse(ctx, sx, sy, 3, 2, '#fff3cf', 0.4);
      }
      break;
    }
    case 'patty': {
      rr(ctx, -26, -10, 52, 22, 10, '#a85b3a');
      ctx.strokeStyle = '#6e3520';
      ctx.lineWidth = 3;
      for (const gx of [-14, 0, 14]) {
        ctx.beginPath();
        ctx.moveTo(gx, -8);
        ctx.lineTo(gx, 10);
        ctx.stroke();
      }
      break;
    }
    case 'patty_grilled': {
      rr(ctx, -26, -10, 52, 22, 10, '#8a4a28');
      ctx.strokeStyle = '#3d1f0e';
      ctx.lineWidth = 4;
      for (const gx of [-16, -4, 8]) {
        ctx.beginPath();
        ctx.moveTo(gx, -9);
        ctx.lineTo(gx + 4, 10);
        ctx.stroke();
      }
      ctx.fillStyle = '#5c2f16';
      circle(ctx, -10, 2, 3, '#5c2f16');
      circle(ctx, 12, -2, 2.5, '#5c2f16');
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = '#7dc24a';
      for (const [lx, ly, rot] of [[-12, 2, -0.5], [0, -4, 0], [12, 2, 0.5]]) {
        ctx.beginPath();
        ctx.ellipse(lx, ly, 13, 17, rot, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#4a8a26';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(0, 14);
      ctx.stroke();
      break;
    }
    case 'lettuce_chopped': {
      ctx.strokeStyle = '#8fd45e';
      ctx.lineCap = 'round';
      ctx.lineWidth = 5;
      for (const [x1, y1, x2, y2] of [[-20, -8, -4, -14], [-16, 4, 2, -2], [-8, 14, 8, 8], [4, -12, 20, -6], [0, 2, 20, 10]]) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      break;
    }
    case 'tomato': {
      circle(ctx, 0, 2, 24, '#e5484d');
      ctx.fillStyle = '#c22f34';
      ctx.beginPath();
      ctx.arc(-8, -6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a8a26';
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.55;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(Math.cos(a) * 12, -18 + Math.sin(a) * 12);
        ctx.lineTo(Math.cos(a + 0.3) * 7, -18 + Math.sin(a + 0.3) * 7);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'tomato_chopped': {
      ctx.fillStyle = '#f2605e';
      for (const [wx, wy, rot] of [[-12, -6, -0.6], [10, -8, 0.5], [0, 10, 0.1]]) {
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + 16 * Math.cos(rot), wy + 16 * Math.sin(rot));
        ctx.lineTo(wx + 6 * Math.cos(rot + 1.2), wy + 6 * Math.sin(rot + 1.2));
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#ffd0c8';
      circle(ctx, -8, -2, 3, '#ffd0c8');
      circle(ctx, 10, 8, 3, '#ffd0c8');
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.moveTo(-24, 14);
      ctx.lineTo(0, -20);
      ctx.lineTo(24, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c8931a';
      circle(ctx, -6, 4, 3.5, '#c8931a');
      circle(ctx, 8, -2, 3, '#c8931a');
      circle(ctx, 4, 9, 2.5, '#c8931a');
      break;
    }
    case 'cheese_sliced': {
      rr(ctx, -24, -14, 48, 28, 4, '#ffd94d');
      ctx.strokeStyle = '#e0a92e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-24, 0);
      ctx.lineTo(24, 0);
      ctx.stroke();
      ctx.fillStyle = '#c8931a';
      circle(ctx, -10, -7, 3, '#c8931a');
      circle(ctx, 10, 7, 3, '#c8931a');
      break;
    }
    case 'noodles': {
      ctx.strokeStyle = '#f2d06b';
      ctx.lineCap = 'round';
      ctx.lineWidth = 5;
      for (let i = 0; i < 3; i++) {
        const y0 = -12 + i * 12;
        ctx.beginPath();
        ctx.moveTo(-24, y0);
        for (let px = -24; px <= 24; px += 8) {
          ctx.lineTo(px, y0 + (px % 16 === 0 ? -5 : 5));
        }
        ctx.stroke();
      }
      break;
    }
    case 'noodles_boiled': {
      ctx.strokeStyle = '#ffe08a';
      ctx.lineCap = 'round';
      ctx.lineWidth = 6;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-6 + i * 4, 0, 12 - i, 0.4, Math.PI * 1.8);
        ctx.stroke();
      }
      ctx.fillStyle = '#fff6d8';
      circle(ctx, 14, -12, 3, '#fff6d8');
      break;
    }
    case 'rice': {
      ctx.fillStyle = '#f5f0e1';
      ctx.beginPath();
      ctx.arc(0, 6, 24, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d9cfae';
      circle(ctx, -10, -4, 2.5, '#d9cfae');
      circle(ctx, 4, -10, 2.5, '#d9cfae');
      circle(ctx, 12, -2, 2, '#d9cfae');
      break;
    }
    case 'rice_boiled': {
      ctx.fillStyle = '#fffaf0';
      ctx.beginPath();
      ctx.arc(0, 6, 24, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e8ddc0';
      for (const [dx, dy] of [[-12, -2], [-2, -10], [8, -4], [14, 2], [0, 2]]) {
        circle(ctx, dx, dy, 2.2, '#e8ddc0');
      }
      break;
    }
    case 'fish': {
      ctx.fillStyle = '#f2a0a8';
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(30, -8);
      ctx.lineTo(30, 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c96a74';
      ctx.lineWidth = 2.5;
      for (const fx of [-10, 0, 10]) {
        ctx.beginPath();
        ctx.moveTo(fx, -10);
        ctx.lineTo(fx, 10);
        ctx.stroke();
      }
      circle(ctx, -18, -3, 2.5, '#5c2f16');
      break;
    }
    case 'fish_chopped': {
      ctx.fillStyle = '#ffb3ba';
      for (const [sx, sy, rot] of [[-14, -4, -0.4], [0, 4, 0.2], [14, -6, 0.6]]) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = '#e88a94';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-20, 12);
      ctx.lineTo(20, -12);
      ctx.stroke();
      break;
    }
    case 'seaweed': {
      rr(ctx, -8, -24, 16, 48, 3, '#2e5d3a');
      ctx.strokeStyle = '#5a9a68';
      ctx.lineWidth = 2;
      for (const sy of [-14, -4, 6, 16]) {
        ctx.beginPath();
        ctx.moveTo(-5, sy);
        ctx.lineTo(5, sy);
        ctx.stroke();
      }
      break;
    }
    case 'burnt': {
      ctx.fillStyle = '#3a2a22';
      ctx.beginPath();
      ctx.arc(-6, 4, 14, 0, Math.PI * 2);
      ctx.arc(10, 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c130e';
      circle(ctx, -8, 0, 4, '#1c130e');
      circle(ctx, 10, -2, 3, '#1c130e');
      ctx.strokeStyle = 'rgba(200,200,200,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.quadraticCurveTo(4, -22, 0, -28);
      ctx.stroke();
      break;
    }
    default: {
      circle(ctx, 0, 0, 22, '#888');
    }
  }
  ctx.restore();
}

// Small chip: a pale disc behind the icon, used on tickets and in the recipe book.
export function drawIngredientChip(ctx, id, x, y, r) {
  ctx.save();
  ctx.fillStyle = '#f0e2c8';
  ctx.strokeStyle = 'rgba(120,80,40,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawIngredient(ctx, id, x, y, r * 0.78);
  ctx.restore();
}
