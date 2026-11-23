
/*
ARTISTA: Susana Rendón
ÁLBUM: Margen de Error
PROYECTO: El arte de equivocarse

Diario interactivo creado con p5.js y p5.sound.

PÁGINAS:
0. Portada
1. Índice
2. Sobre Susy
3. Margen de Error
4. Prometiste la Luna
5. Mr. Perfecto
6. Cada Pez
*/

// ==========================================
// CONFIGURACIÓN
// ==========================================

const W = 1200;
const H = 675;

const VINO = "#693B50";
const OSCURO = "#48283A";
const TINTA = "#654858";
const AZUL = "#547C95";
const CREMA = "#F8F1E4";

let pagina = 0;
let imagenes = {};
let sonidos = {};
let zonas = [];

let sonidoActual = null;
let claveActual = "";
let volumen = 0.65;
let muteado = false;

let fft, amplitud;
let energia = 0;
let tiempo = 0;

let modal = "";
let historiaMargen = false;
let historiaPerfecto = false;
let historiaPeces = false;
let frasesLuna = [false, false, false];

// ==========================================
// ARCHIVOS DE LA CARPETA ASSETS
// ==========================================

const fotos = {
  libro: "libro abierto.jpeg",
  portada: "portada diario.jpeg",
  album: "portada.jpeg",
  susy: "foto susy byn.png",
  guitarra: "foto susy guitarra.png",
  cantando: "susy cantando.png",
  cafe: "cafe susy.png",
  perfecto: "hombre per.png",
  peces: "peces.png",
  estrellas: "hoja de estrellas.jpeg"
};

const audios = {
  bienvenida: "bienvenida.mp3",
  cafe: "cafe.mp3",
  margen: "margen de error.mp3",
  luna: "Prometiste la luna.mp3",
  perfecto: "Mr Perfecto.mp3",
  pez: "cada pez.mp3"
};

// ==========================================
// CARGAR IMÁGENES Y AUDIOS
// ==========================================

function preload() {
  for (let nombre in fotos) {
    imagenes[nombre] = loadImage(
      "assets/" + fotos[nombre],
      () => {},
      () => {
        console.warn("No se encontró:", fotos[nombre]);
        imagenes[nombre] = null;
      }
    );
  }

  for (let nombre in audios) {
    sonidos[nombre] = loadSound(
      "assets/" + audios[nombre],
      () => {},
      () => {
        console.warn("No se encontró:", audios[nombre]);
        sonidos[nombre] = null;
      }
    );
  }
}

// ==========================================
// SETUP Y DRAW
// ==========================================

function setup() {
  let canvas = createCanvas(W, H);

  // Funciona con o sin div id="diario"
  if (document.getElementById("diario")) {
    canvas.parent("diario");
  }

  textFont("Georgia");
  textWrap(WORD);
  imageMode(CORNER);

  fft = new p5.FFT(0.85, 64);
  amplitud = new p5.Amplitude();
}

function draw() {
  background(OSCURO);
  zonas = [];
  tiempo += 0.025;

  if (sonidoActual && sonidoActual.isPlaying()) {
    energia = lerp(
      energia,
      amplitud.getLevel(),
      0.15
    );
  } else {
    energia = lerp(energia, 0, 0.08);
  }

  if (pagina === 0) {
    portada();
  } else {
    diario();

    switch (pagina) {
      case 1:
        indice();
        break;
      case 2:
        sobreSusy();
        break;
      case 3:
        margenError();
        break;
      case 4:
        prometisteLuna();
        break;
      case 5:
        mrPerfecto();
        break;
      case 6:
        cadaPez();
        break;
    }

    navegacion();
  }

  controlesSonido();

  if (modal !== "") {
    dibujarModal();
  }
}

// ==========================================
// COORDENADAS FIJAS DEL CUADERNO
// ==========================================

