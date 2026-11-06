// Arranque: obtiene el canvas y lo deja en blanco (fondo liso).
const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error('No se encontró el canvas con id "game".');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('No se pudo obtener el contexto 2D del canvas.');
}

ctx.fillStyle = '#000';
ctx.fillRect(0, 0, canvas.width, canvas.height);