// Imagen del cuaderno:
// x = 150, y = 58
// ancho = 900, alto = 560
//
// HOJA IZQUIERDA:
// x = 190 hasta 570
//
// HOJA DERECHA:
// x = 640 hasta 1010
//
// Los elementos no deben cruzar
// el centro del cuaderno.

function diario() {
  if (imagenes.libro) {
    image(imagenes.libro, 150, 58, 900, 560);
  } else {
    fill(CREMA);
    noStroke();
    rect(150, 58, 900, 560, 20);

    stroke("#B6A08C");
    strokeWeight(2);
    line(600, 65, 600, 610);
    noStroke();
  }
}

// ==========================================
// FUNCIONES DE DISEÑO
// ==========================================

function texto(
  contenido, x, y, tam = 20,
  color = TINTA, ancho = 340,
  estilo = NORMAL
) {
  push();
  fill(color);
  noStroke();
  textSize(tam);
  textStyle(estilo);
  textAlign(LEFT, TOP);
  textLeading(tam * 1.4);
  text(contenido, x, y, ancho);
  pop();
}

function titulo(contenido, x, y, tam = 32) {
  texto(contenido, x, y, tam, VINO, 360, BOLD);
}

function boton(
  contenido, x, y, w, h,
  accion, color = VINO
) {
  push();
  noStroke();
  fill(color);
  rect(x, y, w, h, 9);

  fill("#FFFFFF");
  textFont("Georgia");
  textStyle(BOLD);
  textSize(15);
  textAlign(CENTER, CENTER);
  text(contenido, x + w / 2, y + h / 2);
  pop();

  zonas.push({ x, y, w, h, accion });
}

function zona(x, y, w, h, accion) {
  zonas.push({ x, y, w, h, accion });
}

function foto(nombre, x, y, w, h, rot = 0) {
  push();
  translate(x + w / 2, y + h / 2);
  rotate(rot);

  noStroke();
  fill(255, 250, 242);
  rect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 35);

  if (imagenes[nombre]) {
    image(
      imagenes[nombre],
      -w / 2, -h / 2, w, h
    );
  } else {
    fill("#D7C5BF");
    rect(-w / 2, -h / 2, w, h);
    fill(VINO);
    textAlign(CENTER, CENTER);
    textSize(15);
    text(nombre, 0, 0);
  }

  // Cinta adhesiva
  fill(225, 205, 165, 190);
  rect(-35, -h / 2 - 16, 70, 20, 2);

  pop();
}

function papel(
  contenido, x, y, w, h,
  color = "#EBD6DC", tam = 19
) {
  push();
  noStroke();
  fill(color);
  rect(x, y, w, h, 4);

  fill(TINTA);
  textSize(tam);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  textLeading(tam * 1.35);
  text(contenido, x + 18, y + 17, w - 36);
  pop();
}

function notaAzul(contenido, x, y, w, h) {
  push();
  noStroke();
  fill("#A9C5D5");
  rect(x, y, w, h, 3);

  fill("#34576C");
  textSize(17);
  textStyle(ITALIC);
  textAlign(CENTER, CENTER);
  text(contenido, x + 10, y + 10, w - 20, h - 20);
  pop();
}

function botonMusica(clave, x = 680, y = 525) {
  boton(
    "♫ ESCUCHAR / PAUSAR",
    x, y, 280, 43,
    () => reproducir(clave)
  );
}

// ==========================================
// PORTADA
// ==========================================

function portada() {
  if (imagenes.portada) {
    image(imagenes.portada, 250, 55, 700, 565);
  } else {
    fill("#BDA58B");
    noStroke();
    rect(285, 75, 630, 520, 18);
  }

  fill(0, 0, 0, 105);
  noStroke();
  rect(350, 215, 500, 205, 12);

  push();
  textAlign(CENTER, CENTER);
  fill("#FFFFFF");
  textStyle(BOLD);
  textSize(43);
  text("EL ARTE DE", 600, 255);
  text("EQUIVOCARSE", 600, 307);

  textStyle(ITALIC);
  textSize(17);
  text(
    "Un diario de Susana Rendón",
    600, 362
  );
  pop();

  boton(
    "ABRIR EL DIARIO",
    465, 470, 270, 48,
    () => cambiarPagina(1)
  );

  texto(
    "Las mejores historias empiezan con un café y terminan en una canción.",
    355, 555, 16, "#FFFFFF", 490, ITALIC
  );
}

// ==========================================
// ÍNDICE
// ==========================================

function indice() {
  titulo("ÍNDICE", 195, 100, 37);

  texto(
    "Cada página guarda una canción, un recuerdo y una forma de equivocarse.",
    195, 165, 21, TINTA, 340, ITALIC
  );

  texto(
    "Haz clic en una historia para abrirla.",
    195, 270, 17, AZUL, 340
  );

  boton(
    "01. SOBRE SUSY",
    195, 350, 340, 43,
    () => cambiarPagina(2)
  );

  boton(
    "02. MARGEN DE ERROR",
    195, 406, 340, 43,
    () => cambiarPagina(3)
  );

  boton(
    "03. PROMETISTE LA LUNA",
    195, 462, 340, 43,
    () => cambiarPagina(4)
  );

  titulo("Canciones y recuerdos", 660, 110, 25);

  boton(
    "04. MR. PERFECTO",
    655, 205, 335, 45,
    () => cambiarPagina(5)
  );

  boton(
    "05. CADA PEZ",
    655, 265, 335, 45,
    () => cambiarPagina(6)
  );

  papel(
    "Una colección de primeras veces, errores y aprendizajes.",
    665, 375, 310, 115,
    "#EBD6DC", 20
  );
}

// ==========================================
// SOBRE SUSY
// ==========================================

function sobreSusy() {
  titulo("01. SOBRE SUSY", 195, 105, 31);

  texto(
    "Susy (19 años). Nacida en Manizales, crecí entre la música, el café y los viajes. Escribí mi primera canción a los 8 años, canté en restaurantes a los 11 y fui guitarrista en La Voz Kids a los 13.",
    195, 175, 18, TINTA, 350
  );

  texto(
    "Tras lanzar mi debut 'Margen de Error' a los 16, este diario reúne las historias y el aprendizaje de abrazar la vulnerabilidad.",
    195, 365, 18, TINTA, 350
  );

  foto("susy", 690, 125, 185, 210, -0.04);
  foto("cantando", 850, 300, 130, 145, 0.07);

  // Taza de café
  push();
  fill("#B98C6B");
  noStroke();
  ellipse(710, 460, 95, 37);

  fill("#F5E8D7");
  ellipse(710, 451, 80, 27);

  fill("#65432F");
  ellipse(710, 449, 61, 17);

  noFill();
  stroke("#B98C6B");
  strokeWeight(8);
  arc(762, 454, 35, 39, -HALF_PI, HALF_PI);
  pop();

  texto(
    "Haz clic en el café",
    655, 495, 15, AZUL, 170, ITALIC
  );

  zona(660, 420, 115, 70, () => {
    reproducirEfecto("cafe");
    modal = "susy";
  });

  // Audífonos retro
  push();
  noFill();
  stroke(VINO);
  strokeWeight(10);
  arc(910, 170, 100, 110, PI, TWO_PI);
  line(860, 170, 860, 220);
  line(960, 170, 960, 220);
  fill(VINO);
  noStroke();
  rect(845, 180, 28, 58, 10);
  rect(947, 180, 28, 58, 10);
  pop();

  texto(
    "Clic en los audífonos",
    845, 255, 15, AZUL, 150, ITALIC
  );

  zona(840, 120, 145, 125, () => {
    reproducir("bienvenida");
  });
}

// ==========================================
// MARGEN DE ERROR
// ==========================================

function margenError() {
  titulo("02. MARGEN", 195, 105, 31);
  titulo("DE ERROR", 195, 145, 31);

  texto(
    "La primera canción que publiqué a los 16 años. Nació recopilando las historias de primeras relaciones que se acaban por motivos absurdos y que forman parte del margen de error indispensable para aprender.",
    195, 215, 18, TINTA, 345
  );

  papel(
    "ABRAZAR LA\nVULNERABILIDAD",
    205, 425, 315, 90,
    "#EBD6DC", 23
  );

  // Foto nueva: Susy con guitarra
  foto("guitarra", 705, 120, 225, 270, 0.035);

  texto(
    "Las historias que se convierten en canciones.",
    675, 425, 18, TINTA, 300, ITALIC
  );

  boton(
    "DESCUBRIR LA HISTORIA",
    665, 465, 320, 42,
    () => {
      historiaMargen = !historiaMargen;
      modal = historiaMargen ? "margen" : "";
    }
  );

  botonMusica("margen", 685, 525);
}

// ==========================================
// PROMETISTE LA LUNA
// ==========================================

function prometisteLuna() {
  titulo("03. PROMETISTE", 195, 100, 29);
  titulo("LA LUNA", 195, 140, 29);

  texto(
    "Escrita a los 14 años. Un catálogo ilustrado de las frases cliché que dicen los hombres según nosotras.",
    195, 205, 18, TINTA, 345
  );

  texto(
    "Haz clic en cada papel azul.",
    195, 305, 16, AZUL, 340, ITALIC
  );

  const frases = [
    "Eres diferente\na las demás",
    "Te prometo\nla luna",
    "No soy yo,\neres tú"
  ];

  for (let i = 0; i < 3; i++) {
    let x = 195 + i * 117;
    let y = 360 + (i % 2) * 12;

    notaAzul(
      frasesLuna[i] ? frases[i] : "HAZ CLIC\n✦",
      x, y, 105, 140
    );

    zona(x, y, 105, 140, () => {
      frasesLuna[i] = !frasesLuna[i];
    });
  }

  texto(
    "Promesas que parecían estrellas...",
    660, 110, 19, VINO, 320, ITALIC
  );

  // Luna animada por la música
  let tamaño = 145 + energia * 220;

  push();
  translate(830, 320);
  rotate(tiempo * 0.09);

  noStroke();
  fill("#E7D8B7");
  ellipse(0, 0, tamaño);

  fill("#C8B89F");
  ellipse(-28, -22, tamaño * 0.23);
  ellipse(30, 25, tamaño * 0.17);
  ellipse(-8, 42, tamaño * 0.12);
  pop();

  // Estrellas que responden al sonido
  push();
  noStroke();
  fill("#C9A16D");

  for (let i = 0; i < 23; i++) {
    let a = i * 2.4 + tiempo * 0.3;
    let r = 105 + (i % 4) * 18 + energia * 130;

    let x = 830 + cos(a) * r;
    let y = 320 + sin(a) * r;

    ellipse(x, y, 3 + energia * 18);
  }
  pop();

  texto(
    "Haz clic en la luna ✦",
    750, 435, 17, VINO, 210, ITALIC
  );

  zona(740, 225, 190, 190, () => {
    modal = "luna";
  });

  botonMusica("luna", 680, 525);
}

// ==========================================
// MR. PERFECTO
// ==========================================

function mrPerfecto() {
  titulo("04. MR. PERFECTO", 195, 105, 29);

  texto(
    "Detrás del escaparate no había nada perfecto; solo un juego frente al espejo.",
    195, 185, 21, TINTA, 345, ITALIC
  );

  papel(
    "¿Y si lo perfecto\nnunca existió?",
    205, 335, 310, 105,
    "#EAD9D4", 22
  );

  texto(
    "Haz clic en la ilustración.",
    195, 480, 16, AZUL, 335, ITALIC
  );

  // Ilustración más grande
  foto("perfecto", 690, 120, 245, 305, -0.02);

  zona(685, 115, 265, 330, () => {
    historiaPerfecto = !historiaPerfecto;
    reproducir("perfecto");
    modal = "perfecto";
  });

  texto(
    "Una imagen no siempre cuenta toda la historia.",
    665, 450, 17, VINO, 310, ITALIC
  );

  botonMusica("perfecto", 680, 525);
}

// ==========================================
// CADA PEZ
// ==========================================

function cadaPez() {
  titulo("05. CADA PEZ", 195, 105, 32);

  texto(
    "“Odio que cada pez traiga una parte de ti y me ancle de vuelta.”",
    195, 180, 22, AZUL, 345, ITALIC
  );

  texto(
    "Haz clic en los peces para descubrir la historia.",
    195, 320, 17, AZUL, 335, ITALIC
  );

  papel(
    "A veces el mar también guarda recuerdos.",
    205, 400, 310, 100,
    "#D9E8E9", 19
  );

  // Peces en la hoja derecha
  if (imagenes.peces) {
    image(imagenes.peces, 655, 165, 330, 290);
  } else {
    fill("#AFCAD5");
    noStroke();
    ellipse(815, 300, 170, 80);
    triangle(735, 300, 675, 250, 675, 350);
  }

  // Olas animadas por la música
  push();
  noFill();
  stroke("#76AAC6");
  strokeWeight(2);

  for (let j = 0; j < 4; j++) {
    beginShape();

    for (let x = 660; x <= 985; x += 9) {
      let y =
        245 + j * 55 +
        sin(x * 0.035 + tiempo * 2 + j) *
        (7 + energia * 100);

      vertex(x, y);
    }

    endShape();
  }
  pop();

  zona(655, 165, 330, 290, () => {
    historiaPeces = !historiaPeces;
    reproducir("pez");
    modal = "pez";
  });

  botonMusica("pez", 680, 525);
}

// ==========================================
// VENTANAS MODALES
// ==========================================

function dibujarModal() {
  push();

  fill(30, 15, 25, 185);
  noStroke();
  rect(0, 0, W, H);

  fill("#FFF8ED");
  rect(320, 145, 560, 390, 16);

  fill(VINO);
  textSize(23);
  textStyle(BOLD);
  textAlign(LEFT, TOP);

  let tituloModal = "";
  let contenido = "";

  if (modal === "susy") {
    tituloModal = "Un café con Susy";
    contenido =
      "Entre Manizales, la música, el café y los viajes, comenzaron las historias que hoy viven en este diario.";
  }

  if (modal === "margen") {
    tituloModal = "Margen de Error";
    contenido =
      "La primera canción que publiqué a los 16 años. Una colección de primeras relaciones, equivocaciones y aprendizajes que me enseñaron a abrazar la vulnerabilidad.";
  }

  if (modal === "luna") {
    tituloModal = "Prometiste la Luna";
    contenido =
      "Escrita a los 14 años. Una canción sobre esas promesas enormes que a veces se quedan solamente en palabras.";
  }

  if (modal === "perfecto") {
    tituloModal = "Mr. Perfecto";
    contenido =
      "Detrás del escaparate no había nada perfecto; solo un juego frente al espejo.";
  }

  if (modal === "pez") {
    tituloModal = "Cada Pez";
    contenido =
      "Dijeron que había muchos peces en el mar, pero a veces las olas solo te traen de regreso al mismo lugar.";
  }

  text(tituloModal, 365, 190);

  fill(TINTA);
  textStyle(NORMAL);
  textSize(21);
  textLeading(32);
  text(contenido, 365, 270, 465);

  pop();

  boton(
    "CERRAR ✕",
    700, 465, 125, 40,
    () => modal = ""
  );
}

// ==========================================
// NAVEGACIÓN
// ==========================================

function navegacion() {
  // Botones debajo del cuaderno
  boton(
    "←",
    155, 625, 65, 35,
    () => cambiarPagina(max(0, pagina - 1))
  );

  boton(
    "ÍNDICE",
    510, 625, 180, 35,
    () => cambiarPagina(1)
  );

  boton(
    "→",
    980, 625, 65, 35,
    () => cambiarPagina(min(6, pagina + 1))
  );

  push();
  fill("#EEDDE5");
  noStroke();
  textAlign(CENTER);
  textSize(14);
  text(
    pagina + " / 6",
    600, 605
  );
  pop();
}

function cambiarPagina(nueva) {
  if (nueva < 0 || nueva > 6) return;

  pagina = nueva;
  modal = "";

  // Detener la canción anterior
  detenerAudio();
}

// ==========================================
// CONTROLES DE SONIDO
// ==========================================

function controlesSonido() {
  push();
  noStroke();
  fill("#F5E9DD");
  rect(745, 8, 425, 43, 9);

  fill(VINO);
  textSize(13);
  textAlign(LEFT, CENTER);
  text("SONIDO", 758, 29);
  pop();

  boton(
    muteado ? "UNMUTE" : "MUTE",
    820, 13, 85, 32,
    () => {
      muteado = !muteado;
      actualizarVolumen();
    }
  );

  boton(
    "−",
    915, 13, 35, 32,
    () => {
      volumen = max(0, volumen - 0.1);
      actualizarVolumen();
    }
  );

  boton(
    "+",
    960, 13, 35, 32,
    () => {
      volumen = min(1, volumen + 0.1);
      actualizarVolumen();
    }
  );

  boton(
    sonidoActual && sonidoActual.isPlaying()
      ? "Ⅱ"
      : "▶",
    1005, 13, 45, 32,
    () => {
      if (!sonidoActual) return;

      if (sonidoActual.isPlaying()) {
        sonidoActual.pause();
      } else {
        userStartAudio();
        sonidoActual.play();
      }
    }
  );

  push();
  fill(VINO);
  textSize(14);
  textAlign(LEFT, CENTER);
  text(round(volumen * 100) + "%", 1060, 29);
  pop();
}

function reproducir(clave) {
  userStartAudio();

  let nuevo = sonidos[clave];
  if (!nuevo) return;

  if (sonidoActual === nuevo) {
    if (nuevo.isPlaying()) {
      nuevo.pause();
    } else {
      nuevo.play();
    }
    return;
  }

  detenerAudio();

  sonidoActual = nuevo;
  claveActual = clave;

  actualizarVolumen();
  sonidoActual.play();

  fft.setInput(sonidoActual);
  amplitud.setInput(sonidoActual);
}

function reproducirEfecto(clave) {
  userStartAudio();

  let efecto = sonidos[clave];
  if (!efecto) return;

  efecto.setVolume(0.65);
  efecto.play();
}

function actualizarVolumen() {
  if (sonidoActual) {
    sonidoActual.setVolume(
      muteado ? 0 : volumen
    );
  }
}

function detenerAudio() {
  if (sonidoActual) {
    sonidoActual.stop();
  }

  sonidoActual = null;
  claveActual = "";
}

// ==========================================
// INTERACCIÓN CON EL MOUSE
// ==========================================

function mousePressed() {
  // Revisar las zonas desde la última
  // para dar prioridad a botones superiores
  for (let i = zonas.length - 1; i >= 0; i--) {
    let z = zonas[i];

    if (
      mouseX >= z.x &&
      mouseX <= z.x + z.w &&
      mouseY >= z.y &&
      mouseY <= z.y + z.h
    ) {
      z.accion();
      return false;
    }
  }

  return false;
}

// ==========================================
// TECLADO
// ==========================================

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    cambiarPagina(min(6, pagina + 1));
  }

  if (keyCode === LEFT_ARROW) {
    cambiarPagina(max(0, pagina - 1));
  }

  if (key === "i" || key === "I") {
    cambiarPagina(1);
  }

  if (keyCode === ESCAPE) {
    modal = "";
  }
}
